import type { Vec3 } from "../constants";

export type CardRarity = "common" | "rare" | "epic";
export type CardCategory = "weapon" | "grenade" | "mobility" | "survival" | "chaos";

export interface OwnedCard {
  cardId: string;
  level: number;
}

export interface PlayerComputedStats {
  maxHp: number;
  moveSpeed: number;
  jumpForce: number;
  extraJumps: number;
  dashCooldown: number;
  dashImpulse: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  magSize: number;
  reloadTimeMultiplier: number;
  grenadeCooldown: number;
  critMultiplier: number;
  lifestealRatio: number;
  thornsRatio: number;
  gravityScale: number;
  bunnyHopBoost: number;
  regenPerSec: number;
  regenDelaySec: number;
  meleeDamageMultiplier: number;
  meleeRangeBonus: number;
  meleeCooldown: number;
}

export type DamageSource = "rifle" | "grenade" | "splash" | "thorns" | "burn" | "dash" | "melee";

export interface FireRayRequest {
  direction: Vec3;
  damageScale: number;
}

export interface FireHookContext {
  shooterId: string;
  origin: Vec3;
  direction: Vec3;
  ammoRemaining: number;
  magSize: number;
  stats: PlayerComputedStats;
  damageMultiplier: number;
  ricochetBounces: number;
  pierceCount?: number;
  shooterHpRatio?: number;
  bonusSplashRadius?: number;
  bonusSplashDamage?: number;
  extraRays: FireRayRequest[];
}

export interface HitHookContext {
  shooterId: string;
  targetId: string;
  damage: number;
  point: Vec3;
  direction?: Vec3;
  source: DamageSource;
  stats: PlayerComputedStats;
  recursionDepth: number;
  killed?: boolean;
  healShooter: (amount: number) => void;
  dealSplashDamage: (
    origin: Vec3,
    radius: number,
    maxDamage: number,
    recursionDepth: number,
  ) => void;
  applyKnockback: (targetId: string, impulse: Vec3) => void;
  applySlow: (targetId: string, factor: number, durationSec: number) => void;
  applyBurn?: (targetId: string, dps: number, durationSec: number) => void;
  boostShooterSpeed?: (multiplier: number, durationSec: number) => void;
  refillMagazine?: () => void;
  resetCooldowns?: () => void;
}

export interface GrenadeSpawnParams {
  origin: Vec3;
  velocity: Vec3;
  fuseSec: number;
  maxDamage: number;
  splashRadius: number;
  radius: number;
  restitution: number;
  sticky: boolean;
  recursionDepth: number;
}

export interface GrenadeHookContext {
  ownerId: string;
  params: GrenadeSpawnParams;
  stats: PlayerComputedStats;
}

export interface GrenadeExplodeContext {
  grenadeId: string;
  ownerId: string;
  position: Vec3;
  radius: number;
  maxDamage: number;
  recursionDepth: number;
  stats: PlayerComputedStats;
  spawnChildGrenade: (params: Omit<GrenadeSpawnParams, "recursionDepth">) => void;
  pullNearbyPlayers?: (origin: Vec3, radius: number, force: number) => void;
  launchOwnerToward?: (origin: Vec3, force: number, onlyIfAirborne?: boolean) => void;
}

export interface DashHookContext {
  playerId: string;
  position: Vec3;
  direction: Vec3;
  stats: PlayerComputedStats;
  reloadAmmo: (bullets: number) => void;
  emitKnockbackPulse: (origin: Vec3, radius: number, force: number, damage?: number) => void;
  blinkTeleport?: (distance: number, invulnSec: number) => void;
}

export interface DamageHookContext {
  targetId: string;
  attackerId: string | null;
  damage: number;
  source: DamageSource;
  stats: PlayerComputedStats;
  damageMultiplier: number;
  currentHp?: number;
  secondWindAvailable?: boolean;
  reflectDamage: (amount: number) => void;
  preventLethal?: (surviveHp: number, freeDash?: boolean) => void;
}

export interface DeathHookContext {
  victimId: string;
  killerId: string | null;
  position: Vec3;
  stats: PlayerComputedStats;
  spawnGrenadeAtDeath: (params: Omit<GrenadeSpawnParams, "recursionDepth">) => void;
}

export interface RoundStartHookContext {
  playerId: string;
  roundNumber: number;
  grantTemporaryCard: (cardId: string, level: number) => void;
  getEpicCardIds: () => string[];
}

export interface MeleeSwingHookContext {
  playerId: string;
  position: Vec3;
  direction: Vec3;
  isAirborne: boolean;
  stats: PlayerComputedStats;
  deflectRadiusBonus: number;
  reflectShotsDurationSec: number;
  lungeDistance: number;
  resetCooldownOnKill: boolean;
  triggerSeismicSlam?: (slamDamage: number, slamRadius: number) => void;
}

export interface MeleeHitHookContext {
  attackerId: string;
  targetId: string;
  targetHpRatio: number;
  baseDamage: number;
  damageMultiplier: number;
  isCrit: boolean;
  stats: PlayerComputedStats;
  healAttacker: (amount: number) => void;
  boostAttackerSpeed: (multiplier: number, durationSec: number) => void;
}

export interface CardHookContextMap {
  onFire: FireHookContext;
  onHit: HitHookContext;
  onGrenadeSpawn: GrenadeHookContext;
  onGrenadeExplode: GrenadeExplodeContext;
  onDash: DashHookContext;
  onTakeDamage: DamageHookContext;
  onDeath: DeathHookContext;
  onRoundStart: RoundStartHookContext;
  onMeleeSwing: MeleeSwingHookContext;
  onMeleeHit: MeleeHitHookContext;
}

export type CardHookName = keyof CardHookContextMap;

export interface CardDefinition {
  id: string;
  name: string;
  category: CardCategory;
  rarity: CardRarity;
  maxLevel: number;
  icon: string;
  description: (level: number) => string;
  statSummary: (level: number) => string;
  modifyStats?: (stats: PlayerComputedStats, level: number) => void;
  onFire?: (ctx: FireHookContext, level: number) => void;
  onHit?: (ctx: HitHookContext, level: number) => void;
  onGrenadeSpawn?: (ctx: GrenadeHookContext, level: number) => void;
  onGrenadeExplode?: (ctx: GrenadeExplodeContext, level: number) => void;
  onDash?: (ctx: DashHookContext, level: number) => void;
  onTakeDamage?: (ctx: DamageHookContext, level: number) => void;
  onDeath?: (ctx: DeathHookContext, level: number) => void;
  onRoundStart?: (ctx: RoundStartHookContext, level: number) => void;
  onMeleeSwing?: (ctx: MeleeSwingHookContext, level: number) => void;
  onMeleeHit?: (ctx: MeleeHitHookContext, level: number) => void;
}
