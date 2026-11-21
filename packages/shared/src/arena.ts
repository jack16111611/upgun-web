import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, World } from "@dimforge/rapier3d-compat";
import { PLAYER_SPAWN_Y } from "./constants";

export type ArenaBlockKind = "floor" | "wall" | "cover" | "platform" | "ramp";

export type BlockMaterialKind =
  | "cobblestone"
  | "terracotta"
  | "grass"
  | "sandstone"
  | "timber"
  | "concrete"
  | "marble"
  | "steel"
  | "foliage";

export interface ArenaBlock {
  id: string;
  kind: ArenaBlockKind;
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  material?: BlockMaterialKind;
}

export interface SpawnPoint {
  position: [number, number, number];
  yaw: number;
}

const RAMP_RUN = 7.0;
const RAMP_RISE = 2.6;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.36;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_Z = 8.5 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

export const ARENA_HALF_SIZE = 18;

export const ARENA_BLOCKS: readonly ArenaBlock[] = [
  // Floor (36m x 36m, generous 2m thickness: centerY = -1.0, halfY = 1.0, exact top at y = 0)
  {
    id: "floor",
    kind: "floor",
    position: [0, -1.0, 0],
    size: [36, 2, 36],
    color: "#334155",
  },

  // Outer boundary walls (6m high)
  {
    id: "wall_north",
    kind: "wall",
    position: [0, 3, -18.5],
    size: [38, 6, 1],
    color: "#475569",
  },
  {
    id: "wall_south",
    kind: "wall",
    position: [0, 3, 18.5],
    size: [38, 6, 1],
    color: "#475569",
  },
  {
    id: "wall_west",
    kind: "wall",
    position: [-18.5, 3, 0],
    size: [1, 6, 36],
    color: "#475569",
  },
  {
    id: "wall_east",
    kind: "wall",
    position: [18.5, 3, 0],
    size: [1, 6, 36],
    color: "#475569",
  },

  // Central cover pillar & symmetric mid-arena cover blocks
  {
    id: "center_pillar",
    kind: "cover",
    position: [0, 1.8, 0],
    size: [2.8, 3.6, 2.8],
    color: "#64748b",
  },
  {
    id: "cover_north",
    kind: "cover",
    position: [0, 0.9, -7.5],
    size: [4.2, 1.8, 1.2],
    color: "#64748b",
  },
  {
    id: "cover_south",
    kind: "cover",
    position: [0, 0.9, 7.5],
    size: [4.2, 1.8, 1.2],
    color: "#64748b",
  },
  {
    id: "cover_nw",
    kind: "cover",
    position: [-5.5, 1.2, -4.5],
    size: [1.6, 2.4, 1.6],
    color: "#94a3b8",
  },
  {
    id: "cover_se",
    kind: "cover",
    position: [5.5, 1.2, 4.5],
    size: [1.6, 2.4, 1.6],
    color: "#94a3b8",
  },
  {
    id: "cover_ne",
    kind: "cover",
    position: [5.5, 1.2, -4.5],
    size: [1.6, 2.4, 1.6],
    color: "#94a3b8",
  },
  {
    id: "cover_sw",
    kind: "cover",
    position: [-5.5, 1.2, 4.5],
    size: [1.6, 2.4, 1.6],
    color: "#94a3b8",
  },

  // West elevated platform (top at y = 2.6) + supports + South ramp
  {
    id: "platform_west",
    kind: "platform",
    position: [-11.5, 2.4, 0],
    size: [5, 0.4, 10],
    color: "#3b82f6",
  },
  {
    id: "platform_west_support_n",
    kind: "cover",
    position: [-11.5, 1.1, -4.2],
    size: [4.6, 2.2, 1.2],
    color: "#475569",
  },
  {
    id: "platform_west_support_s",
    kind: "cover",
    position: [-11.5, 1.1, 4.2],
    size: [4.6, 2.2, 1.2],
    color: "#475569",
  },
  {
    id: "ramp_west",
    kind: "ramp",
    position: [-11.5, RAMP_CENTER_Y, RAMP_CENTER_Z],
    size: [3.4, RAMP_THICKNESS, RAMP_LENGTH],
    rotation: [RAMP_ANGLE, 0, 0],
    color: "#60a5fa",
  },

  // East elevated platform (top at y = 2.6) + supports + North ramp
  {
    id: "platform_east",
    kind: "platform",
    position: [11.5, 2.4, 0],
    size: [5, 0.4, 10],
    color: "#f59e0b",
  },
  {
    id: "platform_east_support_n",
    kind: "cover",
    position: [11.5, 1.1, -4.2],
    size: [4.6, 2.2, 1.2],
    color: "#475569",
  },
  {
    id: "platform_east_support_s",
    kind: "cover",
    position: [11.5, 1.1, 4.2],
    size: [4.6, 2.2, 1.2],
    color: "#475569",
  },
  {
    id: "ramp_east",
    kind: "ramp",
    position: [11.5, RAMP_CENTER_Y, -RAMP_CENTER_Z],
    size: [3.4, RAMP_THICKNESS, RAMP_LENGTH],
    rotation: [-RAMP_ANGLE, 0, 0],
    color: "#fbbf24",
  },
];

// 4 distinct corner spawns (capsule center = PLAYER_HALF_HEIGHT + PLAYER_RADIUS + 0.05m) facing center
export const ARENA_SPAWN_POINTS: readonly SpawnPoint[] = [
  { position: [-14, PLAYER_SPAWN_Y, -14], yaw: Math.atan2(-14, -14) },
  { position: [14, PLAYER_SPAWN_Y, 14], yaw: Math.atan2(14, 14) },
  { position: [14, PLAYER_SPAWN_Y, -14], yaw: Math.atan2(14, -14) },
  { position: [-14, PLAYER_SPAWN_Y, 14], yaw: Math.atan2(-14, 14) },
];

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Pure TypeScript XYZ Euler-to-quaternion conversion matching Three.js default Euler("XYZ").
 */
export function eulerToQuaternion(rx: number, ry: number, rz: number): Quat {
  const cx = Math.cos(rx * 0.5);
  const sx = Math.sin(rx * 0.5);
  const cy = Math.cos(ry * 0.5);
  const sy = Math.sin(ry * 0.5);
  const cz = Math.cos(rz * 0.5);
  const sz = Math.sin(rz * 0.5);

  return {
    x: sx * cy * cz + cx * sy * sz,
    y: cx * sy * cz - sx * cy * sz,
    z: cx * cy * sz + sx * sy * cz,
    w: cx * cy * cz - sx * sy * sz,
  };
}

export function buildArenaColliders(
  rapier: typeof RAPIER,
  world: World,
): Collider[] {
  const colliders: Collider[] = [];

  for (const block of ARENA_BLOCKS) {
    const [sx, sy, sz] = block.size;
    const [px, py, pz] = block.position;
    const desc = rapier.ColliderDesc.cuboid(sx * 0.5, sy * 0.5, sz * 0.5)
      .setTranslation(px, py, pz)
      .setFriction(0.6)
      .setRestitution(0.2);

    if (block.rotation) {
      const [rx, ry, rz] = block.rotation;
      desc.setRotation(eulerToQuaternion(rx, ry, rz));
    }

    colliders.push(world.createCollider(desc));
  }

  // Index static arena colliders in Rapier's broad-phase immediately
  world.step();

  return colliders;
}
