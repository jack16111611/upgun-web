import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  ALL_CARDS,
  COUNTDOWN_DURATION_SEC,
  getGameModeConfig,
  getNextArenaMapId,
  ROUND_OVER_DURATION_SEC,
  runCardHook,
  SUNLIT_COURTYARD_MAP,
} from "@upgun/shared";
import type { ArenaPropSystem } from "../arena";
import type { GameModeSystem } from "../modes";
import type { KillstreakTracker } from "../rooms/KillstreakTracker";
import type { ArenaState } from "../schema/ArenaState";
import type { DraftSystem } from "./DraftSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { MapManager } from "./MapManager";
import type { PlayerEntity } from "./PlayerEntity";

const EPIC_CARD_IDS = ALL_CARDS.filter((c) => c.rarity === "epic").map((c) => c.id);
const GUN_GAME_RESPAWN_DELAY_SEC = 2.2;

export class RoundSystem {
  private draftPicksRemaining = 0;
  private readonly gunGameRespawnTimers = new Map<string, number>();

  respawnAll(
    players: Map<string, PlayerEntity>,
    world: World,
    grenadeSystem: GrenadeSystem,
    mapManager: MapManager,
    propSystem: ArenaPropSystem,
    modeSystem: GameModeSystem,
    state: ArenaState,
  ): void {
    grenadeSystem.clearAll(world, state);
    propSystem.resetForRound();
    this.gunGameRespawnTimers.clear();
    const spawns = mapManager.currentMap.spawnPoints;
    let idx = 0;
    for (const player of players.values()) {
      const spawn = spawns[idx % spawns.length]!;
      player.respawnAt(spawn, world);
      modeSystem.syncPlayerWeaponAmmo(state.gameMode, player);
      idx += 1;
    }
  }

  startCountdown(
    rapier: typeof RAPIER,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    world: World,
    grenadeSystem: GrenadeSystem,
    mapManager: MapManager,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    modeSystem: GameModeSystem,
    forceRotateMap = false,
  ): void {
    state.roundNumber += 1;
    if (state.roundNumber > 1 || forceRotateMap) {
      const nextMapId = getNextArenaMapId(state.mapId);
      state.mapId = nextMapId;
      mapManager.loadMap(rapier, world, nextMapId);
      propSystem.loadForMap(nextMapId);
    }

    modeSystem.resetRound(state.mapId);
    this.syncKothToState(state, modeSystem);

    state.phase = "countdown";
    state.phaseTimer = COUNTDOWN_DURATION_SEC;
    state.winnerSessionId = "";
    state.matchChampionId = "";
    this.draftPicksRemaining = 0;
    killstreakTracker.resetRoundStreaks();

    for (const player of players.values()) {
      player.clearTemporaryCards();
      runCardHook(player.ownedCards, "onRoundStart", {
        playerId: player.sessionId,
        roundNumber: state.roundNumber,
        grantTemporaryCard: (cardId, level) => player.grantTemporaryCard(cardId, level),
        getEpicCardIds: () => EPIC_CARD_IDS,
      });
    }

    this.respawnAll(players, world, grenadeSystem, mapManager, propSystem, modeSystem, state);
  }

  handlePlayAgain(
    rapier: typeof RAPIER,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    world: World,
    grenadeSystem: GrenadeSystem,
    mapManager: MapManager,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    modeSystem: GameModeSystem,
  ): void {
    state.roundNumber = 0;
    state.winnerSessionId = "";
    state.matchChampionId = "";
    killstreakTracker.resetMatch();
    modeSystem.resetMatch(state.mapId);

    for (const player of players.values()) {
      player.resetMatchCards();
      player.schema.score = 0;
      player.schema.kills = 0;
      player.schema.meleeKills = 0;
      player.schema.weaponTier = 0;
    }

    if (players.size >= 2) {
      this.startCountdown(
        rapier,
        state,
        players,
        world,
        grenadeSystem,
        mapManager,
        propSystem,
        killstreakTracker,
        modeSystem,
        true,
      );
    } else {
      state.phase = "lobby";
    }
  }

  enterLobby(
    rapier: typeof RAPIER,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    world: World,
    grenadeSystem: GrenadeSystem,
    mapManager: MapManager,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    modeSystem: GameModeSystem,
  ): void {
    state.phase = "lobby";
    state.phaseTimer = 0;
    state.roundNumber = 0;
    state.winnerSessionId = "";
    state.matchChampionId = "";
    this.draftPicksRemaining = 0;
    killstreakTracker.resetMatch();

    if (state.mapId !== SUNLIT_COURTYARD_MAP.id) {
      state.mapId = SUNLIT_COURTYARD_MAP.id;
      mapManager.loadMap(rapier, world, SUNLIT_COURTYARD_MAP.id);
      propSystem.loadForMap(SUNLIT_COURTYARD_MAP.id);
    }
    modeSystem.resetMatch(state.mapId);
    this.syncKothToState(state, modeSystem);

    for (const player of players.values()) {
      player.resetMatchCards();
      player.schema.score = 0;
      player.schema.kills = 0;
      player.schema.meleeKills = 0;
      player.schema.weaponTier = 0;
    }
    this.respawnAll(players, world, grenadeSystem, mapManager, propSystem, modeSystem, state);
  }

