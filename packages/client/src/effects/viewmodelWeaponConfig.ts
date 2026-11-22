import { GUN_GAME_FINAL_TIER, type GameMode } from "@upgun/shared";

export type ViewmodelWeaponId =
  | "classic_rifle"
  | "instagib_railgun"
  | "burst_rifle"
  | "heavy_slugger"
  | "plasma_smg"
  | "scatter_shotgun"
  | "explosive_launcher"
  | "precision_railgun"
  | "ricochet_carbine"
  | "golden_katana";

export interface ViewmodelWeaponConfig {
  id: ViewmodelWeaponId;
  accentColor: string;
  flashColor: string;
  muzzleZ: number;
  isMelee: boolean;
  recoilScale: number;
  scale: number;
}

const WEAPON_CONFIGS: Record<ViewmodelWeaponId, ViewmodelWeaponConfig> = {
  classic_rifle: {
    id: "classic_rifle",
    accentColor: "#22d3ee",
    flashColor: "#fef08a",
    muzzleZ: -0.44,
    isMelee: false,
    recoilScale: 1.0,
    scale: 0.65,
  },
  instagib_railgun: {
    id: "instagib_railgun",
    accentColor: "#c084fc",
    flashColor: "#e879f9",
    muzzleZ: -0.58,
    isMelee: false,
    recoilScale: 1.35,
    scale: 0.64,
  },
  burst_rifle: {
    id: "burst_rifle",
    accentColor: "#38bdf8",
    flashColor: "#bae6fd",
    muzzleZ: -0.45,
    isMelee: false,
    recoilScale: 0.92,
    scale: 0.65,
  },
  heavy_slugger: {
    id: "heavy_slugger",
    accentColor: "#f59e0b",
    flashColor: "#fde047",
    muzzleZ: -0.42,
    isMelee: false,
    recoilScale: 1.45,
    scale: 0.68,
  },
  plasma_smg: {
    id: "plasma_smg",
    accentColor: "#a78bfa",
    flashColor: "#c4b5fd",
    muzzleZ: -0.34,
    isMelee: false,
    recoilScale: 0.68,
    scale: 0.64,
  },
  scatter_shotgun: {
    id: "scatter_shotgun",
    accentColor: "#fb923c",
    flashColor: "#fed7aa",
    muzzleZ: -0.48,
    isMelee: false,
    recoilScale: 1.65,
    scale: 0.66,
  },
  explosive_launcher: {
    id: "explosive_launcher",
    accentColor: "#f43f5e",
    flashColor: "#fda4af",
    muzzleZ: -0.49,
    isMelee: false,
    recoilScale: 1.75,
    scale: 0.64,
  },
  precision_railgun: {
    id: "precision_railgun",
    accentColor: "#22d3ee",
    flashColor: "#67e8f9",
    muzzleZ: -0.59,
    isMelee: false,
    recoilScale: 1.4,
    scale: 0.64,
  },
  ricochet_carbine: {
    id: "ricochet_carbine",
    accentColor: "#10b981",
    flashColor: "#6ee7b7",
    muzzleZ: -0.46,
    isMelee: false,
    recoilScale: 0.95,
    scale: 0.65,
  },
  golden_katana: {
    id: "golden_katana",
    accentColor: "#facc15",
    flashColor: "#fef08a",
    muzzleZ: -0.55,
    isMelee: true,
    recoilScale: 0.6,
    scale: 0.72,
  },
};

const GUN_GAME_TIER_IDS: readonly ViewmodelWeaponId[] = [
  "burst_rifle",
  "heavy_slugger",
  "plasma_smg",
  "scatter_shotgun",
  "explosive_launcher",
  "precision_railgun",
  "ricochet_carbine",
  "golden_katana",
];

export function resolveViewmodelWeapon(
  gameMode: GameMode,
  weaponTier: number,
): ViewmodelWeaponConfig {
  if (gameMode === "instagib") {
    return WEAPON_CONFIGS.instagib_railgun;
  }
  if (gameMode === "gun_game") {
    const safeTier = Number.isFinite(weaponTier)
      ? Math.max(0, Math.min(GUN_GAME_FINAL_TIER, Math.floor(weaponTier)))
      : 0;
    const id = GUN_GAME_TIER_IDS[safeTier] ?? "burst_rifle";
    return WEAPON_CONFIGS[id];
  }
  return WEAPON_CONFIGS.classic_rifle;
}
