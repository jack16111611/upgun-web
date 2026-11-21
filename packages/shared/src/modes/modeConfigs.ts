import {
  DEFAULT_BOT_DIFFICULTY,
  DEFAULT_GAME_MODE,
  MATCH_WIN_SCORE,
  type BotDifficulty,
  type GameMode,
} from "../constants";

export interface GameModeConfig {
  id: GameMode;
  name: string;
  shortDesc: string;
  icon: string;
  allowCardDraft: boolean;
  draftsPerRound: number;
  allowGrenades: boolean;
  gravityMultiplier: number;
  airControlMultiplier: number;
  dashCooldownMultiplier: number;
  oneHitRailgun: boolean;
  extraJumpsBonus: number;
  winScore: number;
}

export const GAME_MODE_CONFIGS: readonly GameModeConfig[] = [
  {
    id: "classic",
    name: "Classic",
    shortDesc: "Standard UpGun first-to-5 arena duels with 3-card drafts.",
    icon: "🏆",
    allowCardDraft: true,
    draftsPerRound: 1,
    allowGrenades: true,
    gravityMultiplier: 1,
    airControlMultiplier: 1,
    dashCooldownMultiplier: 1,
    oneHitRailgun: false,
    extraJumpsBonus: 0,
    winScore: MATCH_WIN_SCORE,
  },
  {
    id: "gun_game",
    name: "Gun Game",
    shortDesc: "Climb 8 weapon tiers with no cards; Golden Katana melee kill wins.",
    icon: "🔫",
    allowCardDraft: false,
    draftsPerRound: 0,
    allowGrenades: false,
    gravityMultiplier: 1,
    airControlMultiplier: 1,
    dashCooldownMultiplier: 1,
    oneHitRailgun: false,
    extraJumpsBonus: 0,
    winScore: 8,
  },
  {
    id: "koth",
    name: "King of the Hill",
    shortDesc: "Hold the rotating zone to 100% (Overtime at 99% when contested).",
    icon: "👑",
    allowCardDraft: true,
    draftsPerRound: 1,
    allowGrenades: true,
    gravityMultiplier: 1,
    airControlMultiplier: 1,
    dashCooldownMultiplier: 1,
    oneHitRailgun: false,
    extraJumpsBonus: 0,
    winScore: MATCH_WIN_SCORE,
  },
  {
    id: "low_grav",
    name: "Low-Gravity Chaos",
    shortDesc: "0.35x gravity, boosted air control, half dash cooldown & double drafts.",
    icon: "🌙",
    allowCardDraft: true,
    draftsPerRound: 2,
    allowGrenades: true,
    gravityMultiplier: 0.35,
    airControlMultiplier: 1.35,
    dashCooldownMultiplier: 0.5,
    oneHitRailgun: false,
    extraJumpsBonus: 0,
    winScore: MATCH_WIN_SCORE,
  },
  {
    id: "instagib",
    name: "Instagib Railgun",
    shortDesc: "One-hit-kill piercing Railgun, zero grenades, +2 jumps & fast mobility.",
    icon: "⚡",
    allowCardDraft: false,
    draftsPerRound: 0,
    allowGrenades: false,
    gravityMultiplier: 0.9,
    airControlMultiplier: 1.25,
    dashCooldownMultiplier: 0.7,
    oneHitRailgun: true,
    extraJumpsBonus: 2,
    winScore: MATCH_WIN_SCORE,
  },
] as const;

export interface BotDifficultyProfile {
  id: BotDifficulty;
  name: string;
  reactionLagMs: number;
  turnRateRadPerSec: number;
  aimSpreadDeg: number;
  burstShotsMin: number;
  burstShotsMax: number;
  burstPauseMinSec: number;
  burstPauseMaxSec: number;
  grenadeSpreadRad: number;
  dashChance: number;
  grenadeChance: number;
}

export const BOT_DIFFICULTY_PROFILES: readonly BotDifficultyProfile[] = [
  {
    id: "easy",
    name: "Easy",
    reactionLagMs: 450,
    turnRateRadPerSec: 3.2,
    aimSpreadDeg: 11,
    burstShotsMin: 2,
    burstShotsMax: 3,
    burstPauseMinSec: 1.15,
    burstPauseMaxSec: 1.45,
    grenadeSpreadRad: 0.38,
    dashChance: 0.15,
    grenadeChance: 0.12,
  },
  {
    id: "medium",
    name: "Medium",
    reactionLagMs: 280,
    turnRateRadPerSec: 4.8,
    aimSpreadDeg: 6.5,
    burstShotsMin: 2,
    burstShotsMax: 4,
    burstPauseMinSec: 0.72,
    burstPauseMaxSec: 0.98,
    grenadeSpreadRad: 0.24,
    dashChance: 0.4,
    grenadeChance: 0.32,
  },
  {
    id: "hard",
    name: "Hard",
    reactionLagMs: 160,
    turnRateRadPerSec: 7.2,
    aimSpreadDeg: 3.5,
    burstShotsMin: 3,
    burstShotsMax: 4,
    burstPauseMinSec: 0.42,
    burstPauseMaxSec: 0.62,
    grenadeSpreadRad: 0.14,
    dashChance: 0.7,
    grenadeChance: 0.58,
  },
  {
    id: "nightmare",
    name: "Nightmare",
    reactionLagMs: 80,
    turnRateRadPerSec: 10.5,
    aimSpreadDeg: 1.5,
    burstShotsMin: 3,
    burstShotsMax: 5,
    burstPauseMinSec: 0.22,
    burstPauseMaxSec: 0.36,
    grenadeSpreadRad: 0.08,
    dashChance: 0.92,
    grenadeChance: 0.8,
  },
] as const;

const GAME_MODE_MAP: ReadonlyMap<string, GameModeConfig> = new Map(
  GAME_MODE_CONFIGS.map((cfg) => [cfg.id, cfg]),
);

const BOT_DIFFICULTY_MAP: ReadonlyMap<string, BotDifficultyProfile> = new Map(
  BOT_DIFFICULTY_PROFILES.map((profile) => [profile.id, profile]),
);

export function sanitizeGameMode(raw: unknown): GameMode {
  if (typeof raw !== "string") {
    return DEFAULT_GAME_MODE;
  }
  const normalized = raw.trim().toLowerCase();
  return GAME_MODE_MAP.has(normalized) ? (normalized as GameMode) : DEFAULT_GAME_MODE;
}

export function sanitizeBotDifficulty(raw: unknown): BotDifficulty {
  if (typeof raw !== "string") {
    return DEFAULT_BOT_DIFFICULTY;
  }
  const normalized = raw.trim().toLowerCase();
  return BOT_DIFFICULTY_MAP.has(normalized)
    ? (normalized as BotDifficulty)
    : DEFAULT_BOT_DIFFICULTY;
}

export function getGameModeConfig(mode: GameMode): GameModeConfig {
  return GAME_MODE_MAP.get(mode) ?? GAME_MODE_CONFIGS[0]!;
}

export function getBotDifficultyProfile(diff: BotDifficulty): BotDifficultyProfile {
  return BOT_DIFFICULTY_MAP.get(diff) ?? BOT_DIFFICULTY_PROFILES[1]!;
}
