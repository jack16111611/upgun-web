import type RAPIER from "@dimforge/rapier3d-compat";
import type { World as RapierWorld } from "@dimforge/rapier3d-compat";
import { getGameModeConfig, NET_MSG, stepPlayerMovement } from "@upgun/shared";
import type { ArenaPropSystem } from "../arena";
import { syncArenaPropsToSchema } from "../arena/schemaSync";
import { stepHumanizedBotInput } from "../bots";
import type { CheatSystem } from "../cheats";
import type { GameModeSystem } from "../modes";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatSystem } from "../systems/CombatSystem";
import type { DraftSystem } from "../systems/DraftSystem";
import type { GrenadeSystem } from "../systems/GrenadeSystem";
import type { MapManager } from "../systems/MapManager";
import type { MeleeSystem } from "../systems/MeleeSystem";
import type { PlayerEntity } from "../systems/PlayerEntity";
import type { RoundSystem } from "../systems/RoundSystem";
import { createRoomCombatCallbacks } from "./ArenaRoomCallbacks";
import type { KillstreakTracker } from "./KillstreakTracker";
import type { SpectatorTracker } from "./SpectatorTracker";

export interface ArenaStepContext {
  rapier: typeof RAPIER;
  world: RapierWorld;
  state: ArenaState;
  players: Map<string, PlayerEntity>;
  colliderToSession: Map<number, string>;
  grenadeSystem: GrenadeSystem;
  combatSystem: CombatSystem;
  meleeSystem: MeleeSystem;
  draftSystem: DraftSystem;
  roundSystem: RoundSystem;
  mapManager: MapManager;
  propSystem: ArenaPropSystem;
  cheatSystem: CheatSystem;
  killstreakTracker: KillstreakTracker;
  modeSystem: GameModeSystem;
  spectatorTracker: SpectatorTracker;
  broadcast: (type: string, message: unknown) => void;
  dt: number;
  tick: number;
}

