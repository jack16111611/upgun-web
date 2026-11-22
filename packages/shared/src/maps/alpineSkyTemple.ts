import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaBlock, BlockMaterialKind } from "../arena";
import type { ArenaMapDefinition } from "./types";

const RAMP_T = 0.34;
// Terraces top y = 1.4, z ends at +/-4.4 -> ~27.85 deg ramp spans 2.65m to +/-7.05 (mid 5.725)
const TERRACE_RUN = 2.65;
const TERRACE_RISE = 1.4;
const TERRACE_ANGLE = Math.atan2(TERRACE_RISE, TERRACE_RUN);
const TERRACE_LEN = Math.hypot(TERRACE_RUN, TERRACE_RISE);
const TERRACE_Y = TERRACE_RISE / 2 - (RAMP_T / 2) * Math.cos(TERRACE_ANGLE);
const TERRACE_Z = 5.725 - (RAMP_T / 2) * Math.sin(TERRACE_ANGLE);

// Walkways top y = 3.76 (3.44m clear arch under), x ends at +/-5.5 -> ~27.9 deg ramp spans 7.1m to +/-12.6 (mid 9.05)
const WALK_RUN = 7.1;
const WALK_RISE = 3.76;
const WALK_ANGLE = Math.atan2(WALK_RISE, WALK_RUN);
const WALK_LEN = Math.hypot(WALK_RUN, WALK_RISE);
const WALK_Y = WALK_RISE / 2 - (RAMP_T / 2) * Math.cos(WALK_ANGLE);
const WALK_X = 9.05 - (RAMP_T / 2) * Math.sin(WALK_ANGLE);

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
    fogDensity: 0.0064,
    ambientIntensity: 0.9,
    sunColor: "#fff8eb",
    sunIntensity: 1.95,
    gridColor: "#cbd5e1",
    accentColor: "#0ea5e9",
    sunPosition: [55, 58, -32],
    turbidity: 2.0,
    rayleigh: 0.85,
    mieCoefficient: 0.003,
    hemisphereSky: "#bfe4ff",
    hemisphereGround: "#93bd88",
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

    // Central Pagoda Pavilion (0.32m autostep dais + 4 cedar pillars w/ 4.62m x 3.4m arch clearance + roof top 4.08m)
    makeBox("ast_pagoda_dais", "platform", [0, 0.16, 0], [6.8, 0.32, 6.8], "#f3f1ea", "marble"),
    makeBox("ast_pagoda_pillar_nw", "cover", [-2.6, 2.02, -2.6], [0.58, 3.4, 0.58], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_ne", "cover", [2.6, 2.02, -2.6], [0.58, 3.4, 0.58], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_se", "cover", [2.6, 2.02, 2.6], [0.58, 3.4, 0.58], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_pillar_sw", "cover", [-2.6, 2.02, 2.6], [0.58, 3.4, 0.58], "#9e5c3b", "timber"),
    makeBox("ast_pagoda_roof", "platform", [0, 3.9, 0], [6.2, 0.36, 6.2], "#cf5136", "terracotta"),

    // West & East alpine grass terraces (top y = 1.4, clear of barrels at +/-7.2 and teleporters at +/-14.5)
    makeBox("ast_terrace_west", "platform", [-10.6, 0.7, 0], [4.2, 1.4, 8.8], "#63ab4a", "grass"),
    makeBox(
      "ast_terrace_west_ramp_n",
      "ramp",
      [-10.6, TERRACE_Y, -TERRACE_Z],
      [3.4, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [-TERRACE_ANGLE, 0, 0],
    ),
    makeBox(
      "ast_terrace_west_ramp_s",
      "ramp",
      [-10.6, TERRACE_Y, TERRACE_Z],
      [3.4, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [TERRACE_ANGLE, 0, 0],
    ),
    makeBox("ast_terrace_east", "platform", [10.6, 0.7, 0], [4.2, 1.4, 8.8], "#63ab4a", "grass"),
    makeBox(
      "ast_terrace_east_ramp_n",
      "ramp",
      [10.6, TERRACE_Y, -TERRACE_Z],
      [3.4, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [-TERRACE_ANGLE, 0, 0],
    ),
    makeBox(
      "ast_terrace_east_ramp_s",
      "ramp",
      [10.6, TERRACE_Y, TERRACE_Z],
      [3.4, RAMP_T, TERRACE_LEN],
      "#b87c4f",
      "timber",
      [TERRACE_ANGLE, 0, 0],
    ),

    // North & South elevated monastery walkways (top y = 3.76, 3.44m x 8.2m clear arch) + ~28 deg ramps
    makeBox("ast_walkway_north", "platform", [0, 3.6, -11.2], [11.0, 0.32, 3.2], "#b37345", "timber"),
    makeBox("ast_walkway_north_pillar_w", "cover", [-4.6, 1.72, -11.2], [1.0, 3.44, 1.4], "#eae7dc", "marble"),
    makeBox("ast_walkway_north_pillar_e", "cover", [4.6, 1.72, -11.2], [1.0, 3.44, 1.4], "#eae7dc", "marble"),
    makeBox(
      "ast_walkway_north_ramp",
      "ramp",
      [WALK_X, WALK_Y, -11.2],
      [WALK_LEN, RAMP_T, 3.4],
      "#c48453",
      "timber",
      [0, 0, -WALK_ANGLE],
    ),

    makeBox("ast_walkway_south", "platform", [0, 3.6, 11.2], [11.0, 0.32, 3.2], "#b37345", "timber"),
    makeBox("ast_walkway_south_pillar_w", "cover", [-4.6, 1.72, 11.2], [1.0, 3.44, 1.4], "#eae7dc", "marble"),
    makeBox("ast_walkway_south_pillar_e", "cover", [4.6, 1.72, 11.2], [1.0, 3.44, 1.4], "#eae7dc", "marble"),
    makeBox(
      "ast_walkway_south_ramp",
      "ramp",
      [-WALK_X, WALK_Y, 11.2],
      [WALK_LEN, RAMP_T, 3.4],
      "#c48453",
      "timber",
      [0, 0, WALK_ANGLE],
    ),

    // Mid-courtyard 1.1m waist-high marble shrine screens & trimmed terrace hedges
    makeBox("ast_shrine_nw", "cover", [-5.2, 0.55, -5.2], [2.2, 1.1, 0.85], "#ece9de", "marble"),
    makeBox("ast_shrine_ne", "cover", [5.2, 0.55, -5.2], [2.2, 1.1, 0.85], "#ece9de", "marble"),
    makeBox("ast_shrine_se", "cover", [5.2, 0.55, 5.2], [2.2, 1.1, 0.85], "#ece9de", "marble"),
    makeBox("ast_shrine_sw", "cover", [-5.2, 0.55, 5.2], [2.2, 1.1, 0.85], "#ece9de", "marble"),
    makeBox("ast_hedge_west", "cover", [-10.6, 1.95, 0], [1.1, 1.1, 3.0], "#4ea345", "foliage"),
    makeBox("ast_hedge_east", "cover", [10.6, 1.95, 0], [1.1, 1.1, 3.0], "#4ea345", "foliage"),
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
      position: [-7.8, 0, -7.6],
      radius: 1.3,
      launchVelocity: [4.4, 15.6, 4.3],
      color: "#38bdf8",
    },
    {
      id: "ast_pad_wind_ne",
      position: [7.8, 0, -7.6],
      radius: 1.3,
      launchVelocity: [-4.4, 15.6, 4.3],
      color: "#2dd4bf",
    },
    {
      id: "ast_pad_wind_se",
      position: [7.8, 0, 7.6],
      radius: 1.3,
      launchVelocity: [-4.4, 15.6, -4.3],
      color: "#38bdf8",
    },
    {
      id: "ast_pad_wind_sw",
      position: [-7.8, 0, 7.6],
      radius: 1.3,
      launchVelocity: [4.4, 15.6, -4.3],
      color: "#2dd4bf",
    },
  ],
  kothZones: [
    [0, 0.32, 0],
    [0, 4.08, 0],
    [-10.6, 1.4, 0],
    [10.6, 1.4, 0],
  ],
};
