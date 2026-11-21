import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import { NET_MSG, type AnnouncementEvent } from "@upgun/shared";
import type { ArenaPropSystem, BarrelExplosionCallbacks } from "../arena";
import type { CheatSystem } from "../cheats";
import type { GameModeSystem } from "../modes";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatBroadcastCallbacks, CombatSystem } from "../systems/CombatSystem";
import type { GrenadeSystem } from "../systems/GrenadeSystem";
import type { MeleeEventCallbacks } from "../systems/MeleeSystem";
import type { PlayerEntity } from "../systems/PlayerEntity";
import type { KillstreakTracker } from "./KillstreakTracker";
import type { SpectatorTracker } from "./SpectatorTracker";

export interface RoomCallbackDeps {
  getRapier: () => typeof RAPIER | null;
  getWorld: () => World | null;
  state: ArenaState;
  players: Map<string, PlayerEntity>;
  combatSystem: CombatSystem;
  grenadeSystem: GrenadeSystem;
  propSystem: ArenaPropSystem;
  cheatSystem: CheatSystem;
  killstreakTracker: KillstreakTracker;
  modeSystem: GameModeSystem;
  spectatorTracker: SpectatorTracker;
  broadcast: (type: string, message: unknown) => void;
}

export function createRoomCombatCallbacks(deps: RoomCallbackDeps): MeleeEventCallbacks {
  const barrelCallbacks: BarrelExplosionCallbacks = {
    onExplosion: (ev) => deps.broadcast(NET_MSG.EXPLOSION_EVENT, ev),
    onSplashDamage: (origin, radius, maxDamage, ownerId) => {
      const rapier = deps.getRapier();
      const world = deps.getWorld();
      if (!rapier || !world) return;
      const attacker = ownerId ? deps.players.get(ownerId) ?? null : null;
      deps.combatSystem.damageSystem.dealRadialSplash(
        origin,
        radius,
        maxDamage,
        1,
        attacker,
        rapier,
        world,
        deps.state,
        deps.players,
        deps.grenadeSystem,
        cb,
        { includeAttacker: true, triggerBarrels: false, emitExplosionEvent: false },
      );
    },
  };

  const cb: MeleeEventCallbacks & CombatBroadcastCallbacks = {
    onShot: (ev) => deps.broadcast(NET_MSG.SHOT_EVENT, ev),
    onHit: (ev) => deps.broadcast(NET_MSG.HIT_EVENT, ev),
    onExplosion: (ev) => deps.broadcast(NET_MSG.EXPLOSION_EVENT, ev),
    onMeleeSwing: (ev) => deps.broadcast(NET_MSG.MELEE_SWING_EVENT, ev),
    onDeflect: (ev) => deps.broadcast(NET_MSG.DEFLECT_EVENT, ev),
    onAnnouncement: (ev: AnnouncementEvent) => deps.broadcast(NET_MSG.ANNOUNCEMENT_EVENT, ev),
    isGodMode: (sid) => deps.state.cheatsEnabled && deps.cheatSystem.isGodMode(sid),
    consumeOvershield: (sid, dmg) => deps.propSystem.consumeOvershield(sid, dmg),
    onKill: (killer, victim, source) => {
      const banners = deps.killstreakTracker.recordKill(
        killer.sessionId,
        killer.schema.displayName,
        source,
      );
      for (const b of banners) deps.broadcast(NET_MSG.ANNOUNCEMENT_EVENT, b);

      deps.broadcast(
        NET_MSG.KILLER_HIGHLIGHT,
        deps.spectatorTracker.buildKillerHighlight(victim, killer, source),
      );

      if (deps.state.gameMode === "gun_game" && deps.state.phase === "combat") {
        const res = deps.modeSystem.recordGunGameKill(killer, source);
        killer.schema.weaponTier = res.newTier;
        if (res.wonMatch) {
          killer.schema.score = Math.max(killer.schema.score + 1, 1);
          deps.state.winnerSessionId = killer.sessionId;
          deps.state.matchChampionId = killer.sessionId;
          deps.state.phase = "match_over";
          deps.state.phaseTimer = 0;
          const world = deps.getWorld();
          if (world) deps.grenadeSystem.clearAll(world, deps.state);
          deps.broadcast(NET_MSG.ANNOUNCEMENT_EVENT, {
            banner: "GOLDEN KATANA VICTORY!",
            subtitle: `${killer.schema.displayName} wins Gun Game!`,
            actorId: killer.sessionId,
            accent: "#facc15",
          } satisfies AnnouncementEvent);
        } else if (res.advanced) {
          deps.broadcast(NET_MSG.ANNOUNCEMENT_EVENT, {
            banner: `TIER ${res.newTier + 1} — ${res.weaponName.toUpperCase()}`,
            subtitle: `${killer.schema.displayName} leveled up!`,
            actorId: killer.sessionId,
            accent: "#38bdf8",
          } satisfies AnnouncementEvent);
        }
      }
    },
    onDeath: (victim) => deps.killstreakTracker.recordDeath(victim.sessionId),
    onParryReflect: (deflector) => {
      deps.broadcast(NET_MSG.DEFLECT_EVENT, {
        deflectorId: deflector.sessionId,
        position: {
          x: deflector.movement.x,
          y: deflector.movement.y + 0.5,
          z: deflector.movement.z,
        },
        kind: "shot",
      });
      deps.broadcast(
        NET_MSG.ANNOUNCEMENT_EVENT,
        deps.killstreakTracker.createParryDeflectAnnouncement(
          deflector.sessionId,
          deflector.schema.displayName,
        ),
      );
    },
    onSplashBarrels: (origin, radius, maxDamage, attackerId) => {
      deps.propSystem.damageBarrelsInRadius(origin, radius, maxDamage, attackerId, barrelCallbacks);
    },
    raycastBarrel: (origin, dir, maxDist) => deps.propSystem.raycastBarrel(origin, dir, maxDist),
    damageBarrel: (barrelId, dmg, attackerId) => {
      deps.propSystem.damageBarrel(barrelId, dmg, attackerId, barrelCallbacks);
    },
  };

  return cb;
}
