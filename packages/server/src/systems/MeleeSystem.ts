import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  castHitscanRay,
  computeMeleeKnockback,
  findDeflectableGrenades,
  findMeleeConeTargets,
  getAimDirection,
  getEyePosition,
  PLAYER_RADIUS,
  runCardHook,
  WEAPON_MELEE,
  type AnnouncementEvent,
  type DeflectEvent,
  type MeleeHitHookContext,
  type MeleeSwingEvent,
  type MeleeSwingHookContext,
} from "@upgun/shared";
import type { ArenaPropSystem } from "../arena";
import type { KillstreakTracker } from "../rooms/KillstreakTracker";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatBroadcastCallbacks, DamageSystem } from "./DamageSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { PlayerEntity } from "./PlayerEntity";

export interface MeleeEventCallbacks extends CombatBroadcastCallbacks {
  onMeleeSwing: (event: MeleeSwingEvent) => void;
  onDeflect: (event: DeflectEvent) => void;
  onAnnouncement: (event: AnnouncementEvent) => void;
}

export class MeleeSystem {
  stepPlayerMelee(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    player: PlayerEntity,
    players: Map<string, PlayerEntity>,
    grenadeSystem: GrenadeSystem,
    damageSystem: DamageSystem,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    dt: number,
    allowWeapons: boolean,
    infiniteCooldowns: boolean,
    callbacks: MeleeEventCallbacks,
    meleeOneHitKill = false,
  ): void {
    player.meleeCooldownSec = Math.max(0, player.meleeCooldownSec - dt);
    player.reflectShotsTimerSec = Math.max(0, player.reflectShotsTimerSec - dt);

    // Check Seismic Slam landing trigger
    if (player.seismicSlamPending && player.movement.isGrounded && player.schema.isAlive) {
      const slam = player.seismicSlamPending;
      player.seismicSlamPending = null;
      const slamPos = { x: player.movement.x, y: player.movement.y, z: player.movement.z };
      damageSystem.dealRadialSplash(
        slamPos,
        slam.radius,
        slam.damage,
        1,
        player,
        rapier,
        world,
        state,
        players,
        grenadeSystem,
        callbacks,
      );
      for (const other of players.values()) {
        if (!other.schema.isAlive || other.sessionId === player.sessionId) continue;
        const dx = other.movement.x - slamPos.x;
        const dz = other.movement.z - slamPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < slam.radius && dist > 0.01) {
          other.applyExternalImpulse({ x: (dx / dist) * 10, y: 8.5, z: (dz / dist) * 10 });
        }
      }
      callbacks.onAnnouncement(
        killstreakTracker.createSeismicSlamAnnouncement(player.sessionId, player.schema.displayName),
      );
    }

    if (!allowWeapons || !player.schema.isAlive) {
      player.meleeHeld = player.latestInput.melee;
      return;
    }