  private awardRoundWinner(
    state: ArenaState,
    winner: PlayerEntity | undefined,
    world: World,
    grenadeSystem: GrenadeSystem,
  ): void {
    const modeCfg = getGameModeConfig(state.gameMode);
    if (winner) {
      winner.schema.score += 1;
      state.winnerSessionId = winner.sessionId;
      if (winner.schema.score >= modeCfg.winScore) {
        state.matchChampionId = winner.sessionId;
        state.phase = "match_over";
        state.phaseTimer = 0;
        grenadeSystem.clearAll(world, state);
        return;
      }
    } else {
      state.winnerSessionId = "";
    }
    state.phase = "round_over";
    state.phaseTimer = ROUND_OVER_DURATION_SEC;
  }

  private syncKothToState(state: ArenaState, modeSystem: GameModeSystem): void {
    const snap = modeSystem.kothTracker.getSnapshot();
    state.kothZone.active = state.gameMode === "koth" && snap.active;
    state.kothZone.x = snap.x;
    state.kothZone.y = snap.y;
    state.kothZone.z = snap.z;
    state.kothZone.radius = snap.radius;
    state.kothZone.ownerId = snap.ownerId;
    state.kothZone.contested = snap.contested;
    state.kothZone.overtime = snap.overtime;
    state.kothZone.progress = snap.progress;
    state.kothZone.rotationTimer = snap.rotationTimer;
  }

  step(
    rapier: typeof RAPIER,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    world: World,
    grenadeSystem: GrenadeSystem,
    draftSystem: DraftSystem,
    mapManager: MapManager,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    modeSystem: GameModeSystem,
    dt: number,
  ): void {
    const participantCount = players.size;
    const modeCfg = getGameModeConfig(state.gameMode);

    if (state.phase === "match_over") {
      if (participantCount < 2) {
        this.enterLobby(rapier, state, players, world, grenadeSystem, mapManager, propSystem, killstreakTracker, modeSystem);
      }
      return;
    }

    if (state.phase === "lobby") {
      if (participantCount >= 2) {
        this.startCountdown(rapier, state, players, world, grenadeSystem, mapManager, propSystem, killstreakTracker, modeSystem);
      }
      return;
    }

    if (participantCount < 2) {
      this.enterLobby(rapier, state, players, world, grenadeSystem, mapManager, propSystem, killstreakTracker, modeSystem);
      return;
    }

    if (state.phase === "countdown") {
      state.phaseTimer = Math.max(0, state.phaseTimer - dt);
      if (state.phaseTimer <= 0) {
        state.phase = "combat";
        state.phaseTimer = 0;
        if (state.gameMode === "koth") {
          modeSystem.kothTracker.activate(state.mapId);
          this.syncKothToState(state, modeSystem);
        }
      }
      return;
    }

    if (state.phase === "combat") {
      if (state.gameMode === "gun_game") {
        // Continuous Gun Game FFA: auto-respawn eliminated players after 2.2s
        const spawns = mapManager.currentMap.spawnPoints;
        let idx = 0;
        for (const p of players.values()) {
          idx += 1;
          if (p.schema.isAlive) {
            this.gunGameRespawnTimers.delete(p.sessionId);
            continue;
          }
          const left = (this.gunGameRespawnTimers.get(p.sessionId) ?? GUN_GAME_RESPAWN_DELAY_SEC) - dt;
          if (left <= 0) {
            this.gunGameRespawnTimers.delete(p.sessionId);
            p.respawnAt(spawns[(idx + Math.floor(Math.random() * spawns.length)) % spawns.length]!, world);
            modeSystem.syncPlayerWeaponAmmo(state.gameMode, p);
          } else {
            this.gunGameRespawnTimers.set(p.sessionId, left);
          }
        }
        return;
      }

      if (state.gameMode === "koth") {
        const kothRes = modeSystem.kothTracker.step(players, dt);
        this.syncKothToState(state, modeSystem);
        if (kothRes.roundWinnerId) {
          this.awardRoundWinner(state, players.get(kothRes.roundWinnerId), world, grenadeSystem);
          return;
        }
      }

      const alivePlayers: PlayerEntity[] = [];
      for (const player of players.values()) {
        if (player.schema.isAlive) alivePlayers.push(player);
      }

      if (alivePlayers.length <= 1) {
        this.awardRoundWinner(state, alivePlayers[0], world, grenadeSystem);
      }
      return;
    }

    if (state.phase === "round_over") {
      state.phaseTimer = Math.max(0, state.phaseTimer - dt);
      if (state.phaseTimer <= 0) {
        grenadeSystem.clearAll(world, state);
        if (modeCfg.allowCardDraft && modeCfg.draftsPerRound > 0) {
          this.draftPicksRemaining = modeCfg.draftsPerRound;
          draftSystem.beginDraft(state, players);
        } else {
          this.startCountdown(rapier, state, players, world, grenadeSystem, mapManager, propSystem, killstreakTracker, modeSystem);
        }
      }
      return;
    }

    if (state.phase === "drafting") {
      state.phaseTimer = Math.max(0, state.phaseTimer - dt);
      const finished = draftSystem.allHumansPicked(players) || state.phaseTimer <= 0;
      if (!finished) return;
      if (state.phaseTimer <= 0) draftSystem.autoPickUnpicked(players);

      this.draftPicksRemaining = Math.max(0, this.draftPicksRemaining - 1);
      if (this.draftPicksRemaining > 0) {
        draftSystem.beginDraft(state, players);
      } else {
        this.startCountdown(rapier, state, players, world, grenadeSystem, mapManager, propSystem, killstreakTracker, modeSystem);
      }
    }
  }
}
