import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  getAimDirection,
  getEyePosition,
  runCardHook,
  WEAPON_RIFLE,
  type DamageSource,
  type FireHookContext,
  type Vec3,
} from "@upgun/shared";
import type { ActiveWeaponOverride } from "../modes";
import type { ArenaState } from "../schema/ArenaState";
import { DamageSystem, type CombatBroadcastCallbacks } from "./DamageSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import { traceHitscanShot } from "./HitscanTracer";
import type { PlayerEntity } from "./PlayerEntity";

export type { CombatBroadcastCallbacks };

export class CombatSystem {
  readonly damageSystem = new DamageSystem();

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
    this.damageSystem.applyDamage(
      target,
      attacker,
      rawDamage,
      point,
      source,
      recursionDepth,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
      hitDirection,
      isCrit,
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
    this.damageSystem.handleDashTriggered(
      player,
      dirX,
      dirZ,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
    );
  }

  stepPlayerCombat(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    player: PlayerEntity,
    players: Map<string, PlayerEntity>,
    colliderToSession: Map<number, string>,
    grenadeSystem: GrenadeSystem,
    dt: number,
    allowWeapons: boolean,
    callbacks: CombatBroadcastCallbacks,
    fireRateBonus = 1,
    infiniteMode = false,
    weaponOverride: ActiveWeaponOverride | null = null,
    allowGrenades = true,
  ): void {
    player.fireCooldownSec = Math.max(0, player.fireCooldownSec - dt);
    player.grenadeCooldownSec = Math.max(0, player.grenadeCooldownSec - dt);
    this.damageSystem.stepBurnDamage(
      player,
      dt,
      rapier,
      world,
      state,
      players,
      grenadeSystem,
      callbacks,
    );

    const activeMagSize = weaponOverride ? Math.max(1, weaponOverride.magSize) : player.stats.magSize;
    player.schema.magSize = activeMagSize;
    if (player.schema.ammo > activeMagSize) {
      player.schema.ammo = activeMagSize;
    }

    if (infiniteMode) {
      player.schema.ammo = activeMagSize;
      player.schema.isReloading = false;
      player.reloadTimerSec = 0;
      player.grenadeCooldownSec = 0;
    } else if (player.schema.isReloading) {
      player.reloadTimerSec -= dt;
      if (player.reloadTimerSec <= 0) {
        player.schema.isReloading = false;
        player.schema.ammo = activeMagSize;
        player.reloadTimerSec = 0;
      }
    }

    if (!allowWeapons || !player.schema.isAlive) {
      player.grenadeHeld = player.latestInput.grenade;
      return;
    }

    const input = player.latestInput;
    const baseReloadSec = weaponOverride ? weaponOverride.reloadDurationSec : WEAPON_RIFLE.reloadDurationSec;
    const reloadDuration = baseReloadSec * player.stats.reloadTimeMultiplier;

    if (
      !weaponOverride?.meleeOnly &&
      !infiniteMode &&
      !player.schema.isReloading &&
      ((input.reload && player.schema.ammo < activeMagSize) ||
        (input.fire && player.schema.ammo === 0))
    ) {
      player.schema.isReloading = true;
      player.reloadTimerSec = reloadDuration;
    }

    if (
      !weaponOverride?.meleeOnly &&
      input.fire &&
      !player.schema.isReloading &&
      player.fireCooldownSec <= 0 &&
      player.schema.ammo > 0
    ) {
      this.firePrimaryWeapon(
        rapier,
        world,
        state,
        player,
        players,
        colliderToSession,
        grenadeSystem,
        callbacks,
        fireRateBonus,
        infiniteMode,
        weaponOverride,
      );
    }

    if (allowGrenades && input.grenade && !player.grenadeHeld && player.grenadeCooldownSec <= 0) {
      player.grenadeCooldownSec = infiniteMode ? 0.15 : player.stats.grenadeCooldown;
      const origin = getEyePosition(player.movement);
      const dir = getAimDirection(input.yaw, input.pitch);
      grenadeSystem.spawnThrownGrenade(rapier, world, state, player, origin, dir);
    }

    player.grenadeHeld = input.grenade;
  }

  private firePrimaryWeapon(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    player: PlayerEntity,
    players: Map<string, PlayerEntity>,
    colliderToSession: Map<number, string>,
    grenadeSystem: GrenadeSystem,
    callbacks: CombatBroadcastCallbacks,
    fireRateBonus = 1,
    infiniteMode = false,
    weaponOverride: ActiveWeaponOverride | null = null,
  ): void {
    const input = player.latestInput;
    if (!infiniteMode) {
      player.schema.ammo -= 1;
    }
    const baseCooldown = weaponOverride ? weaponOverride.fireCooldownSec : WEAPON_RIFLE.fireCooldownSec;
    player.fireCooldownSec =
      baseCooldown / (player.stats.fireRateMultiplier * fireRateBonus);

    const origin = getEyePosition(player.movement);
    const dir = getAimDirection(input.yaw, input.pitch);
    const hpRatio = player.stats.maxHp > 0 ? player.schema.hp / player.stats.maxHp : 1;

    const fireCtx: FireHookContext = {
      shooterId: player.sessionId,
      origin,
      direction: dir,
      ammoRemaining: player.schema.ammo,
      magSize: weaponOverride ? weaponOverride.magSize : player.stats.magSize,
      stats: player.stats,
      damageMultiplier: player.stats.damageMultiplier,
      ricochetBounces: weaponOverride?.ricochetBounces ?? 0,
      pierceCount: weaponOverride?.pierceCount ?? 0,
      bonusSplashRadius: weaponOverride?.splashRadius ?? 0,
      bonusSplashDamage: weaponOverride?.splashDamage ?? 0,
      shooterHpRatio: hpRatio,
      extraRays: [],
    };
    runCardHook(player.effectiveCards, "onFire", fireCtx);

    const pellets = weaponOverride ? Math.max(1, weaponOverride.pellets) : 1;
    const spread = weaponOverride?.spreadRad ?? 0;
    const baseRays = [{ direction: dir, damageScale: 1 }];
    for (let i = 1; i < pellets; i++) {
      const yawOff = (Math.random() - 0.5) * 2 * spread;
      const pitchOff = (Math.random() - 0.5) * 2 * spread;
      baseRays.push({
        direction: getAimDirection(input.yaw + yawOff, input.pitch + pitchOff),
        damageScale: 1,
      });
    }

    const rays = [...baseRays, ...fireCtx.extraRays];
    for (const raySpec of rays) {
      traceHitscanShot({
        rapier,
        world,
        state,
        player,
        players,
        colliderToSession,
        grenadeSystem,
        damageSystem: this.damageSystem,
        startOrigin: origin,
        startDir: raySpec.direction,
        baseDamage: weaponOverride?.damage ?? WEAPON_RIFLE.damage,
        dmgMult: fireCtx.damageMultiplier * raySpec.damageScale,
        maxBounces: fireCtx.ricochetBounces,
        maxPierces: fireCtx.pierceCount ?? 0,
        bonusSplashRadius: fireCtx.bonusSplashRadius ?? 0,
        bonusSplashDamage: fireCtx.bonusSplashDamage ?? 0,
        callbacks,
      });
    }
  }
}
