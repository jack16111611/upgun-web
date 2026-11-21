import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, World } from "@dimforge/rapier3d-compat";
import { eulerToQuaternion } from "../arena";
import { PLAYER_CAPSULE_CENTER_Y } from "../constants";
import { ALPINE_SKY_TEMPLE_MAP } from "./alpineSkyTemple";
import { DESERT_CANYON_OUTPOST_MAP } from "./desertCanyonOutpost";
import { SKYLINE_CONSTRUCTION_YARD_MAP } from "./skylineConstructionYard";
import { SUNLIT_COURTYARD_MAP } from "./sunlitCourtyard";
import type { ArenaMapDefinition, JumpPadDefinition } from "./types";

export { ALPINE_SKY_TEMPLE_MAP } from "./alpineSkyTemple";
export { DESERT_CANYON_OUTPOST_MAP } from "./desertCanyonOutpost";
export { SKYLINE_CONSTRUCTION_YARD_MAP } from "./skylineConstructionYard";
export { SUNLIT_COURTYARD_MAP } from "./sunlitCourtyard";

// Backwards-compatible aliases so existing imports compile cleanly
export const NEON_FOUNDRY_MAP = SUNLIT_COURTYARD_MAP;
export const SKYLINE_ROOFTOPS_MAP = ALPINE_SKY_TEMPLE_MAP;
export const CYBER_COLOSSEUM_MAP = DESERT_CANYON_OUTPOST_MAP;

export {
  DEFAULT_BODY_COLOR,
  DEFAULT_HAT_ID,
  HAT_IDS,
  ROBOT_BODY_COLORS,
  sanitizeBodyColor,
  sanitizeHatId,
  type ArenaBlock,
  type ArenaBlockKind,
  type ArenaDecorPreset,
  type ArenaMapDefinition,
  type ArenaTheme,
  type BlockMaterialKind,
  type HatId,
  type JumpPadDefinition,
  type RobotBodyColorOption,
  type SpawnPoint,
} from "./types";

export const ARENA_MAPS: readonly ArenaMapDefinition[] = [
  SUNLIT_COURTYARD_MAP,
  ALPINE_SKY_TEMPLE_MAP,
  DESERT_CANYON_OUTPOST_MAP,
  SKYLINE_CONSTRUCTION_YARD_MAP,
] as const;

const LEGACY_MAP_ID_ALIASES: Readonly<Record<string, ArenaMapDefinition>> = {
  neon_foundry: SUNLIT_COURTYARD_MAP,
  skyline_rooftops: ALPINE_SKY_TEMPLE_MAP,
  cyber_colosseum: DESERT_CANYON_OUTPOST_MAP,
};

export function getArenaMap(id: string): ArenaMapDefinition {
  for (const map of ARENA_MAPS) {
    if (map.id === id) {
      return map;
    }
  }
  return LEGACY_MAP_ID_ALIASES[id] ?? SUNLIT_COURTYARD_MAP;
}

export function getNextArenaMapId(currentId: string): string {
  const resolved = getArenaMap(currentId);
  const index = ARENA_MAPS.findIndex((map) => map.id === resolved.id);
  if (index === -1) {
    return SUNLIT_COURTYARD_MAP.id;
  }
  const next = ARENA_MAPS[(index + 1) % ARENA_MAPS.length];
  return next ? next.id : SUNLIT_COURTYARD_MAP.id;
}

export function buildMapColliders(
  rapier: typeof RAPIER,
  world: World,
  map: ArenaMapDefinition,
): Collider[] {
  const colliders: Collider[] = [];

  for (const block of map.blocks) {
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

  // Index static map colliders in Rapier's broad-phase immediately
  world.step();

  return colliders;
}

const JUMP_PAD_MIN_FEET_DY = -0.45;
const JUMP_PAD_MAX_FEET_DY = 0.85;

/**
 * Checks whether a player whose capsule center is at (x, y, z) is touching
 * any jump pad in the provided arena map.
 */
export function checkJumpPadTrigger(
  map: ArenaMapDefinition,
  x: number,
  y: number,
  z: number,
): JumpPadDefinition | null {
  const feetY = y - PLAYER_CAPSULE_CENTER_Y;

  for (const pad of map.jumpPads) {
    const [px, py, pz] = pad.position;
    const dy = feetY - py;
    if (dy < JUMP_PAD_MIN_FEET_DY || dy > JUMP_PAD_MAX_FEET_DY) {
      continue;
    }

    const dx = x - px;
    const dz = z - pz;
    if (dx * dx + dz * dz <= pad.radius * pad.radius) {
      return pad;
    }
  }

  return null;
}
