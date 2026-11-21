import type { World } from "@dimforge/rapier3d-compat";
import type RAPIER from "@dimforge/rapier3d-compat";
import { castHitscanRay, PLAYER_RADIUS, runCardHook, type Vec3 } from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatBroadcastCallbacks, DamageSystem } from "./DamageSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { PlayerEntity } from "./PlayerEntity";

let dashPulseCounter = 1;

export function runDashHooks(
  player: PlayerEntity,
  dirX: number,
  dirZ: number,
  rapier: typeof RAPIER,
  world: World,
  state: ArenaState,
  players: Map<string, PlayerEntity>,
  grenadeSystem: GrenadeSystem,
  damageSystem: DamageSystem,
  callbacks: CombatBroadcastCallbacks,
): void {
  const origin: Vec3 = { x: player.movement.x, y: player.movement.y, z: player.movement.z };

  runCardHook(player.effectiveCards, "onDash", {
    playerId: player.sessionId,
    position: origin,
    direction: { x: dirX, y: 0, z: dirZ },
    stats: player.stats,
    reloadAmmo: (bullets) => player.reloadBullets(bullets),
    blinkTeleport: (distance, invulnSec) => {
      const safeDist = Math.max(0.5, distance);
      const hit = castHitscanRay(
        rapier,
        world,
        origin,
        { x: dirX, y: 0, z: dirZ },
        safeDist + PLAYER_RADIUS,
        player.collider,
        (col) => !grenadeSystem.isGrenadeCollider(col.handle),
      );
      const travel = hit ? Math.max(0, hit.distance - PLAYER_RADIUS - 0.15) : safeDist;
      player.teleportTo(origin.x + dirX * travel, origin.y, origin.z + dirZ * travel, world);
      player.setInvulnerable(invulnSec);
    },
    emitKnockbackPulse: (pulseOrigin, radius, force, damage = 0) => {
      callbacks.onExplosion({
        grenadeId: `dash_${dashPulseCounter++}`,
        ownerId: player.sessionId,
        position: pulseOrigin,
        radius: Math.min(3.5, radius * 0.55),
      });
      for (const other of players.values()) {
        if (!other.schema.isAlive || other.sessionId === player.sessionId) continue;
        const dx = other.movement.x - pulseOrigin.x;
        const dz = other.movement.z - pulseOrigin.z;
        const dist = Math.hypot(dx, dz);
        if (dist >= radius || dist < 0.001) continue;
        const scale = (1 - dist / radius) * force;
        other.applyExternalImpulse({ x: (dx / dist) * scale, y: 4.0, z: (dz / dist) * scale });
        if (damage > 0) {
          damageSystem.applyDamage(
            other,
            player,
            damage,
            { x: other.movement.x, y: other.movement.y + 0.2, z: other.movement.z },
            "dash",
            1,
            rapier,
            world,
            state,
            players,
            grenadeSystem,
            callbacks,
          );
        }
      }
    },
  });
}
