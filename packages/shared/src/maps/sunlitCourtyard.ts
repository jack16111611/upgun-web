import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaMapDefinition } from "./types";

// Arcades end at z = +/-6.0; ramps span 7.0m horizontally to z = +/-13.0 (midpoint 9.5)
const RAMP_RUN = 7.0;
const RAMP_RISE = 2.6;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.36;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_Z = 9.5 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

export const SUNLIT_COURTYARD_MAP: ArenaMapDefinition = {
  id: "sunlit_courtyard",
  name: "Sunlit Courtyard",
  subtitle: "Mediterranean cobblestone plaza, sandstone arches & terracotta ledges",
  halfSize: 18,
  theme: {
    skyTop: "#4ea8de",
    skyBottom: "#e8f4fc",
    fogColor: "#d9ecf7",
    fogNear: 52,
    fogFar: 138,
    ambientIntensity: 0.95,
    sunColor: "#fff4d6",
    sunIntensity: 1.85,
    gridColor: "#e6ccb2",
    accentColor: "#e07a5f",
    sunPosition: [42, 65, 28],
    turbidity: 3.2,
    rayleigh: 1.1,
    mieCoefficient: 0.004,
    hemisphereSky: "#b8e1ff",
    hemisphereGround: "#d9b991",
    floorMaterial: "cobblestone",
    decorPreset: "courtyard",
  },
  blocks: [
    // Solid cobblestone plaza floor (36m x 36m, exact top at y = 0)
    {
      id: "sc_floor",
      kind: "floor",
      position: [0, -1.0, 0],
      size: [36, 2, 36],
      color: "#ded6c8",
      material: "cobblestone",
    },

    // Warm sandstone perimeter walls (6.4m high to contain jump-pad arcs)
    {
      id: "sc_wall_north",
      kind: "wall",
      position: [0, 3.2, -18.5],
      size: [38, 6.4, 1],
      color: "#e6d2b0",
      material: "sandstone",
    },
    {
      id: "sc_wall_south",
      kind: "wall",
      position: [0, 3.2, 18.5],
      size: [38, 6.4, 1],
      color: "#e6d2b0",
      material: "sandstone",
    },
    {
      id: "sc_wall_west",
      kind: "wall",
      position: [-18.5, 3.2, 0],
      size: [1, 6.4, 36],
      color: "#e6d2b0",
      material: "sandstone",
    },
    {
      id: "sc_wall_east",
      kind: "wall",
      position: [18.5, 3.2, 0],
      size: [1, 6.4, 36],
      color: "#e6d2b0",
      material: "sandstone",
    },

    // Central Mediterranean Fountain Platform (stepped cobblestone rim + marble centerpiece)
    {
      id: "sc_fountain_basin",
      kind: "platform",
      position: [0, 0.25, 0],
      size: [6.0, 0.5, 6.0],
      color: "#dcd4c4",
      material: "cobblestone",
    },
    {
      id: "sc_fountain_plinth",
      kind: "platform",
      position: [0, 1.15, 0],
      size: [2.4, 1.3, 2.4],
      color: "#f2efe6",
      material: "marble",
    },

    // North & South sandstone arch cover walls framing the fountain plaza
    {
      id: "sc_cover_north",
      kind: "cover",
      position: [0, 0.9, -7.2],
      size: [4.8, 1.8, 1.1],
      color: "#e2c89f",
      material: "sandstone",
    },
    {
      id: "sc_cover_south",
      kind: "cover",
      position: [0, 0.9, 7.2],
      size: [4.8, 1.8, 1.1],
      color: "#e2c89f",
      material: "sandstone",
    },

    // Four diagonal courtyard planter boxes with trimmed cypress-green hedges
    {
      id: "sc_planter_nw",
      kind: "cover",
      position: [-5.8, 0.5, -5.2],
      size: [2.0, 1.0, 2.0],
      color: "#dfb98a",
      material: "sandstone",
    },
    {
      id: "sc_hedge_nw",
      kind: "cover",
      position: [-5.8, 1.45, -5.2],
      size: [1.65, 0.9, 1.65],
      color: "#52a648",
      material: "foliage",
    },
    {
      id: "sc_planter_ne",
      kind: "cover",
      position: [5.8, 0.5, -5.2],
      size: [2.0, 1.0, 2.0],
      color: "#dfb98a",
      material: "sandstone",
    },
    {
      id: "sc_hedge_ne",
      kind: "cover",
      position: [5.8, 1.45, -5.2],
      size: [1.65, 0.9, 1.65],
      color: "#52a648",
      material: "foliage",
    },
    {
      id: "sc_planter_se",
      kind: "cover",
      position: [5.8, 0.5, 5.2],
      size: [2.0, 1.0, 2.0],
      color: "#dfb98a",
      material: "sandstone",
    },
    {
      id: "sc_hedge_se",
      kind: "cover",
      position: [5.8, 1.45, 5.2],
      size: [1.65, 0.9, 1.65],
      color: "#52a648",
      material: "foliage",
    },
    {
      id: "sc_planter_sw",
      kind: "cover",
      position: [-5.8, 0.5, 5.2],
      size: [2.0, 1.0, 2.0],
      color: "#dfb98a",
      material: "sandstone",
    },
    {
      id: "sc_hedge_sw",
      kind: "cover",
      position: [-5.8, 1.45, 5.2],
      size: [1.65, 0.9, 1.65],
      color: "#52a648",
      material: "foliage",
    },

    // West terracotta roof arcade (top y = 2.6) + 3 sandstone arch columns + South ramp
    {
      id: "sc_ledge_west",
      kind: "platform",
      position: [-11.5, 2.4, 0],
      size: [4.6, 0.4, 12],
      color: "#dc6d45",
      material: "terracotta",
    },
    {
      id: "sc_col_west_n",
      kind: "cover",
      position: [-11.5, 1.1, -4.8],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_col_west_mid",
      kind: "cover",
      position: [-11.5, 1.1, 0],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_col_west_s",
      kind: "cover",
      position: [-11.5, 1.1, 4.8],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_ramp_west",
      kind: "ramp",
      position: [-11.5, RAMP_CENTER_Y, RAMP_CENTER_Z],
      size: [3.4, RAMP_THICKNESS, RAMP_LENGTH],
      rotation: [RAMP_ANGLE, 0, 0],
      color: "#b87c4f",
      material: "timber",
    },

    // East terracotta roof arcade (top y = 2.6) + 3 sandstone arch columns + North ramp
    {
      id: "sc_ledge_east",
      kind: "platform",
      position: [11.5, 2.4, 0],
      size: [4.6, 0.4, 12],
      color: "#dc6d45",
      material: "terracotta",
    },
    {
      id: "sc_col_east_n",
      kind: "cover",
      position: [11.5, 1.1, -4.8],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_col_east_mid",
      kind: "cover",
      position: [11.5, 1.1, 0],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_col_east_s",
      kind: "cover",
      position: [11.5, 1.1, 4.8],
      size: [1.3, 2.2, 1.3],
      color: "#e6cda4",
      material: "sandstone",
    },
    {
      id: "sc_ramp_east",
      kind: "ramp",
      position: [11.5, RAMP_CENTER_Y, -RAMP_CENTER_Z],
      size: [3.4, RAMP_THICKNESS, RAMP_LENGTH],
      rotation: [-RAMP_ANGLE, 0, 0],
      color: "#b87c4f",
      material: "timber",
    },

    // North & South wooden balcony bridges connecting the flanking sightlines (top y = 2.6)
    {
      id: "sc_bridge_north",
      kind: "platform",
      position: [0, 2.45, -12.2],
      size: [10.4, 0.3, 3.0],
      color: "#b67b4d",
      material: "timber",
    },
    {
      id: "sc_bridge_north_pier_w",
      kind: "cover",
      position: [-4.4, 1.15, -12.2],
      size: [1.2, 2.3, 2.6],
      color: "#e4c99e",
      material: "sandstone",
    },
    {
      id: "sc_bridge_north_pier_e",
      kind: "cover",
      position: [4.4, 1.15, -12.2],
      size: [1.2, 2.3, 2.6],
      color: "#e4c99e",
      material: "sandstone",
    },
    {
      id: "sc_bridge_south",
      kind: "platform",
      position: [0, 2.45, 12.2],
      size: [10.4, 0.3, 3.0],
      color: "#b67b4d",
      material: "timber",
    },
    {
      id: "sc_bridge_south_pier_w",
      kind: "cover",
      position: [-4.4, 1.15, 12.2],
      size: [1.2, 2.3, 2.6],
      color: "#e4c99e",
      material: "sandstone",
    },
    {
      id: "sc_bridge_south_pier_e",
      kind: "cover",
      position: [4.4, 1.15, 12.2],
      size: [1.2, 2.3, 2.6],
      color: "#e4c99e",
      material: "sandstone",
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
      id: "sc_pad_west_arcade",
      position: [-11.5, 0, -9.5],
      radius: 1.35,
      launchVelocity: [0, 14.0, 5.6],
      color: "#38bdf8",
    },
    {
      id: "sc_pad_east_arcade",
      position: [11.5, 0, 9.5],
      radius: 1.35,
      launchVelocity: [0, 14.0, -5.6],
      color: "#f59e0b",
    },
  ],
  kothZones: [
    [0, 0.5, 0],
    [-11.5, 2.6, 0],
    [11.5, 2.6, 0],
  ],
};
