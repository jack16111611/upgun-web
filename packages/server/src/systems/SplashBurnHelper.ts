import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import { computeSplashDamage, hasLineOfSight, MAX_RECURSION_DEPTH, type Vec3 } from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatBroadcastCallbacks, DamageSystem } from "./DamageSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { PlayerEntity } from "./PlayerEntity";

let splashSeq = 1;

export interface RadialSplashOptions {
  includeAttacker?: boolean;
  triggerBarrels?: boolean;
  emitExplosionEvent?: boolean;
}

export function runRadialSplashDamage(
  damageSystem: DamageSystem,
  origin: Vec3,
  radius: number,
  maxDamage: number,
  recursionDepth: number,
  attacker: PlayerEntity | null,
  rapier: typeof RAPIER,
  world: World,
  state: ArenaState,
  players: Map<string, PlayerEntity>,
  grenadeSystem: GrenadeSystem,
  callbacks: CombatBroadcastCallbacks,
  options?: RadialSplashOptions,
): void {
  if (
    recursionDepth > MAX_RECURSION_DEPTH ||
    !Number.isFinite(radius) ||
    !Number.isFinite(maxDamage) ||
    radius <= 0 ||
    maxDamage <= 0
  ) {
    return;
  }

  const includeAttacker = options?.includeAttacker ?? false;
  const triggerBarrels = options?.triggerBarrels ?? true;
  const emitExplosionEvent = options?.emitExplosionEvent ?? true;
  const attackerId = attacker?.sessionId ?? "";

  if (emitExplosionEvent) {
    callbacks.onExplosion({
      grenadeId: `splash_${splashSeq++}`,
      ownerId: attackerId,
      position: origin,
      radius,
    });
  }
  if (triggerBarrels && recursionDepth < MAX_RECURSION_DEPTH) {
    callbacks.onSplashBarrels?.(origin, radius, maxDamage, attackerId);
  }

  for (const target of players.values()) {
    if (!target.schema.isAlive) continue;
    if (!includeAttacker && attacker && target.sessionId === attacker.sessionId) continue;

    const targetCenter: Vec3 = {
      x: target.movement.x,
      y: target.movement.y + 0.2,
      z: target.movement.z,
    };
    const dist = Math.hypot(
      targetCenter.x - origin.x,
      targetCenter.y - origin.y,
      targetCenter.z - origin.z,
    );
    if (dist >= radius) continue;

    const los = hasLineOfSight(rapier, world, origin, targetCenter, target.collider, (col) => {
      if (grenadeSystem.isGrenadeCollider(col.handle)) return false;
      for (const other of players.values()) {
        if (other.collider.handle === col.handle && other !== target) return false;
      }
      return true;
    });
    if (!los) continue;

    const dmg = computeSplashDamage(dist, radius, maxDamage);
    if (dmg > 0) {
      damageSystem.applyDamage(
        target,
        attacker,
        dmg,
        targetCenter,
        "splash",
        recursionDepth,
        rapier,
        world,
        state,
        players,
        grenadeSystem,
        callbacks,
      );
    }
  }
}

export function runBurnDamageTick(
  damageSystem: DamageSystem,
  player: PlayerEntity,
  dt: number,
  rapier: typeof RAPIER,
  world: World,
  state: ArenaState,
  players: Map<string, PlayerEntity>,
  grenadeSystem: GrenadeSystem,
  callbacks: CombatBroadcastCallbacks,
): void {
  if (!player.schema.isAlive || player.burnTimerSec <= 0) return;
  player.burnTimerSec = Math.max(0, player.burnTimerSec - dt);
  player.burnAccumDamage += player.burnDps * dt;
  const tickDmg = Math.floor(player.burnAccumDamage);
  if (tickDmg >= 2) {
    player.burnAccumDamage -= tickDmg;
    const attacker = player.burnAttackerId ? players.get(player.burnAttackerId) ?? null : null;
    damageSystem.applyDamage(
      player,
      attacker,
      tickDmg,
      { x: player.movement.x, y: player.movement.y + 0.2, z: player.movement.z },
      "burn",
      1,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
    );
  }
  if (player.burnTimerSec === 0) {
    player.burnDps = 0;
    player.burnAccumDamage = 0;
  }
}
