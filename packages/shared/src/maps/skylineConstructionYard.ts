import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaBlock, BlockMaterialKind } from "../arena";
import type { ArenaMapDefinition } from "./types";

// N/S concrete decks span x in [-3.4, +3.4] at z = +/-11.1, top y = 3.76 (3.4m vertical arch clearance).
// Smooth ~27.9 deg scaffolding ramps span 7.1m along X: [3.4, 10.5] (mid 6.95)
const RAMP_RUN = 7.1;
const RAMP_RISE = 3.76;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.34;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_X = 6.95 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

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

export const SKYLINE_CONSTRUCTION_YARD_MAP: ArenaMapDefinition = {
  id: "skyline_construction_yard",
  name: "Skyline Construction Yard",
  subtitle: "Crisp daytime concrete deck, yellow steel girders & scaffolding ramps",
  halfSize: 18,
  theme: {
    skyTop: "#38bdf8",
    skyBottom: "#f0f9ff",
    fogColor: "#e2f1fb",
    fogNear: 55,
    fogFar: 145,
    fogDensity: 0.0058,
    ambientIntensity: 0.92,
    sunColor: "#fffdf5",
    sunIntensity: 1.9,
    gridColor: "#cbd5e1",
    accentColor: "#eab308",
    sunPosition: [35, 72, 40],
    turbidity: 2.4,
    rayleigh: 0.95,
    mieCoefficient: 0.004,
    hemisphereSky: "#cdeaff",
    hemisphereGround: "#c2ccd6",
    floorMaterial: "concrete",
    decorPreset: "construction",
  },
  blocks: [
    // Crisp bright poured concrete rooftop floor (exact top at y = 0)
    makeBox("scy_floor", "floor", [0, -1.0, 0], [36, 2, 36], "#d4dbe3", "concrete"),

    // Precast concrete rooftop parapet walls (6.6m high)
    makeBox("scy_wall_north", "wall", [0, 3.3, -18.5], [38, 6.6, 1], "#c2cbd4", "concrete"),
    makeBox("scy_wall_south", "wall", [0, 3.3, 18.5], [38, 6.6, 1], "#c2cbd4", "concrete"),
    makeBox("scy_wall_west", "wall", [-18.5, 3.3, 0], [1, 6.6, 36], "#c2cbd4", "concrete"),
    makeBox("scy_wall_east", "wall", [18.5, 3.3, 0], [1, 6.6, 36], "#c2cbd4", "concrete"),

    // Central open-arch elevator portal hub (top y = 3.76, 3.72m wide x 3.4m tall clear archways on all 4 sides)
    makeBox("scy_center_hub", "platform", [0, 3.58, 0], [5.4, 0.36, 5.4], "#c9d2dc", "concrete"),
    makeBox("scy_hub_col_nw", "cover", [-2.2, 1.7, -2.2], [0.68, 3.4, 0.68], "#eab308", "steel"),
    makeBox("scy_hub_col_ne", "cover", [2.2, 1.7, -2.2], [0.68, 3.4, 0.68], "#eab308", "steel"),
    makeBox("scy_hub_col_se", "cover", [2.2, 1.7, 2.2], [0.68, 3.4, 0.68], "#eab308", "steel"),
    makeBox("scy_hub_col_sw", "cover", [-2.2, 1.7, 2.2], [0.68, 3.4, 0.68], "#eab308", "steel"),

    // 4 Yellow painted steel girders radiating from center hub (top y = 3.76, 3.4m vertical clearance beneath)
    makeBox("scy_girder_north", "platform", [0, 3.58, -6.0], [2.6, 0.36, 6.6], "#facc15", "steel"),
    makeBox("scy_girder_south", "platform", [0, 3.58, 6.0], [2.6, 0.36, 6.6], "#facc15", "steel"),
    makeBox("scy_girder_west", "platform", [-6.0, 3.58, 0], [6.6, 0.36, 2.6], "#facc15", "steel"),
    makeBox("scy_girder_east", "platform", [6.0, 3.58, 0], [6.6, 0.36, 2.6], "#facc15", "steel"),

    // North & South concrete slab decks (top y = 3.76, 4.55m x 3.4m clear arch) + ~28 deg ramps
    makeBox("scy_deck_north", "platform", [0, 3.58, -11.1], [6.8, 0.36, 3.6], "#cfd7e0", "concrete"),
    makeBox("scy_deck_north_col_w", "cover", [-2.7, 1.7, -11.1], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox("scy_deck_north_col_e", "cover", [2.7, 1.7, -11.1], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox(
      "scy_ramp_north",
      "ramp",
      [-RAMP_CENTER_X, RAMP_CENTER_Y, -11.1],
      [RAMP_LENGTH, RAMP_THICKNESS, 3.4],
      "#c68b59",
      "timber",
      [0, 0, RAMP_ANGLE],
    ),

    makeBox("scy_deck_south", "platform", [0, 3.58, 11.1], [6.8, 0.36, 3.6], "#cfd7e0", "concrete"),
    makeBox("scy_deck_south_col_w", "cover", [-2.7, 1.7, 11.1], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox("scy_deck_south_col_e", "cover", [2.7, 1.7, 11.1], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox(
      "scy_ramp_south",
      "ramp",
      [RAMP_CENTER_X, RAMP_CENTER_Y, 11.1],
      [RAMP_LENGTH, RAMP_THICKNESS, 3.4],
      "#c68b59",
      "timber",
      [0, 0, -RAMP_ANGLE],
    ),

    // West & East concrete slab decks (top y = 3.76, 4.55m x 3.4m clear arch) + steel columns
    makeBox("scy_deck_west", "platform", [-11.1, 3.58, 0], [3.6, 0.36, 6.8], "#cfd7e0", "concrete"),
    makeBox("scy_deck_west_col_n", "cover", [-11.1, 1.7, -2.7], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox("scy_deck_west_col_s", "cover", [-11.1, 1.7, 2.7], [0.85, 3.4, 0.85], "#eab308", "steel"),

    makeBox("scy_deck_east", "platform", [11.1, 3.58, 0], [3.6, 0.36, 6.8], "#cfd7e0", "concrete"),
    makeBox("scy_deck_east_col_n", "cover", [11.1, 1.7, -2.7], [0.85, 3.4, 0.85], "#eab308", "steel"),
    makeBox("scy_deck_east_col_s", "cover", [11.1, 1.7, 2.7], [0.85, 3.4, 0.85], "#eab308", "steel"),

    // Ground-level 1.1m waist-high concrete barriers & timber supply pallets (clear of barrels at +/-5.0, +/-5.6)
    makeBox("scy_barrier_nw", "cover", [-6.8, 0.55, -6.0], [2.8, 1.1, 1.0], "#bcc6d1", "concrete"),
    makeBox("scy_barrier_ne", "cover", [6.8, 0.55, -6.0], [1.0, 1.1, 2.8], "#bcc6d1", "concrete"),
    makeBox("scy_barrier_se", "cover", [6.8, 0.55, 6.0], [2.8, 1.1, 1.0], "#bcc6d1", "concrete"),
    makeBox("scy_barrier_sw", "cover", [-6.8, 0.55, 6.0], [1.0, 1.1, 2.8], "#bcc6d1", "concrete"),
    makeBox("scy_pallet_ne", "cover", [7.6, 0.55, -11.1], [2.4, 1.1, 1.6], "#be8352", "timber"),
    makeBox("scy_pallet_sw", "cover", [-7.6, 0.55, 11.1], [2.4, 1.1, 1.6], "#be8352", "timber"),
  ],
  spawnPoints: [
    { position: [-15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(-15, -15) },
    { position: [15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(15, 15) },
    { position: [15, PLAYER_SPAWN_Y, -15], yaw: Math.atan2(15, -15) },
    { position: [-15, PLAYER_SPAWN_Y, 15], yaw: Math.atan2(-15, 15) },
  ],
  jumpPads: [
    {
      id: "scy_pad_nw",
      position: [-11.1, 0, -7.6],
      radius: 1.3,
      launchVelocity: [0, 15.6, 4.8],
      color: "#eab308",
    },
    {
      id: "scy_pad_ne",
      position: [11.1, 0, -7.6],
      radius: 1.3,
      launchVelocity: [0, 15.6, 4.8],
      color: "#38bdf8",
    },
    {
      id: "scy_pad_se",
      position: [11.1, 0, 7.6],
      radius: 1.3,
      launchVelocity: [0, 15.6, -4.8],
      color: "#eab308",
    },
    {
      id: "scy_pad_sw",
      position: [-11.1, 0, 7.6],
      radius: 1.3,
      launchVelocity: [0, 15.6, -4.8],
      color: "#38bdf8",
    },
  ],
  kothZones: [
    [0, 3.76, 0],
    [0, 0, -7.2],
    [0, 0, 7.2],
  ],
};