    const input = player.latestInput;
    if (input.melee && !player.meleeHeld && player.meleeCooldownSec <= 0) {
      this.performMeleeSwing(
        rapier,
        world,
        state,
        player,
        players,
        grenadeSystem,
        damageSystem,
        propSystem,
        killstreakTracker,
        infiniteCooldowns,
        callbacks,
        meleeOneHitKill,
      );
    }
    player.meleeHeld = input.melee;
  }

  private performMeleeSwing(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    player: PlayerEntity,
    players: Map<string, PlayerEntity>,
    grenadeSystem: GrenadeSystem,
    damageSystem: DamageSystem,
    propSystem: ArenaPropSystem,
    killstreakTracker: KillstreakTracker,
    infiniteCooldowns: boolean,
    callbacks: MeleeEventCallbacks,
    meleeOneHitKill = false,
  ): void {
    player.meleeCooldownSec = infiniteCooldowns ? 0 : player.stats.meleeCooldown;
    const aimDir = getAimDirection(player.latestInput.yaw, player.latestInput.pitch);

    const swingCtx: MeleeSwingHookContext = {
      playerId: player.sessionId,
      position: { x: player.movement.x, y: player.movement.y, z: player.movement.z },
      direction: aimDir,
      isAirborne: !player.movement.isGrounded,
      stats: player.stats,
      deflectRadiusBonus: 0,
      reflectShotsDurationSec: 0,
      lungeDistance: 0,
      resetCooldownOnKill: false,
      triggerSeismicSlam: (slamDamage, slamRadius) => {
        player.seismicSlamPending = { damage: slamDamage, radius: slamRadius };
        player.movement.vy = -26;
      },
    };
    runCardHook(player.effectiveCards, "onMeleeSwing", swingCtx);

    if (swingCtx.reflectShotsDurationSec > 0) {
      player.reflectShotsTimerSec = Math.max(
        player.reflectShotsTimerSec,
        swingCtx.reflectShotsDurationSec,
      );
    }

    // Shadow Lunge forward dash/teleport clamped by walls
    if (swingCtx.lungeDistance > 0) {
      const horizLen = Math.hypot(aimDir.x, aimDir.z);
      const lx = horizLen > 0.01 ? aimDir.x / horizLen : -Math.sin(player.latestInput.yaw);
      const lz = horizLen > 0.01 ? aimDir.z / horizLen : -Math.cos(player.latestInput.yaw);
      const hit = castHitscanRay(
        rapier,
        world,
        { x: player.movement.x, y: player.movement.y, z: player.movement.z },
        { x: lx, y: 0, z: lz },
        swingCtx.lungeDistance + PLAYER_RADIUS,
        player.collider,
        (col) => !grenadeSystem.isGrenadeCollider(col.handle),
      );
      const dist = hit ? Math.max(0, hit.distance - PLAYER_RADIUS - 0.15) : swingCtx.lungeDistance;
      player.teleportTo(
        player.movement.x + lx * dist,
        player.movement.y,
        player.movement.z + lz * dist,
        world,
      );
    }

    const updatedOrigin = getEyePosition(player.movement);
    const deflectRadius = WEAPON_MELEE.deflectRadius + swingCtx.deflectRadiusBonus;
    const deflected = findDeflectableGrenades(
      updatedOrigin,
      aimDir,
      deflectRadius,
      grenadeSystem.getDeflectCandidates(),
    );

    let didDeflect = false;
    for (const def of deflected) {
      const deflectedPos = grenadeSystem.deflectGrenade(
        rapier,
        def.id,
        player.sessionId,
        def.newVelocity,
      );
      if (deflectedPos) {
        didDeflect = true;
        callbacks.onDeflect({
          deflectorId: player.sessionId,
          position: deflectedPos,
          kind: "grenade",
        });
      }
    }
    if (didDeflect) {
      callbacks.onAnnouncement(
        killstreakTracker.createParryDeflectAnnouncement(
          player.sessionId,
          player.schema.displayName,
        ),
      );
    }

    const range = WEAPON_MELEE.range + player.stats.meleeRangeBonus;
    callbacks.onMeleeSwing({
      attackerId: player.sessionId,
      origin: updatedOrigin,
      direction: aimDir,
      range,
      deflected: didDeflect,
    });

    // Also allow meleeing Explosive Plasma Barrels!
    const barrelHit = propSystem.raycastBarrel(updatedOrigin, aimDir, range);
    if (barrelHit) {
      propSystem.damageBarrel(barrelHit.barrelId, WEAPON_MELEE.damage, player.sessionId, {
        onExplosion: (ev) => callbacks.onExplosion(ev),
        onSplashDamage: (originPos, radius, maxDamage, ownerId) => {
          const attacker = (ownerId ? players.get(ownerId) : null) ?? player;
          damageSystem.dealRadialSplash(
            originPos,
            radius,
            maxDamage,
            1,
            attacker,
            rapier,
            world,
            state,
            players,
            grenadeSystem,
            callbacks,
            { includeAttacker: true, triggerBarrels: false, emitExplosionEvent: false },
          );
        },
      });
    }

    const candidates = [];
    for (const other of players.values()) {
      if (!other.schema.isAlive || other.sessionId === player.sessionId) continue;
      candidates.push({
        id: other.sessionId,
        position: { x: other.movement.x, y: other.movement.y + 0.25, z: other.movement.z },
      });
    }

    const hits = findMeleeConeTargets(
      updatedOrigin,
      aimDir,
      range,
      WEAPON_MELEE.coneCos,
      candidates,
    );

    const kb = computeMeleeKnockback(aimDir, WEAPON_MELEE.knockbackForce);
    for (const hit of hits) {
      const target = players.get(hit.id);
      if (!target || !target.schema.isAlive) continue;

      const targetHpRatio = target.stats.maxHp > 0 ? target.schema.hp / target.stats.maxHp : 1;
      const baseDamage = meleeOneHitKill
        ? 9999
        : Math.round(
            WEAPON_MELEE.damage * player.stats.damageMultiplier * player.stats.meleeDamageMultiplier,
          );
      const hitCtx: MeleeHitHookContext = {
        attackerId: player.sessionId,
        targetId: target.sessionId,
        targetHpRatio,
        baseDamage,
        damageMultiplier: 1,
        isCrit: meleeOneHitKill,
        stats: player.stats,
        healAttacker: (amt) => player.heal(amt),
        boostAttackerSpeed: (mult, dur) => player.applySpeedBoost(mult, dur),
      };
      runCardHook(player.effectiveCards, "onMeleeHit", hitCtx);

      const finalDmg = Math.max(1, Math.round(hitCtx.baseDamage * hitCtx.damageMultiplier));
      target.applyExternalImpulse(kb);

      const wasAlive = target.schema.isAlive;
      const hitPoint = { x: target.movement.x, y: target.movement.y + 0.25, z: target.movement.z };
      damageSystem.applyDamage(
        target,
        player,
        finalDmg,
        hitPoint,
        "melee",
        0,
        rapier,
        world,
        state,
        players,
        grenadeSystem,
        callbacks,
        aimDir,
        hitCtx.isCrit,
      );

      if (wasAlive && !target.schema.isAlive && swingCtx.resetCooldownOnKill) {
        player.meleeCooldownSec = 0;
      }
    }
  }
}
