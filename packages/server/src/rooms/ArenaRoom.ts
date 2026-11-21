import type RAPIER from "@dimforge/rapier3d-compat";
import type { World as RapierWorld } from "@dimforge/rapier3d-compat";
import { Room, type Client, type StepContext } from "colyseus";
import {
  DEFAULT_HAT_ID,
  DUMMY_SESSION_ID,
  FIXED_DT_SEC,
  initRapier,
  MAX_COMBAT_BOTS,
  NET_MSG,
  PLAYER_COLORS,
  sanitizeBodyColor,
  sanitizeBotDifficulty,
  sanitizeDeviceType,
  sanitizeDisplayName,
  sanitizeGameMode,
  sanitizeHatId,
  SUNLIT_COURTYARD_MAP,
  TICK_RATE,
  type DeviceType,
  type HatId,
  type JoinRoomOptions,
} from "@upgun/shared";
import { ArenaPropSystem, getBotProfile } from "../arena";
import { syncArenaPropsToSchema } from "../arena/schemaSync";
import { CheatSystem } from "../cheats";
import { CommsSystem } from "../comms";
import { GameModeSystem } from "../modes";
import { ArenaState } from "../schema/ArenaState";
import { CombatSystem } from "../systems/CombatSystem";
import { DraftSystem } from "../systems/DraftSystem";
import { GrenadeSystem } from "../systems/GrenadeSystem";
import { MapManager } from "../systems/MapManager";
import { MeleeSystem } from "../systems/MeleeSystem";
import { PlayerEntity } from "../systems/PlayerEntity";
import { allocateRoomCode, releaseRoomCode } from "../systems/RoomCodeRegistry";
import { RoundSystem } from "../systems/RoundSystem";
import { registerArenaRoomMessages } from "./ArenaRoomMessages";
import { stepArenaSimulation } from "./ArenaRoomStep";
import { KillstreakTracker } from "./KillstreakTracker";
import { SpectatorTracker } from "./SpectatorTracker";

export class ArenaRoom extends Room<{ state: ArenaState }> {
  state = new ArenaState();
  maxClients = 8;

  private rapier: typeof RAPIER | null = null;
  private world: RapierWorld | null = null;
  private readonly players = new Map<string, PlayerEntity>();
  private readonly colliderToSession = new Map<number, string>();
  private readonly grenadeSystem = new GrenadeSystem();
  private readonly combatSystem = new CombatSystem();
  private readonly meleeSystem = new MeleeSystem();
  private readonly draftSystem = new DraftSystem();
  private readonly roundSystem = new RoundSystem();
  private readonly mapManager = new MapManager();
  private readonly propSystem = new ArenaPropSystem();
  private readonly cheatSystem = new CheatSystem();
  private readonly killstreakTracker = new KillstreakTracker();
  private readonly modeSystem = new GameModeSystem();
  private readonly commsSystem = new CommsSystem();
  private readonly spectatorTracker = new SpectatorTracker();
  private playerCounter = 0;
  private botCounter = 0;
  private allocatedRoomCode = "";

  async onCreate(options?: JoinRoomOptions): Promise<void> {
    const code = await allocateRoomCode(this.presence);
    this.roomId = code;
    this.allocatedRoomCode = code;

    if (options?.isPrivate) {
      this.state.isPrivate = true;
      this.state.cheatsEnabled = true;
      await this.setPrivate(true);
    } else {
      this.state.isPrivate = false;
      this.state.cheatsEnabled = false;
    }

    this.state.gameMode = sanitizeGameMode(options?.gameMode);
    this.state.botDifficulty = sanitizeBotDifficulty(options?.botDifficulty);

    const rapier = await initRapier();
    const world = new rapier.World({ x: 0, y: -18.0, z: 0 });
    world.timestep = FIXED_DT_SEC;
    this.state.mapId = SUNLIT_COURTYARD_MAP.id;
    this.mapManager.loadMap(rapier, world, this.state.mapId);
    this.propSystem.loadForMap(this.state.mapId);
    this.modeSystem.resetMatch(this.state.mapId);
    syncArenaPropsToSchema(this.state, this.propSystem.getSnapshots());

    this.rapier = rapier;
    this.world = world;

    registerArenaRoomMessages({
      onMessage: (type, handler) => this.onMessage(type, handler),
      broadcast: (type, msg) => this.broadcast(type, msg),
      getClientById: (sessionId) => this.clients.find((c) => c.sessionId === sessionId),
      state: this.state,
      players: this.players,
      draftSystem: this.draftSystem,
      cheatSystem: this.cheatSystem,
      commsSystem: this.commsSystem,
      getHumanCount: () => this.getHumanCount(),
      getBotCount: () => this.getBotCount(),
      spawnCombatBot: () => this.spawnCombatBot(),
      onSetGameMode: (mode) => {
        if (this.state.gameMode === mode) return;
        this.state.gameMode = mode;
        if (this.rapier && this.world) {
          this.roundSystem.handlePlayAgain(
            this.rapier,
            this.state,
            this.players,
            this.world,
            this.grenadeSystem,
            this.mapManager,
            this.propSystem,
            this.killstreakTracker,
            this.modeSystem,
          );
        }
      },
      onSetBotDifficulty: (diff) => {
        this.state.botDifficulty = diff;
      },
      onPlayAgain: () => {
        if (!this.rapier || !this.world || this.state.phase !== "match_over") return;
        this.roundSystem.handlePlayAgain(
          this.rapier,
          this.state,
          this.players,
          this.world,
          this.grenadeSystem,
          this.mapManager,
          this.propSystem,
          this.killstreakTracker,
          this.modeSystem,
        );
      },
    });

    this.setFixedTimestep((ctx) => this.stepSimulation(ctx), TICK_RATE);
  }

