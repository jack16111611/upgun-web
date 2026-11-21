export interface GunGameWeaponTier {
  tier: number;
  id: string;
  name: string;
  icon: string;
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

export const GUN_GAME_FINAL_TIER = 7;

export const GUN_GAME_TIERS: readonly GunGameWeaponTier[] = [
  {
    tier: 0,
    id: "burst_rifle",
    name: "Burst Rifle",
    icon: "🔫",
    damage: 24,
    fireCooldownSec: 0.11,
    magSize: 15,
    reloadDurationSec: 1.15,
    pellets: 1,
    spreadRad: 0.015,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 1,
    id: "heavy_slugger",
    name: "Heavy Slugger",
    icon: "💥",
    damage: 42,
    fireCooldownSec: 0.32,
    magSize: 8,
    reloadDurationSec: 1.3,
    pellets: 1,
    spreadRad: 0.008,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 2,
    id: "plasma_smg",
    name: "Plasma SMG",
    icon: "⚡",
    damage: 14,
    fireCooldownSec: 0.075,
    magSize: 28,
    reloadDurationSec: 1.1,
    pellets: 1,
    spreadRad: 0.035,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 3,
    id: "scatter_shotgun",
    name: "Scatter Shotgun",
    icon: "🔥",
    damage: 14,
    fireCooldownSec: 0.65,
    magSize: 6,
    reloadDurationSec: 1.45,
    pellets: 6,
    spreadRad: 0.085,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 4,
    id: "explosive_launcher",
    name: "Explosive Launcher",
    icon: "🚀",
    damage: 38,
    fireCooldownSec: 0.72,
    magSize: 5,
    reloadDurationSec: 1.55,
    pellets: 1,
    spreadRad: 0.01,
    splashRadius: 3.4,
    splashDamage: 48,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 5,
    id: "precision_railgun",
    name: "Precision Railgun",
    icon: "🎯",
    damage: 78,
    fireCooldownSec: 0.85,
    magSize: 4,
    reloadDurationSec: 1.5,
    pellets: 1,
    spreadRad: 0,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 2,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 6,
    id: "ricochet_carbine",
    name: "Ricochet Carbine",
    icon: "💠",
    damage: 28,
    fireCooldownSec: 0.19,
    magSize: 12,
    reloadDurationSec: 1.2,
    pellets: 1,
    spreadRad: 0.012,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 3,
    pierceCount: 0,
    meleeOnly: false,
    meleeOneHitKill: false,
  },
  {
    tier: 7,
    id: "golden_katana",
    name: "Golden One-Hit Katana",
    icon: "⚔️",
    damage: 0,
    fireCooldownSec: 0.5,
    magSize: 0,
    reloadDurationSec: 0,
    pellets: 0,
    spreadRad: 0,
    splashRadius: 0,
    splashDamage: 0,
    ricochetBounces: 0,
    pierceCount: 0,
    meleeOnly: true,
    meleeOneHitKill: true,
  },
] as const;

export function getGunGameTier(tier: number): GunGameWeaponTier {
  const safeIndex = Number.isFinite(tier)
    ? Math.max(0, Math.min(GUN_GAME_FINAL_TIER, Math.floor(tier)))
    : 0;
  return GUN_GAME_TIERS[safeIndex] ?? GUN_GAME_TIERS[0]!;
}