export function stepArenaSimulation(c: ArenaStepContext): void {
  const { rapier, world, state, players, dt } = c;

  c.roundSystem.step(
    rapier,
    state,
    players,
    world,
    c.grenadeSystem,
    c.draftSystem,
    c.mapManager,
    c.propSystem,
    c.killstreakTracker,
    c.modeSystem,
    dt,
  );

  if (!state.cheatsEnabled) {
    c.cheatSystem.resetAll();
  }
  state.moonGravity = state.cheatsEnabled && c.cheatSystem.isMoonGravity();
  state.bigHead = state.cheatsEnabled && c.cheatSystem.isBigHead();

  const modeCfg = getGameModeConfig(state.gameMode);
  const modeMods = c.modeSystem.getMovementModifiers(state.gameMode);
  const allowMovement =
    state.phase !== "countdown" && state.phase !== "drafting" && state.phase !== "match_over";
  const allowWeapons = state.phase === "combat";
  const activeMap = c.mapManager.currentMap;
  const cheatGravMult = state.cheatsEnabled ? c.cheatSystem.getGravityScale() : 1;
  const gravityMult = Math.min(cheatGravMult, modeMods.gravityMultiplier);

  const callbacks = createRoomCombatCallbacks({
    getRapier: () => rapier,
    getWorld: () => world,
    state,
    players,
    combatSystem: c.combatSystem,
    grenadeSystem: c.grenadeSystem,
    propSystem: c.propSystem,
    cheatSystem: c.cheatSystem,
    killstreakTracker: c.killstreakTracker,
    modeSystem: c.modeSystem,
    spectatorTracker: c.spectatorTracker,
    broadcast: c.broadcast,
  });

  c.propSystem.stepBarrels(dt);
  const kothPos =
    state.gameMode === "koth" && state.kothZone.active
      ? { x: state.kothZone.x, y: state.kothZone.y, z: state.kothZone.z }
      : undefined;

  for (const player of players.values()) {
    player.stepStatusEffects(dt);
    const weaponOverride = c.modeSystem.getActiveWeaponOverride(state.gameMode, player);

    if (player.isBot) {
      stepHumanizedBotInput(player, players, rapier, world, state, dt, state.botDifficulty, {
        kothZonePos: kothPos,
        meleeOnly: Boolean(weaponOverride?.meleeOnly),
        allowGrenades: modeCfg.allowGrenades,
      });
    }

    if (allowMovement && player.schema.isAlive) {
      stepPlayerMovement({
        state: player.movement,
        input: player.latestInput,
        dt,
        controller: player.controller,
        collider: player.collider,
        body: player.body,
        world,
        stats: player.stats,
        speedMultiplier: player.getSpeedMultiplier(),
        gravityMultiplier: gravityMult,
        dashCooldownMultiplier: modeMods.dashCooldownMultiplier,
        extraJumpsBonus: modeMods.extraJumpsBonus,
        airControlMultiplier: modeMods.airControlMultiplier,
        infiniteCooldowns: state.cheatsEnabled && c.cheatSystem.isInfiniteMode(player.sessionId),
        map: activeMap,
        onDash: (dirX, dirZ) => {
          c.combatSystem.handleDashTriggered(
            player,
            dirX,
            dirZ,
            rapier,
            world,
            state,
            players,
            c.grenadeSystem,
            callbacks,
          );
        },
        onJumpPad: (pad) => {
          c.broadcast(NET_MSG.JUMP_PAD_EVENT, {
            sessionId: player.sessionId,
            padId: pad.id,
            position: { x: pad.position[0], y: pad.position[1], z: pad.position[2] },
          });
        },
        filterPredicate: (col) => {
          if (c.grenadeSystem.isGrenadeCollider(col.handle)) return false;
          const otherId = c.colliderToSession.get(col.handle);
          if (otherId) return Boolean(players.get(otherId)?.schema.isAlive);
          return true;
        },
      });
    }
  }

  world.step();

  c.propSystem.stepTeleporters(
    players,
    c.grenadeSystem.getTeleportableGrenades(),
    world,
    dt,
    (ev) => c.broadcast(NET_MSG.TELEPORT_EVENT, ev),
  );
  c.propSystem.stepOrbs(players, dt, (ev) => c.broadcast(NET_MSG.ORB_PICKUP_EVENT, ev));

  for (const player of players.values()) {
    const inf = state.cheatsEnabled && c.cheatSystem.isInfiniteMode(player.sessionId);
    const weaponOverride = c.modeSystem.getActiveWeaponOverride(state.gameMode, player);
    c.combatSystem.stepPlayerCombat(
      rapier,
      world,
      state,
      player,
      players,
      c.colliderToSession,
      c.grenadeSystem,
      dt,
      allowWeapons,
      callbacks,
      c.propSystem.getFireRateBoost(player.sessionId),
      inf,
      weaponOverride,
      modeCfg.allowGrenades,
    );
    c.meleeSystem.stepPlayerMelee(
      rapier,
      world,
      state,
      player,
      players,
      c.grenadeSystem,
      c.combatSystem.damageSystem,
      c.propSystem,
      c.killstreakTracker,
      dt,
      allowWeapons,
      inf,
      callbacks,
      Boolean(weaponOverride?.meleeOneHitKill),
    );
  }

  c.grenadeSystem.step(rapier, world, state, players, dt, {
    onDamage: (target, attacker, damage, point, source, depth) => {
      c.combatSystem.applyDamage(
        target,
        attacker,
        damage,
        point,
        source,
        depth,
        rapier,
        world,
        state,
        players,
        c.grenadeSystem,
        callbacks,
      );
    },
    onExplosion: (ev) => c.broadcast(NET_MSG.EXPLOSION_EVENT, ev),
    onSplashBarrels: callbacks.onSplashBarrels,
  });

  for (const player of players.values()) {
    player.schema.overshield = Math.round(c.propSystem.getOvershield(player.sessionId));
    player.schema.godMode = state.cheatsEnabled && c.cheatSystem.isGodMode(player.sessionId);
    player.schema.infiniteMode =
      state.cheatsEnabled && c.cheatSystem.isInfiniteMode(player.sessionId);
    player.schema.weaponTier = c.modeSystem.getPlayerTier(player.sessionId);
    player.syncToSchema();
  }

  syncArenaPropsToSchema(state, c.propSystem.getSnapshots());
  state.tick = c.tick + 1;
}
