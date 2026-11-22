import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaBlock, BlockMaterialKind } from "../arena";
import type { ArenaMapDefinition } from "./types";

// Mesas sit at top y = 2.6 (West z in [-8.4, +1.2], East z in [-1.2, +8.4])
// Smooth ~27.95 deg sandstone ramps span 4.9m horizontally: West [1.2, 6.1] (mid 3.65), East [-6.1, -1.2]
const RAMP_RUN = 4.9;
const RAMP_RISE = 2.6;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.38;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_Z = 3.65 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

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

export const DESERT_CANYON_OUTPOST_MAP: ArenaMapDefinition = {
  id: "desert_canyon_outpost",
  name: "Desert Canyon Outpost",
  subtitle: "Golden-hour sandstone mesas, rope-bridge catwalks & bazaar cover",
  halfSize: 18,
  theme: {
    skyTop: "#f59e0b",
    skyBottom: "#fde68a",
    fogColor: "#f6c997",
    fogNear: 48,
    fogFar: 132,
    fogDensity: 0.0092,
    ambientIntensity: 0.85,
    sunColor: "#ffc87c",
    sunIntensity: 2.1,
    gridColor: "#e2a96b",
    accentColor: "#ea580c",
    sunPosition: [-70, 22, -45],
    turbidity: 6.5,
    rayleigh: 2.4,
    mieCoefficient: 0.008,
    hemisphereSky: "#ffd19e",
    hemisphereGround: "#c47344",
    floorMaterial: "sandstone",
    decorPreset: "canyon",
  },
  blocks: [
    // Sun-baked canyon sandstone floor (exact top at y = 0)
    makeBox("dco_floor", "floor", [0, -1.0, 0], [36, 2, 36], "#e2b682", "sandstone"),

    // Warm golden-ochre canyon cliff perimeter walls (6.6m high)
    makeBox("dco_wall_north", "wall", [0, 3.3, -18.5], [38, 6.6, 1], "#d18b58", "sandstone"),
    makeBox("dco_wall_south", "wall", [0, 3.3, 18.5], [38, 6.6, 1], "#d18b58", "sandstone"),
    makeBox("dco_wall_west", "wall", [-18.5, 3.3, 0], [1, 6.6, 36], "#d18b58", "sandstone"),
    makeBox("dco_wall_east", "wall", [18.5, 3.3, 0], [1, 6.6, 36], "#d18b58", "sandstone"),

    // West sandstone mesa plateau (top y = 2.6, clear of teleporters at x = -15.2) + 1.1m parapet + ~28 deg ramp
    makeBox("dco_mesa_west", "platform", [-10.8, 1.3, -3.6], [5.6, 2.6, 9.6], "#d6945e", "sandstone"),
    makeBox("dco_mesa_west_parapet", "cover", [-8.35, 3.15, -5.6], [0.68, 1.1, 3.4], "#c97e49", "terracotta"),
    makeBox(
      "dco_ramp_west",
      "ramp",
      [-10.8, RAMP_CENTER_Y, RAMP_CENTER_Z],
      [3.6, RAMP_THICKNESS, RAMP_LENGTH],
      "#dfb07a",
      "sandstone",
      [RAMP_ANGLE, 0, 0],
    ),

    // East sandstone mesa plateau (top y = 2.6, clear of teleporters at x = +15.2) + 1.1m parapet + ~28 deg ramp
    makeBox("dco_mesa_east", "platform", [10.8, 1.3, 3.6], [5.6, 2.6, 9.6], "#d6945e", "sandstone"),
    makeBox("dco_mesa_east_parapet", "cover", [8.35, 3.15, 5.6], [0.68, 1.1, 3.4], "#c97e49", "terracotta"),
    makeBox(
      "dco_ramp_east",
      "ramp",
      [10.8, RAMP_CENTER_Y, -RAMP_CENTER_Z],
      [3.6, RAMP_THICKNESS, RAMP_LENGTH],
      "#dfb07a",
      "sandstone",
      [-RAMP_ANGLE, 0, 0],
    ),

    // Central 3.4m wide timber rope-bridge catwalk spanning between mesas (8.0m wide arch between piers)
    makeBox("dco_catwalk_main", "platform", [0, 2.45, 0], [16.2, 0.3, 3.4], "#ad7246", "timber"),
    makeBox("dco_bridge_pier_w", "cover", [-4.6, 1.15, 0], [1.2, 2.3, 2.2], "#d4915b", "sandstone"),
    makeBox("dco_bridge_pier_e", "cover", [4.6, 1.15, 0], [1.2, 2.3, 2.2], "#d4915b", "sandstone"),

    // Shaded NE & SW 1.1m waist-high bazaar stall & supply crate cover clusters
    makeBox("dco_market_ne_base", "cover", [4.6, 0.55, -8.8], [2.8, 1.1, 1.6], "#b87a4a", "timber"),
    makeBox("dco_market_ne_crate", "cover", [7.6, 0.55, -10.8], [1.6, 1.1, 1.6], "#d16b41", "terracotta"),
    makeBox("dco_market_sw_base", "cover", [-4.6, 0.55, 8.8], [2.8, 1.1, 1.6], "#b87a4a", "timber"),
    makeBox("dco_market_sw_crate", "cover", [-7.6, 0.55, 10.8], [1.6, 1.1, 1.6], "#d16b41", "terracotta"),

    // Canyon floor rock outcrops (full cover) & 1.1m waist-high timber supply crates along N/S approaches
    makeBox("dco_rock_north", "cover", [-1.8, 1.05, -11.6], [3.4, 2.1, 1.3], "#cf8c59", "sandstone"),
    makeBox("dco_rock_south", "cover", [1.8, 1.05, 11.6], [3.4, 2.1, 1.3], "#cf8c59", "sandstone"),
    makeBox("dco_crate_center_n", "cover", [0, 0.55, -4.6], [2.4, 1.1, 1.1], "#b37546", "timber"),
    makeBox("dco_crate_center_s", "cover", [0, 0.55, 4.6], [2.4, 1.1, 1.1], "#b37546", "timber"),
  ],
  spawnPoints: [
    { position: [-15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(-15, -15) },
    { position: [15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(15, 15) },
    { position: [15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(15, -15) },
    { position: [-15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(-15, 15) },
  ],
  jumpPads: [
    {
      id: "dco_pad_canyon_ne",
      position: [10.8, 0, -9.8],
      radius: 1.35,
      launchVelocity: [0, 14.0, 5.2],
      color: "#f97316",
    },
    {
      id: "dco_pad_canyon_sw",
      position: [-10.8, 0, 9.8],
      radius: 1.35,
      launchVelocity: [0, 14.0, -5.2],
      color: "#f59e0b",
    },
  ],
  kothZones: [
    [0, 0, 0],
    [0, 2.6, 0],
    [-10.8, 2.6, -3.6],
    [10.8, 2.6, 3.6],
  ],
};
