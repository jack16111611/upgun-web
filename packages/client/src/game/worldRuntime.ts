import type { Room } from "@colyseus/sdk";
import {
  createBasePlayerStats,
  NEON_FOUNDRY_MAP,
  type DeviceType,
  type HatId,
  type MatchPhase,
  type PlayerComputedStats,
  type Vec3,
} from "@upgun/shared";

export interface SyncedPlayerSnapshot {
  sessionId: string;
  displayName: string;
  deviceType: DeviceType;
  color: string;
  bodyColor: string;
  hatId: HatId;
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  kills: number;
  score: number;
}

export interface SyncedGrenadeSnapshot {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  fuseLeft: number;
}

export interface TracerVisual {
  origin: Vec3;
  end: Vec3;
  hit: boolean;
  createdAt: number;
  durationMs: number;
}

export interface ExplosionVisual {
  position: Vec3;
  radius: number;
  createdAt: number;
  durationMs: number;
}

export interface WorldRuntime {
  room: Room | null;
  localSessionId: string | null;
  phase: MatchPhase;
  mapId: string;
  localStats: PlayerComputedStats;
  players: Map<string, SyncedPlayerSnapshot>;
  grenades: Map<string, SyncedGrenadeSnapshot>;
  tracers: TracerVisual[];
  explosions: ExplosionVisual[];
  needsSpawnSnap: boolean;
  pendingSpawnYaw: number;
}

export const worldRuntime: WorldRuntime = {
  room: null,
  localSessionId: null,
  phase: "lobby",
  mapId: NEON_FOUNDRY_MAP.id,
  localStats: createBasePlayerStats(),
  players: new Map(),
  grenades: new Map(),
  tracers: [],
  explosions: [],
  needsSpawnSnap: false,
  pendingSpawnYaw: 0,
};

export function resetWorldRuntime(): void {
  worldRuntime.room = null;
  worldRuntime.localSessionId = null;
  worldRuntime.phase = "lobby";
  worldRuntime.mapId = NEON_FOUNDRY_MAP.id;
  worldRuntime.localStats = createBasePlayerStats();
  worldRuntime.players.clear();
  worldRuntime.grenades.clear();
  worldRuntime.tracers.length = 0;
  worldRuntime.explosions.length = 0;
  worldRuntime.needsSpawnSnap = false;
  worldRuntime.pendingSpawnYaw = 0;
}
