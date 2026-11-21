import type {
  ArenaBlock,
  ArenaBlockKind,
  BlockMaterialKind,
  SpawnPoint,
} from "../arena";

export type { ArenaBlock, ArenaBlockKind, BlockMaterialKind, SpawnPoint };

export type ArenaDecorPreset =
  | "courtyard"
  | "temple"
  | "canyon"
  | "construction";

export interface JumpPadDefinition {
  id: string;
  position: [number, number, number];
  radius: number;
  launchVelocity: [number, number, number];
  color: string;
}

export interface ArenaTheme {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  gridColor: string;
  accentColor: string;
  sunPosition: [number, number, number];
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  hemisphereSky: string;
  hemisphereGround: string;
  floorMaterial: BlockMaterialKind;
  decorPreset: ArenaDecorPreset;
}

export interface ArenaMapDefinition {
  id: string;
  name: string;
  subtitle: string;
  halfSize: number;
  blocks: readonly ArenaBlock[];
  spawnPoints: readonly SpawnPoint[];
  jumpPads: readonly JumpPadDefinition[];
  kothZones?: readonly [number, number, number][];
  theme: ArenaTheme;
}

export type HatId = "none" | "crown" | "tophat" | "viking" | "antenna";

export const HAT_IDS: readonly HatId[] = [
  "none",
  "crown",
  "tophat",
  "viking",
  "antenna",
] as const;

export const DEFAULT_HAT_ID: HatId = "none";

const HAT_ID_SET: ReadonlySet<string> = new Set(HAT_IDS);

export interface RobotBodyColorOption {
  id: string;
  name: string;
  hex: string;
}

export const ROBOT_BODY_COLORS: readonly RobotBodyColorOption[] = [
  { id: "cyan", name: "Cyber Cyan", hex: "#38bdf8" },
  { id: "crimson", name: "Neon Crimson", hex: "#f43f5e" },
  { id: "violet", name: "Hyper Violet", hex: "#a855f7" },
  { id: "emerald", name: "Volt Emerald", hex: "#10b981" },
  { id: "amber", name: "Solar Amber", hex: "#f59e0b" },
  { id: "magenta", name: "Plasma Pink", hex: "#ec4899" },
] as const;

export const DEFAULT_BODY_COLOR = "#38bdf8";

const ALLOWED_COLOR_SET: ReadonlySet<string> = new Set(
  ROBOT_BODY_COLORS.map((option) => option.hex),
);

export function sanitizeHatId(raw: unknown): HatId {
  if (typeof raw !== "string") {
    return DEFAULT_HAT_ID;
  }
  const normalized = raw.trim().toLowerCase();
  return HAT_ID_SET.has(normalized) ? (normalized as HatId) : DEFAULT_HAT_ID;
}

export function sanitizeBodyColor(raw: unknown): string {
  if (typeof raw !== "string") {
    return DEFAULT_BODY_COLOR;
  }
  const normalized = raw.trim().toLowerCase();
  return ALLOWED_COLOR_SET.has(normalized) ? normalized : DEFAULT_BODY_COLOR;
}
