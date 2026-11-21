import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  MAX_RECURSION_DEPTH,
  PLAYER_DASH_DURATION_SEC,
  runCardHook,
  type DamageSource,
  type ExplosionEvent,
  type HitEvent,
  type ShotEvent,
  type Vec3,
} from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import { runDashHooks } from "./DashHookHandler";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { PlayerEntity } from "./PlayerEntity";
import {
  runBurnDamageTick,
  runRadialSplashDamage,
  type RadialSplashOptions,
} from "./SplashBurnHelper";

export interface CombatBroadcastCallbacks {
  onShot: (event: ShotEvent) => void;
  onHit: (event: HitEvent) => void;
  onExplosion: (event: ExplosionEvent) => void;
  isGodMode?: (sessionId: string) => boolean;
  consumeOvershield?: (sessionId: string, damage: number) => number;
  onKill?: (killer: PlayerEntity, victim: PlayerEntity, source: DamageSource) => void;
  onDeath?: (victim: PlayerEntity) => void;
  onParryReflect?: (deflector: PlayerEntity, attacker: PlayerEntity) => void;
  onSplashBarrels?: (origin: Vec3, radius: number, maxDamage: number, attackerId: string) => void;
  raycastBarrel?: (
    origin: Vec3,
    dir: Vec3,
    maxDist: number,
  ) => { barrelId: string; distance: number; point: Vec3 } | null;
  damageBarrel?: (barrelId: string, damage: number, attackerId: string) => void;
}

