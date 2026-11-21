import {
  GUN_GAME_FINAL_TIER,
  getGameModeConfig,
  getGunGameTier,
  type DamageSource,
  type GameMode,
  type GameModeConfig,
  type GunGameWeaponTier,
} from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";
import { KothZoneTracker } from "./KothZoneTracker";

export interface ActiveWeaponOverride {
  id: string;
  name: string;
  icon: string;
  tier: number;
  damage: number;
  fireCooldownSec: number;
  magSize: number;
  reloadDurationSec: number;
  pellets: number;
  spreadRad: number;
  splashRadius: number;
  splashDamage: number;
  ricochetBounces: number;
  pierceCount: number;
  meleeOnly: boolean;
  meleeOneHitKill: boolean;
}

export interface GunGameKillResult {
  wonMatch: boolean;
  advanced: boolean;
  previousTier: number;
  newTier: number;
  weaponName: string;
}

export interface ModeMovementModifiers {
  gravityMultiplier: number;
  dashCooldownMultiplier: number;
  extraJumpsBonus: number;
  airControlMultiplier: number;
}

const INSTAGIB_RAILGUN_OVERRIDE: ActiveWeaponOverride = {
  id: "instagib_railgun",
  name: "Instagib Railgun",
  icon: "⚡",
  tier: 0,
  damage: 9999,
  fireCooldownSec: 0.72,
  magSize: 6,
  reloadDurationSec: 0.9,
  pellets: 1,
  spreadRad: 0,
  splashRadius: 0,
  splashDamage: 0,
  ricochetBounces: 0,
  pierceCount: 3,
  meleeOnly: false,
  meleeOneHitKill: false,
};

function tierToWeaponOverride(tierDef: GunGameWeaponTier): ActiveWeaponOverride {
  return {
    id: tierDef.id,
    name: tierDef.name,
    icon: tierDef.icon,
    tier: tierDef.tier,
    damage: tierDef.damage,
    fireCooldownSec: tierDef.fireCooldownSec,
    magSize: tierDef.magSize,
    reloadDurationSec: tierDef.reloadDurationSec,
    pellets: tierDef.pellets,
    spreadRad: tierDef.spreadRad,
    splashRadius: tierDef.splashRadius,
    splashDamage: tierDef.splashDamage,
    ricochetBounces: tierDef.ricochetBounces,
    pierceCount: tierDef.pierceCount,
    meleeOnly: tierDef.meleeOnly,
    meleeOneHitKill: tierDef.meleeOneHitKill,
  };
}

export class GameModeSystem {
  readonly kothTracker = new KothZoneTracker();
  private readonly gunGameTiers = new Map<string, number>();

  getModeConfig(mode: GameMode): GameModeConfig {
    return getGameModeConfig(mode);
  }

  getMovementModifiers(mode: GameMode): ModeMovementModifiers {
    const cfg = getGameModeConfig(mode);
    return {
      gravityMultiplier: cfg.gravityMultiplier,
      dashCooldownMultiplier: cfg.dashCooldownMultiplier,
      extraJumpsBonus: cfg.extraJumpsBonus,
      airControlMultiplier: cfg.airControlMultiplier,
    };
  }

  getPlayerTier(sessionId: string): number {
    return this.gunGameTiers.get(sessionId) ?? 0;
  }

  setPlayerTier(sessionId: string, tier: number): number {
    const clamped = Number.isFinite(tier)
      ? Math.max(0, Math.min(GUN_GAME_FINAL_TIER, Math.floor(tier)))
      : 0;
    this.gunGameTiers.set(sessionId, clamped);
    return clamped;
  }

  getAllGunGameTiers(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [id, tier] of this.gunGameTiers.entries()) {
      out[id] = tier;
    }
    return out;
  }

  removePlayer(sessionId: string): void {
    this.gunGameTiers.delete(sessionId);
    this.kothTracker.removePlayer(sessionId);
  }

  syncPlayerWeaponAmmo(mode: GameMode, player: PlayerEntity): void {
    const override = this.getActiveWeaponOverride(mode, player);
    if (!override) {
      return;
    }
    player.schema.magSize = override.magSize;
    player.schema.ammo = override.magSize;
    player.schema.isReloading = false;
    player.reloadTimerSec = 0;
    player.fireCooldownSec = 0;
  }

  recordGunGameKill(
    killer: PlayerEntity,
    source: DamageSource,
  ): GunGameKillResult {
    const previousTier = this.getPlayerTier(killer.sessionId);

    // At Tier 7 (Golden One-Hit Katana), ONLY a melee kill wins the match immediately.
    if (previousTier >= GUN_GAME_FINAL_TIER) {
      const katana = getGunGameTier(GUN_GAME_FINAL_TIER);
      if (source === "melee") {
        return {
          wonMatch: true,
          advanced: true,
          previousTier,
          newTier: GUN_GAME_FINAL_TIER,
          weaponName: katana.name,
        };
      }
      return {
        wonMatch: false,
        advanced: false,
        previousTier,
        newTier: GUN_GAME_FINAL_TIER,
        weaponName: katana.name,
      };
    }

    const nextTier = Math.min(GUN_GAME_FINAL_TIER, previousTier + 1);
    this.gunGameTiers.set(killer.sessionId, nextTier);
    const tierDef = getGunGameTier(nextTier);

    killer.schema.magSize = tierDef.magSize;
    killer.schema.ammo = tierDef.magSize;
    killer.schema.isReloading = false;
    killer.reloadTimerSec = 0;
    killer.fireCooldownSec = 0;

    return {
      wonMatch: false,
      advanced: true,
      previousTier,
      newTier: nextTier,
      weaponName: tierDef.name,
    };
  }

  getActiveWeaponOverride(
    mode: GameMode,
    player: PlayerEntity,
  ): ActiveWeaponOverride | null {
    if (mode === "gun_game") {
      const tier = this.getPlayerTier(player.sessionId);
      return tierToWeaponOverride(getGunGameTier(tier));
    }
    if (mode === "instagib") {
      return INSTAGIB_RAILGUN_OVERRIDE;
    }
    return null;
  }

  resetRound(mapId?: string): void {
    this.kothTracker.resetRound(mapId);
  }

  resetMatch(mapId?: string): void {
    this.gunGameTiers.clear();
    this.kothTracker.resetRound(mapId);
  }
}
