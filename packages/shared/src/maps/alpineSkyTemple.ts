import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaBlock, BlockMaterialKind } from "../arena";
import type { ArenaMapDefinition } from "./types";

const RAMP_T = 0.34;
const TERRACE_RUN = 3.8;
const TERRACE_RISE = 1.3;
const TERRACE_ANGLE = Math.atan2(TERRACE_RISE, TERRACE_RUN);
const TERRACE_LEN = Math.hypot(TERRACE_RUN, TERRACE_RISE);
const TERRACE_Y = TERRACE_RISE / 2 - (RAMP_T / 2) * Math.cos(TERRACE_ANGLE);
const TERRACE_Z = 6.9 - (RAMP_T / 2) * Math.sin(TERRACE_ANGLE);

const WALK_RUN = 6.6;
const WALK_RISE = 2.6;
const WALK_ANGLE = Math.atan2(WALK_RISE, WALK_RUN);
const WALK_LEN = Math.hypot(WALK_RUN, WALK_RISE);
const WALK_Y = WALK_RISE / 2 - (RAMP_T / 2) * Math.cos(WALK_ANGLE);
const WALK_X = 9.8 - (RAMP_T / 2) * Math.sin(WALK_ANGLE);

function makeBox(
  id: string,
  kind: ArenaBlock["kind"],
  position: [number, number, number],
  size: [number, number, number],
  color: string,
  material: BlockMaterialKind,
  rotation?: [number, number, number],
): ArenaBlock {
  return rotation
    ? { id, kind, position, size, color, material, rotation }
    : { id, kind, position, size, color, material };
}