export class DamageSystem {
  applyDamage(
    target: PlayerEntity,
    attacker: PlayerEntity | null,
    rawDamage: number,
    point: Vec3,
    source: DamageSource,
    recursionDepth: number,
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    grenadeSystem: GrenadeSystem,
    callbacks: CombatBroadcastCallbacks,
    hitDirection?: Vec3,
    isCrit = false,
  ): void {
    if (
      recursionDepth > MAX_RECURSION_DEPTH ||
      !Number.isFinite(rawDamage) ||
      !target.schema.isAlive ||
      rawDamage <= 0 ||
      target.isInvulnerable() ||
      callbacks.isGodMode?.(target.sessionId)
    ) {
      return;
    }

    // Deflector Core: reflect incoming rifle shots back at the attacker
    if (
      source === "rifle" &&
      recursionDepth < MAX_RECURSION_DEPTH &&
      target.reflectShotsTimerSec > 0 &&
      attacker &&
      attacker.sessionId !== target.sessionId &&
      attacker.schema.isAlive
    ) {
      callbacks.onParryReflect?.(target, attacker);
      this.applyDamage(
        attacker,
        target,
        rawDamage,
        { x: attacker.movement.x, y: attacker.movement.y + 0.2, z: attacker.movement.z },
        "thorns",
        recursionDepth + 1,
        rapier,
        world,
        state,
        players,
        grenadeSystem,
        callbacks,
      );
      return;
    }

    let reflectedDamage = 0;
    let preventedSurviveHp: number | null = null;
    let preventedFreeDash = false;

    const damageCtx = {
      targetId: target.sessionId,
      attackerId: attacker?.sessionId ?? null,
      damage: rawDamage,
      source,
      stats: target.stats,
      damageMultiplier: 1,
      currentHp: target.schema.hp,
      secondWindAvailable: target.secondWindAvailable,
      reflectDamage: (amount: number) => {
        reflectedDamage += Math.max(0, amount);
      },
      preventLethal: (surviveHp: number, freeDash = false) => {
        if (target.secondWindAvailable) {
          preventedSurviveHp = Math.max(1, Math.min(target.stats.maxHp, Math.round(surviveHp)));
          preventedFreeDash = freeDash;
        }
      },
    };
    runCardHook(target.effectiveCards, "onTakeDamage", damageCtx);

    const finalDamage = Math.max(1, Math.round(rawDamage * damageCtx.damageMultiplier));
    const afterShield = callbacks.consumeOvershield
      ? callbacks.consumeOvershield(target.sessionId, finalDamage)
      : finalDamage;
    let remainingHp = Math.max(0, target.schema.hp - afterShield);

    if (remainingHp === 0 && preventedSurviveHp !== null && target.secondWindAvailable) {
      target.secondWindAvailable = false;
      remainingHp = preventedSurviveHp;
      target.setInvulnerable(0.35);
      if (preventedFreeDash) {
        target.movement.dashCooldown = 0;
        target.movement.dashTimeLeft = PLAYER_DASH_DURATION_SEC;
        target.movement.dashDirX = -Math.sin(target.latestInput.yaw);
        target.movement.dashDirZ = -Math.cos(target.latestInput.yaw);
      }
    }

    target.schema.hp = remainingHp;
    target.timeSinceDamageSec = 0;

    const killed = remainingHp === 0;
    if (killed) {
      target.schema.isAlive = false;
      callbacks.onDeath?.(target);
      if (attacker && attacker.sessionId !== target.sessionId) {
        attacker.schema.kills += 1;
        if (source === "melee") {
          attacker.schema.meleeKills += 1;
        }
        callbacks.onKill?.(attacker, target, source);
      }
    }

    callbacks.onHit({
      shooterId: attacker?.sessionId ?? "",
      targetId: target.sessionId,
      damage: finalDamage,
      remainingHp,
      killed,
      crit: isCrit,
      point,
    });

    if (
      attacker &&
      attacker.sessionId !== target.sessionId &&
      source !== "thorns" &&
      source !== "burn"
    ) {
      runCardHook(attacker.effectiveCards, "onHit", {
        shooterId: attacker.sessionId,
        targetId: target.sessionId,
        damage: finalDamage,
        point,
        direction: hitDirection,
        source,
        stats: attacker.stats,
        recursionDepth,
        killed,
        healShooter: (amount) => attacker.heal(amount),
        dealSplashDamage: (origin, radius, maxDamage, nextDepth) => {
          this.dealRadialSplash(
            origin,
            radius,
            maxDamage,
            nextDepth,
            attacker,
            rapier,
            world,
            state,
            players,
            grenadeSystem,
            callbacks,
          );
        },
        applyKnockback: (targetId, impulse) => {
          players.get(targetId)?.applyExternalImpulse(impulse);
        },
        applySlow: (targetId, factor, durationSec) => {
          players.get(targetId)?.applySlow(factor, durationSec);
        },
        applyBurn: (targetId, dps, durationSec) => {
          players.get(targetId)?.applyBurn(dps, durationSec, attacker.sessionId);
        },
        boostShooterSpeed: (multiplier, durationSec) => {
          attacker.applySpeedBoost(multiplier, durationSec);
        },
        refillMagazine: () => attacker.refillMagazine(),
        resetCooldowns: () => attacker.resetCooldowns(),
      });
    }

    if (
      reflectedDamage > 0 &&
      source !== "thorns" &&
      attacker &&
      attacker.sessionId !== target.sessionId &&
      attacker.schema.isAlive
    ) {
      this.applyDamage(
        attacker,
        target,
        reflectedDamage,
        { x: attacker.movement.x, y: attacker.movement.y, z: attacker.movement.z },
        "thorns",
        recursionDepth + 1,
        rapier,
        world,
        state,
        players,
        grenadeSystem,
        callbacks,
      );
    }

    if (killed) {
      runCardHook(target.effectiveCards, "onDeath", {
        victimId: target.sessionId,
        killerId: attacker?.sessionId ?? null,
        position: { x: target.movement.x, y: target.movement.y, z: target.movement.z },
        stats: target.stats,
        spawnGrenadeAtDeath: (params) => {
          grenadeSystem.spawnGrenadeFromParams(rapier, world, state, target, {
            ...params,
            recursionDepth: 0,
          });
        },
      });
    }
  }

  dealRadialSplash(
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
    runRadialSplashDamage(
      this,
      origin,
      radius,
      maxDamage,
      recursionDepth,
      attacker,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
      options,
    );
  }

  handleDashTriggered(
    player: PlayerEntity,
    dirX: number,
    dirZ: number,
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    grenadeSystem: GrenadeSystem,
    callbacks: CombatBroadcastCallbacks,
  ): void {
    runDashHooks(
      player,
      dirX,
      dirZ,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      this,
      callbacks,
    );
  }

  stepBurnDamage(
    player: PlayerEntity,
    dt: number,
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    grenadeSystem: GrenadeSystem,
    callbacks: CombatBroadcastCallbacks,
  ): void {
    runBurnDamageTick(
      this,
      player,
      dt,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
    );
  }
}