  onJoin(client: Client, options?: JoinRoomOptions): void {
    if (!this.rapier || !this.world) return;
    if (!this.state.isPrivate) {
      this.state.cheatsEnabled = false;
      this.cheatSystem.resetAll();
      this.removeAllBots();
    }

    const index = this.playerCounter++;
    const spawns = this.mapManager.currentMap.spawnPoints;
    const spawn = spawns[index % spawns.length]!;
    const bodyColor = options?.bodyColor
      ? sanitizeBodyColor(options.bodyColor)
      : PLAYER_COLORS[index % PLAYER_COLORS.length]!;
    const hatId = sanitizeHatId(options?.hatId);
    const displayName = sanitizeDisplayName(options?.displayName, `Player ${index + 1}`);
    const deviceType = sanitizeDeviceType(options?.deviceType);

    const entity = this.addEntity(
      client.sessionId,
      displayName,
      deviceType,
      bodyColor,
      spawn,
      false,
      hatId,
    );
    if (entity && this.spectatorTracker.shouldJoinAsSpectator(this.state.phase)) {
      this.spectatorTracker.applySpectatorJoinState(entity);
    }
  }

  onLeave(client: Client): void {
    if (this.commsSystem.handleVoiceLeave(client.sessionId)) {
      this.broadcast(NET_MSG.WEBRTC_LEAVE, { sessionId: client.sessionId });
    }
    this.commsSystem.removeSession(client.sessionId);
    this.removeEntity(client.sessionId);
    if (this.getHumanCount() === 0) this.removeAllBots();
  }

  onDispose(): void {
    if (this.allocatedRoomCode) void releaseRoomCode(this.presence, this.allocatedRoomCode);
    if (this.world) {
      this.grenadeSystem.clearAll(this.world, this.state);
      for (const player of this.players.values()) player.dispose(this.world);
      this.world.free();
      this.world = null;
    }
    this.cheatSystem.resetAll();
    this.players.clear();
    this.colliderToSession.clear();
  }

  private getHumanCount(): number {
    let count = 0;
    for (const p of this.players.values()) if (!p.isBot) count += 1;
    return count;
  }

  private getBotCount(): number {
    let count = 0;
    for (const p of this.players.values()) if (p.isBot) count += 1;
    return count;
  }

  private removeAllBots(): void {
    for (const p of [...this.players.values()]) {
      if (p.isBot) this.removeEntity(p.sessionId);
    }
    this.botCounter = 0;
  }

  private spawnCombatBot(): boolean {
    const existing = this.getBotCount();
    if (existing >= MAX_COMBAT_BOTS || !this.rapier || !this.world) return false;
    const id =
      existing === 0 && !this.players.has(DUMMY_SESSION_ID)
        ? DUMMY_SESSION_ID
        : `bot_${++this.botCounter}`;
    const profile = getBotProfile(existing);
    const spawns = this.mapManager.currentMap.spawnPoints;
    const spawn = spawns[(existing + 1) % spawns.length]!;
    this.addEntity(id, profile.name, "desktop", profile.bodyColor, spawn, true, profile.hatId);
    return true;
  }

  private addEntity(
    sessionId: string,
    displayName: string,
    deviceType: DeviceType,
    bodyColor: string,
    spawn: { position: [number, number, number]; yaw: number },
    isBot: boolean,
    hatId: HatId = DEFAULT_HAT_ID,
  ): PlayerEntity | null {
    if (!this.rapier || !this.world) return null;
    const entity = new PlayerEntity(
      this.rapier,
      this.world,
      sessionId,
      displayName,
      deviceType,
      bodyColor,
      spawn,
      isBot,
      hatId,
    );
    this.players.set(sessionId, entity);
    this.colliderToSession.set(entity.collider.handle, sessionId);
    this.state.players.set(sessionId, entity.schema);
    return entity;
  }

  private removeEntity(sessionId: string): void {
    const entity = this.players.get(sessionId);
    this.cheatSystem.removePlayer(sessionId);
    this.propSystem.clearPlayerState(sessionId);
    this.killstreakTracker.removeSession(sessionId);
    this.modeSystem.removePlayer(sessionId);
    if (!entity) return;
    this.colliderToSession.delete(entity.collider.handle);
    if (this.world) entity.dispose(this.world);
    this.players.delete(sessionId);
    this.state.players.delete(sessionId);
  }

  private stepSimulation(ctx: StepContext): void {
    if (!this.rapier || !this.world) return;
    stepArenaSimulation({
      rapier: this.rapier,
      world: this.world,
      state: this.state,
      players: this.players,
      colliderToSession: this.colliderToSession,
      grenadeSystem: this.grenadeSystem,
      combatSystem: this.combatSystem,
      meleeSystem: this.meleeSystem,
      draftSystem: this.draftSystem,
      roundSystem: this.roundSystem,
      mapManager: this.mapManager,
      propSystem: this.propSystem,
      cheatSystem: this.cheatSystem,
      killstreakTracker: this.killstreakTracker,
      modeSystem: this.modeSystem,
      spectatorTracker: this.spectatorTracker,
      broadcast: (type, msg) => this.broadcast(type, msg),
      dt: ctx.dt,
      tick: ctx.tick,
    });
  }
}
