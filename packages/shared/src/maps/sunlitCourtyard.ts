import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaBlock, BlockMaterialKind } from "../arena";
import type { ArenaMapDefinition } from "./types";

// Arcades end at z = +/-5.8 (top y = 2.8); ramps span 5.3m (~27.85 deg) to z = +/-11.1 (mid 8.45)
const RAMP_RUN = 5.3;
const RAMP_RISE = 2.8;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.36;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_Z = 8.45 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

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

export const SUNLIT_COURTYARD_MAP: ArenaMapDefinition = {
  id: "sunlit_courtyard",
  name: "Sunlit Courtyard",
  subtitle: "Mediterranean cobblestone plaza, sandstone arches & terracotta ledges",
  halfSize: 18,
  theme: {
    skyTop: "#4ea8de",
    skyBottom: "#e8f4fc",
    fogColor: "#dcebf5",
    fogNear: 52,
    fogFar: 138,
    fogDensity: 0.0072,
    ambientIntensity: 0.88,
    sunColor: "#fff1d0",
    sunIntensity: 1.95,
    gridColor: "#e6ccb2",
    accentColor: "#e07a5f",
    sunPosition: [42, 65, 28],
    turbidity: 3.0,
    rayleigh: 1.05,
    mieCoefficient: 0.004,
    hemisphereSky: "#a8dcff",
    hemisphereGround: "#d8b48a",
    floorMaterial: "cobblestone",
    decorPreset: "courtyard",
  },
  blocks: [
    // Solid cobblestone plaza floor (36m x 36m, exact top at y = 0)
    makeBox("sc_floor", "floor", [0, -1.0, 0], [36, 2, 36], "#ded6c8", "cobblestone"),

    // Warm sandstone perimeter walls (6.6m high to contain jump-pad arcs)
    makeBox("sc_wall_north", "wall", [0, 3.3, -18.5], [38, 6.6, 1], "#e6d2b0", "sandstone"),
    makeBox("sc_wall_south", "wall", [0, 3.3, 18.5], [38, 6.6, 1], "#e6d2b0", "sandstone"),
    makeBox("sc_wall_west", "wall", [-18.5, 3.3, 0], [1, 6.6, 36], "#e6d2b0", "sandstone"),
    makeBox("sc_wall_east", "wall", [18.5, 3.3, 0], [1, 6.6, 36], "#e6d2b0", "sandstone"),

    // Central Mediterranean Fountain (0.32m autostep basin + 1.1m marble plinth)
    makeBox("sc_fountain_basin", "platform", [0, 0.16, 0], [6.4, 0.32, 6.4], "#dcd4c4", "cobblestone"),
    makeBox("sc_fountain_plinth", "platform", [0, 0.87, 0], [2.0, 1.1, 2.0], "#f2efe6", "marble"),

    // North & South 1.1m waist-high sandstone cover parapets framing the fountain plaza
    makeBox("sc_cover_north", "cover", [0, 0.55, -7.8], [4.6, 1.1, 0.9], "#e2c89f", "sandstone"),
    makeBox("sc_cover_south", "cover", [0, 0.55, 7.8], [4.6, 1.1, 0.9], "#e2c89f", "sandstone"),

    // Four diagonal 1.1m waist-high planters + trimmed cypress hedges (clear of barrels at +/-5.5)
    makeBox("sc_planter_nw", "cover", [-4.0, 0.55, -6.6], [1.8, 1.1, 1.4], "#dfb98a", "sandstone"),
    makeBox("sc_hedge_nw", "cover", [-7.0, 0.55, -3.6], [1.5, 1.1, 1.5], "#52a648", "foliage"),
    makeBox("sc_planter_ne", "cover", [4.0, 0.55, -6.6], [1.8, 1.1, 1.4], "#dfb98a", "sandstone"),
    makeBox("sc_hedge_ne", "cover", [7.0, 0.55, -3.6], [1.5, 1.1, 1.5], "#52a648", "foliage"),
    makeBox("sc_planter_se", "cover", [4.0, 0.55, 6.6], [1.8, 1.1, 1.4], "#dfb98a", "sandstone"),
    makeBox("sc_hedge_se", "cover", [7.0, 0.55, 3.6], [1.5, 1.1, 1.5], "#52a648", "foliage"),
    makeBox("sc_planter_sw", "cover", [-4.0, 0.55, 6.6], [1.8, 1.1, 1.4], "#dfb98a", "sandstone"),
    makeBox("sc_hedge_sw", "cover", [-7.0, 0.55, 3.6], [1.5, 1.1, 1.5], "#52a648", "foliage"),

    // West terracotta roof arcade (top y = 2.8) + 4.05m clear arch columns + ~28 deg South ramp
    makeBox("sc_ledge_west", "platform", [-11.2, 2.62, 0], [4.6, 0.36, 11.6], "#dc6d45", "terracotta"),
    makeBox("sc_col_west_n", "cover", [-11.2, 1.22, -5.0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox("sc_col_west_mid", "cover", [-11.2, 1.22, 0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox("sc_col_west_s", "cover", [-11.2, 1.22, 5.0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox(
      "sc_ramp_west",
      "ramp",
      [-11.2, RAMP_CENTER_Y, RAMP_CENTER_Z],
      [3.6, RAMP_THICKNESS, RAMP_LENGTH],
      "#b87c4f",
      "timber",
      [RAMP_ANGLE, 0, 0],
    ),

    // East terracotta roof arcade (top y = 2.8) + 4.05m clear arch columns + ~28 deg North ramp
    makeBox("sc_ledge_east", "platform", [11.2, 2.62, 0], [4.6, 0.36, 11.6], "#dc6d45", "terracotta"),
    makeBox("sc_col_east_n", "cover", [11.2, 1.22, -5.0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox("sc_col_east_mid", "cover", [11.2, 1.22, 0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox("sc_col_east_s", "cover", [11.2, 1.22, 5.0], [0.95, 2.44, 0.95], "#e6cda4", "sandstone"),
    makeBox(
      "sc_ramp_east",
      "ramp",
      [11.2, RAMP_CENTER_Y, -RAMP_CENTER_Z],
      [3.6, RAMP_THICKNESS, RAMP_LENGTH],
      "#b87c4f",
      "timber",
      [-RAMP_ANGLE, 0, 0],
    ),

    // North & South wooden pergola balcony bridges (top y = 3.76, 3.44m vertical x 8.7m wide arch)
    makeBox("sc_bridge_north", "platform", [0, 3.6, -12.0], [11.2, 0.32, 3.0], "#b67b4d", "timber"),
    makeBox("sc_bridge_north_pier_w", "cover", [-4.9, 1.72, -12.0], [1.1, 3.44, 2.4], "#e4c99e", "sandstone"),
    makeBox("sc_bridge_north_pier_e", "cover", [4.9, 1.72, -12.0], [1.1, 3.44, 2.4], "#e4c99e", "sandstone"),
    makeBox("sc_bridge_south", "platform", [0, 3.6, 12.0], [11.2, 0.32, 3.0], "#b67b4d", "timber"),
    makeBox("sc_bridge_south_pier_w", "cover", [-4.9, 1.72, 12.0], [1.1, 3.44, 2.4], "#e4c99e", "sandstone"),
    makeBox("sc_bridge_south_pier_e", "cover", [4.9, 1.72, 12.0], [1.1, 3.44, 2.4], "#e4c99e", "sandstone"),
  ],
  spawnPoints: [
    { position: [-15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(-15, -15) },
    { position: [15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(15, 15) },
    { position: [15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(15, -15) },
    { position: [-15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(-15, 15) },
  ],
  jumpPads: [
    {
      id: "sc_pad_west_arcade",
      position: [-11.2, 0, -9.2],
      radius: 1.35,
      launchVelocity: [0, 14.0, 5.4],
      color: "#38bdf8",
    },
    {
      id: "sc_pad_east_arcade",
      position: [11.2, 0, 9.2],
      radius: 1.35,
      launchVelocity: [0, 14.0, -5.4],
      color: "#f59e0b",
    },
  ],
  kothZones: [
    [0, 0.32, 0],
    [-11.2, 2.8, 0],
    [11.2, 2.8, 0],
  ],
};