export const ALPINE_SKY_TEMPLE_MAP: ArenaMapDefinition = {
  id: "alpine_sky_temple",
  name: "Alpine Sky Temple",
  subtitle: "High-altitude marble sanctuary, lush grass terraces & wind-stream pads",
  halfSize: 18,
  theme: {
    skyTop: "#3b82f6",
    skyBottom: "#e0f2fe",
    fogColor: "#dff1fc",
    fogNear: 56,
    fogFar: 148,
    ambientIntensity: 1.0,
    sunColor: "#fffaf0",
    sunIntensity: 1.9,
    gridColor: "#cbd5e1",
    accentColor: "#0ea5e9",
    sunPosition: [55, 58, -32],
    turbidity: 2.0,
    rayleigh: 0.85,
    mieCoefficient: 0.003,
    hemisphereSky: "#cde8ff",
    hemisphereGround: "#9ac28e",
    floorMaterial: "marble",
    decorPreset: "temple",
  },
  blocks: [
    // Polished sunlit marble monastery floor (exact top at y = 0)
    makeBox("ast_floor", "floor", [0, -1.0, 0], [36, 2, 36], "#efede6", "marble"),

    // White marble monastery perimeter walls (6.6m high)
    makeBox("ast_wall_north", "wall", [0, 3.3, -18.5], [38, 6.6, 1], "#e6e3d8", "marble"),
    makeBox("ast_wall_south", "wall", [0, 3.3, 18.5], [38, 6.6, 1], "#e6e3d8", "marble"),
    makeBox("ast_wall_west", "wall", [-18.5, 3.3, 0], [1, 6.6, 36], "#e6e3d8", "marble"),
    makeBox("ast_wall_east", "wall", [18.5, 3.3, 0], [1, 6.6, 36], "#e6e3d8", "marble"),

    // Central Pagoda Pavilion (marble dais + 4 cedar pillars + terracotta upper roof at y = 3.2)
    makeBox("ast_pagoda_dais", "platform", [0, 0.25, 0], [6.4, 0.5, 6.4], "#f3f1ea", "marble"),
    makeBox("ast_pagoda_pillar_nw", "cover", [-2.1, 1.65, -2.1], [0.65, 2.3, 0.65], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_ne", "cover", [2.1, 1.65, -2.1], [0.65, 2.3, 0.65], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_se", "cover", [2.1, 1.65, 2.1], [0.65, 2.3, 0.65], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_sw", "cover", [-2.1, 1.65, 2.1], [0.65, 2.3, 0.65], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_roof", "platform", [0, 3.0, 0], [5.8, 0.4, 5.8], "#cf5136", "terracotta"),

    // West & East lush alpine grass terraces (top y = 1.3) with twin timber ramps
    makeBox("ast_terrace_west", "platform", [-12.2, 0.65, 0], [4.8, 1.3, 10.0], "#63ab4a", "grass"),
    makeBox(
      "ast_terrace_west_ramp_n",
      "ramp",
      [-12.2, TERRACE_Y, -TERRACE_Z],
      [3.2, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [-TERRACE_ANGLE, 0, 0],
    ),
    makeBox(
      "ast_terrace_west_ramp_s",
      "ramp",
      [-12.2, TERRACE_Y, TERRACE_Z],
      [3.2, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [TERRACE_ANGLE, 0, 0],
    ),
    makeBox("ast_terrace_east", "platform", [12.2, 0.65, 0], [4.8, 1.3, 10.0], "#63ab4a", "grass"),
    makeBox(
      "ast_terrace_east_ramp_n",
      "ramp",
      [12.2, TERRACE_Y, -TERRACE_Z],
      [3.2, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [-TERRACE_ANGLE, 0, 0],
    ),
    makeBox(
      "ast_terrace_east_ramp_s",
      "ramp",
      [12.2, TERRACE_Y, TERRACE_Z],
      [3.2, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [TERRACE_ANGLE, 0, 0],
    ),

    // North & South elevated wooden monastery walkways (top y = 2.6) + opposite-side ramps
    makeBox("ast_walkway_north", "platform", [0, 2.4, -12.0], [13.0, 0.4, 3.6], "#b37345", "timber"),
    makeBox("ast_walkway_north_pillar_w", "cover", [-5.2, 1.1, -12.0], [1.2, 2.2, 1.2], "#eae7dc", "marble"),
    makeBox("ast_walkway_north_pillar_e", "cover", [5.2, 1.1, -12.0], [1.2, 2.2, 1.2], "#eae7dc", "marble"),
    makeBox(
      "ast_walkway_north_ramp",
      "ramp",
      [WALK_X, WALK_Y, -12.0],
      [WALK_LEN, RAMP_T, 3.0],
      "#c48453",
      "timber",
      [0, 0, -WALK_ANGLE],
    ),

    makeBox("ast_walkway_south", "platform", [0, 2.4, 12.0], [13.0, 0.4, 3.6], "#b37345", "timber"),
    makeBox("ast_walkway_south_pillar_w", "cover", [-5.2, 1.1, 12.0], [1.2, 2.2, 1.2], "#eae7dc", "marble"),
    makeBox("ast_walkway_south_pillar_e", "cover", [5.2, 1.1, 12.0], [1.2, 2.2, 1.2], "#eae7dc", "marble"),
    makeBox(
      "ast_walkway_south_ramp",
      "ramp",
      [-WALK_X, WALK_Y, 12.0],
      [WALK_LEN, RAMP_T, 3.0],
      "#c48453",
      "timber",
      [0, 0, WALK_ANGLE],
    ),

    // Mid-courtyard marble shrine screens & lush garden hedges
    makeBox("ast_shrine_nw", "cover", [-5.6, 0.95, -5.6], [2.2, 1.9, 1.1], "#ece9de", "marble"),
    makeBox("ast_shrine_ne", "cover", [5.6, 0.95, -5.6], [2.2, 1.9, 1.1], "#ece9de", "marble"),
    makeBox("ast_shrine_se", "cover", [5.6, 0.95, 5.6], [2.2, 1.9, 1.1], "#ece9de", "marble"),
    makeBox("ast_shrine_sw", "cover", [-5.6, 0.95, 5.6], [2.2, 1.9, 1.1], "#ece9de", "marble"),
    makeBox("ast_hedge_west", "cover", [-12.2, 2.0, 0], [1.5, 1.4, 3.2], "#4ea345", "foliage"),
    makeBox("ast_hedge_east", "cover", [12.2, 2.0, 0], [1.5, 1.4, 3.2], "#4ea345", "foliage"),
  ],
  spawnPoints: [
    { position: [-15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(-15, -15) },
    { position: [15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(15, 15) },
    { position: [15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(15, -15) },
    { position: [-15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(-15, 15) },
  ],
  jumpPads: [
    {
      id: "ast_pad_wind_nw",
      position: [-8.2, 0, -7.8],
      radius: 1.3,
      launchVelocity: [4.8, 14.5, 4.6],
      color: "#38bdf8",
    },
    {
      id: "ast_pad_wind_ne",
      position: [8.2, 0, -7.8],
      radius: 1.3,
      launchVelocity: [-4.8, 14.5, 4.6],
      color: "#2dd4bf",
    },
    {
      id: "ast_pad_wind_se",
      position: [8.2, 0, 7.8],
      radius: 1.3,
      launchVelocity: [-4.8, 14.5, -4.6],
      color: "#38bdf8",
    },
    {
      id: "ast_pad_wind_sw",
      position: [-8.2, 0, 7.8],
      radius: 1.3,
      launchVelocity: [4.8, 14.5, -4.6],
      color: "#2dd4bf",
    },
  ],
  kothZones: [
    [0, 0.5, 0],
    [0, 3.2, 0],
    [-12.2, 1.3, 0],
    [12.2, 1.3, 0],
  ],
};
