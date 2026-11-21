import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaMapDefinition } from "./types";

// N/S concrete decks span x in [-3.4, +3.4] at z = +/-11.4, top y = 2.8.
// Scaffolding ramps span 6.6m horizontally along X: [3.4, 10.0] (mid 6.7)
const RAMP_RUN = 6.6;
const RAMP_RISE = 2.8;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.34;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_X = 6.7 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

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
    ambientIntensity: 0.98,
    sunColor: "#ffffff",
    sunIntensity: 1.85,
    gridColor: "#cbd5e1",
    accentColor: "#eab308",
    sunPosition: [35, 72, 40],
    turbidity: 2.4,
    rayleigh: 0.95,
    mieCoefficient: 0.004,
    hemisphereSky: "#d4efff",
    hemisphereGround: "#cbd5e1",
    floorMaterial: "concrete",
    decorPreset: "construction",
  },
  blocks: [
    // Crisp bright poured concrete rooftop floor (exact top at y = 0)
    {
      id: "scy_floor",
      kind: "floor",
      position: [0, -1.0, 0],
      size: [36, 2, 36],
      color: "#d4dbe3",
      material: "concrete",
    },

    // Precast concrete rooftop parapet walls (6.4m high)
    {
      id: "scy_wall_north",
      kind: "wall",
      position: [0, 3.2, -18.5],
      size: [38, 6.4, 1],
      color: "#c2cbd4",
      material: "concrete",
    },
    {
      id: "scy_wall_south",
      kind: "wall",
      position: [0, 3.2, 18.5],
      size: [38, 6.4, 1],
      color: "#c2cbd4",
      material: "concrete",
    },
    {
      id: "scy_wall_west",
      kind: "wall",
      position: [-18.5, 3.2, 0],
      size: [1, 6.4, 36],
      color: "#c2cbd4",
      material: "concrete",
    },
    {
      id: "scy_wall_east",
      kind: "wall",
      position: [18.5, 3.2, 0],
      size: [1, 6.4, 36],
      color: "#c2cbd4",
      material: "concrete",
    },

    // Central concrete elevator core hub (top y = 2.8)
    {
      id: "scy_center_hub",
      kind: "platform",
      position: [0, 1.4, 0],
      size: [4.6, 2.8, 4.6],
      color: "#c9d2dc",
      material: "concrete",
    },

    // 4 Yellow painted steel girders radiating from center hub to cardinal concrete decks (top y = 2.8)
    {
      id: "scy_girder_north",
      kind: "platform",
      position: [0, 2.6, -5.9],
      size: [2.6, 0.4, 7.4],
      color: "#facc15",
      material: "steel",
    },
    {
      id: "scy_girder_south",
      kind: "platform",
      position: [0, 2.6, 5.9],
      size: [2.6, 0.4, 7.4],
      color: "#facc15",
      material: "steel",
    },
    {
      id: "scy_girder_west",
      kind: "platform",
      position: [-5.9, 2.6, 0],
      size: [7.4, 0.4, 2.6],
      color: "#facc15",
      material: "steel",
    },
    {
      id: "scy_girder_east",
      kind: "platform",
      position: [5.9, 2.6, 0],
      size: [7.4, 0.4, 2.6],
      color: "#facc15",
      material: "steel",
    },

    // North & South concrete slab decks (top y = 2.8) + columns + scaffolding ramps
    {
      id: "scy_deck_north",
      kind: "platform",
      position: [0, 2.6, -11.4],
      size: [6.8, 0.4, 3.8],
      color: "#cfd7e0",
      material: "concrete",
    },
    {
      id: "scy_deck_north_col_w",
      kind: "cover",
      position: [-2.6, 1.2, -11.4],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_deck_north_col_e",
      kind: "cover",
      position: [2.6, 1.2, -11.4],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_ramp_north",
      kind: "ramp",
      position: [-RAMP_CENTER_X, RAMP_CENTER_Y, -11.4],
      size: [RAMP_LENGTH, RAMP_THICKNESS, 3.0],
      rotation: [0, 0, RAMP_ANGLE],
      color: "#c68b59",
      material: "timber",
    },

    {
      id: "scy_deck_south",
      kind: "platform",
      position: [0, 2.6, 11.4],
      size: [6.8, 0.4, 3.8],
      color: "#cfd7e0",
      material: "concrete",
    },
    {
      id: "scy_deck_south_col_w",
      kind: "cover",
      position: [-2.6, 1.2, 11.4],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_deck_south_col_e",
      kind: "cover",
      position: [2.6, 1.2, 11.4],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_ramp_south",
      kind: "ramp",
      position: [RAMP_CENTER_X, RAMP_CENTER_Y, 11.4],
      size: [RAMP_LENGTH, RAMP_THICKNESS, 3.0],
      rotation: [0, 0, -RAMP_ANGLE],
      color: "#c68b59",
      material: "timber",
    },

    // West & East concrete slab decks (top y = 2.8) + steel support columns
    {
      id: "scy_deck_west",
      kind: "platform",
      position: [-11.4, 2.6, 0],
      size: [3.8, 0.4, 6.8],
      color: "#cfd7e0",
      material: "concrete",
    },
    {
      id: "scy_deck_west_col_n",
      kind: "cover",
      position: [-11.4, 1.2, -2.6],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_deck_west_col_s",
      kind: "cover",
      position: [-11.4, 1.2, 2.6],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },

    {
      id: "scy_deck_east",
      kind: "platform",
      position: [11.4, 2.6, 0],
      size: [3.8, 0.4, 6.8],
      color: "#cfd7e0",
      material: "concrete",
    },
    {
      id: "scy_deck_east_col_n",
      kind: "cover",
      position: [11.4, 1.2, -2.6],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },
    {
      id: "scy_deck_east_col_s",
      kind: "cover",
      position: [11.4, 1.2, 2.6],
      size: [1.0, 2.4, 1.0],
      color: "#eab308",
      material: "steel",
    },

    // Ground-level concrete barriers & timber supply pallets in all 4 quadrants
    {
      id: "scy_barrier_nw",
      kind: "cover",
      position: [-6.4, 0.9, -5.8],
      size: [3.2, 1.8, 1.2],
      color: "#bcc6d1",
      material: "concrete",
    },
    {
      id: "scy_barrier_ne",
      kind: "cover",
      position: [6.4, 0.9, -5.8],
      size: [1.2, 1.8, 3.2],
      color: "#bcc6d1",
      material: "concrete",
    },
    {
      id: "scy_barrier_se",
      kind: "cover",
      position: [6.4, 0.9, 5.8],
      size: [3.2, 1.8, 1.2],
      color: "#bcc6d1",
      material: "concrete",
    },
    {
      id: "scy_barrier_sw",
      kind: "cover",
      position: [-6.4, 0.9, 5.8],
      size: [1.2, 1.8, 3.2],
      color: "#bcc6d1",
      material: "concrete",
    },
    {
      id: "scy_pallet_ne",
      kind: "cover",
      position: [7.6, 0.65, -11.4],
      size: [2.4, 1.3, 1.8],
      color: "#be8352",
      material: "timber",
    },
    {
      id: "scy_pallet_sw",
      kind: "cover",
      position: [-7.6, 0.65, 11.4],
      size: [2.4, 1.3, 1.8],
      color: "#be8352",
      material: "timber",
    },
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
      position: [-11.4, 0, -7.8],
      radius: 1.3,
      launchVelocity: [0, 14.3, 5.0],
      color: "#eab308",
    },
    {
      id: "scy_pad_ne",
      position: [11.4, 0, -7.8],
      radius: 1.3,
      launchVelocity: [0, 14.3, 5.0],
      color: "#38bdf8",
    },
    {
      id: "scy_pad_se",
      position: [11.4, 0, 7.8],
      radius: 1.3,
      launchVelocity: [0, 14.3, -5.0],
      color: "#eab308",
    },
    {
      id: "scy_pad_sw",
      position: [-11.4, 0, 7.8],
      radius: 1.3,
      launchVelocity: [0, 14.3, -5.0],
      color: "#38bdf8",
    },
  ],
  kothZones: [
    [0, 2.8, 0],
    [0, 0, -7.2],
    [0, 0, 7.2],
  ],
};
