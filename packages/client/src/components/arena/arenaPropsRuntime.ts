import type { Vec3 } from "@upgun/shared";

export interface SyncedBarrel {
  id: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  isIntact: boolean;
  respawnTimer?: number;
}

export interface SyncedTeleporter {
  id: string;
  a: [number, number, number];
  b: [number, number, number];
  radius: number;
  colorA: string;
  colorB: string;
}

export interface SyncedOrb {
  id: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  respawnTimer?: number;
}

export interface TeleportFlashVisual {
  position: Vec3;
  color: string;
  createdAt: number;
  durationMs: number;
}

export interface ArenaPropsRuntime {
  mapId: string;
  barrels: Map<string, SyncedBarrel>;
  teleporters: SyncedTeleporter[];
  orbs: Map<string, SyncedOrb>;
  teleportFlashes: TeleportFlashVisual[];
}

const SUNLIT_COURTYARD_TELEPORTERS: readonly SyncedTeleporter[] = [
  {
    id: "sc_tp_flanks",
    a: [-15.2, 0, 0],
    b: [15.2, 0, 0],
    radius: 1.2,
    colorA: "#0ea5e9",
    colorB: "#f97316",
  },
  {
    id: "sc_tp_arches",
    a: [0, 0, -14.8],
    b: [0, 0, 14.8],
    radius: 1.2,
    colorA: "#14b8a6",
    colorB: "#eab308",
  },
];

const ALPINE_SKY_TEMPLE_TELEPORTERS: readonly SyncedTeleporter[] = [
  {
    id: "ast_tp_terraces",
    a: [-14.5, 0, 0],
    b: [14.5, 0, 0],
    radius: 1.2,
    colorA: "#38bdf8",
    colorB: "#fbbf24",
  },
  {
    id: "ast_tp_gates",
    a: [0, 0, -14.5],
    b: [0, 0, 14.5],
    radius: 1.2,
    colorA: "#22d3ee",
    colorB: "#f43f5e",
  },
];

const DESERT_CANYON_OUTPOST_TELEPORTERS: readonly SyncedTeleporter[] = [
  {
    id: "dco_tp_canyon",
    a: [-15.2, 0, -6.0],
    b: [15.2, 0, 6.0],
    radius: 1.25,
    colorA: "#f59e0b",
    colorB: "#06b6d4",
  },
  {
    id: "dco_tp_bazaar",
    a: [-15.2, 0, 6.0],
    b: [15.2, 0, -6.0],
    radius: 1.25,
    colorA: "#ea580c",
    colorB: "#38bdf8",
  },
];

const SKYLINE_CONSTRUCTION_TELEPORTERS: readonly SyncedTeleporter[] = [
  {
    id: "scy_tp_deck",
    a: [-15.0, 0, 0],
    b: [15.0, 0, 0],
    radius: 1.2,
    colorA: "#facc15",
    colorB: "#0284c7",
  },
  {
    id: "scy_tp_girders",
    a: [0, 0, -15.0],
    b: [0, 0, 15.0],
    radius: 1.2,
    colorA: "#fb923c",
    colorB: "#22d3ee",
  },
];

const DEFAULT_TELEPORTERS_BY_MAP: Readonly<Record<string, readonly SyncedTeleporter[]>> = {
  sunlit_courtyard: SUNLIT_COURTYARD_TELEPORTERS,
  alpine_sky_temple: ALPINE_SKY_TEMPLE_TELEPORTERS,
  desert_canyon_outpost: DESERT_CANYON_OUTPOST_TELEPORTERS,
  skyline_construction_yard: SKYLINE_CONSTRUCTION_TELEPORTERS,
  neon_foundry: SUNLIT_COURTYARD_TELEPORTERS,
  skyline_rooftops: ALPINE_SKY_TEMPLE_TELEPORTERS,
  cyber_colosseum: DESERT_CANYON_OUTPOST_TELEPORTERS,
};

export function getDefaultTeleportersForMap(mapId: string): readonly SyncedTeleporter[] {
  return DEFAULT_TELEPORTERS_BY_MAP[mapId] ?? SUNLIT_COURTYARD_TELEPORTERS;
}

const MAX_QUEUED_FLASHES = 24;

export const arenaPropsRuntime: ArenaPropsRuntime = {
  mapId: "sunlit_courtyard",
  barrels: new Map(),
  teleporters: [],
  orbs: new Map(),
  teleportFlashes: [],
};

export function pushTeleportFlash(pos: Vec3, color: string, durationMs = 460): void {
  if (arenaPropsRuntime.teleportFlashes.length >= MAX_QUEUED_FLASHES) {
    arenaPropsRuntime.teleportFlashes.shift();
  }
  arenaPropsRuntime.teleportFlashes.push({
    position: { x: pos.x, y: pos.y, z: pos.z },
    color,
    createdAt: performance.now(),
    durationMs,
  });
}

export function resetArenaPropsRuntime(): void {
  arenaPropsRuntime.mapId = "sunlit_courtyard";
  arenaPropsRuntime.barrels.clear();
  arenaPropsRuntime.teleporters = [];
  arenaPropsRuntime.orbs.clear();
  arenaPropsRuntime.teleportFlashes.length = 0;
}
