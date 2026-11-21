import { PLAYER_SPAWN_Y } from "../constants";
import type { ArenaMapDefinition } from "./types";

// Mesas sit at y top = 2.8; West mesa spans z in [-9.0, +1.0], East mesa spans z in [-1.0, +9.0]
// Sandstone ramps span 7.0m horizontally: West ramp [1.0, 8.0] (mid 4.5), East ramp [-8.0, -1.0] (mid -4.5)
const RAMP_RUN = 7.0;
const RAMP_RISE = 2.8;
const RAMP_ANGLE = Math.atan2(RAMP_RISE, RAMP_RUN);
const RAMP_LENGTH = Math.hypot(RAMP_RUN, RAMP_RISE);
const RAMP_THICKNESS = 0.4;
const RAMP_CENTER_Y = RAMP_RISE / 2 - (RAMP_THICKNESS / 2) * Math.cos(RAMP_ANGLE);
const RAMP_CENTER_Z = 4.5 - (RAMP_THICKNESS / 2) * Math.sin(RAMP_ANGLE);

export const DESERT_CANYON_OUTPOST_MAP: ArenaMapDefinition = {
  id: "desert_canyon_outpost",
  name: "Desert Canyon Outpost",
  subtitle: "Golden-hour sandstone mesas, rope-bridge catwalks & bazaar cover",
  halfSize: 18,
  theme: {
    skyTop: "#f59e0b",
    skyBottom: "#fde68a",
    fogColor: "#f7cfa0",
    fogNear: 48,
    fogFar: 132,
    ambientIntensity: 0.9,
    sunColor: "#ffcf87",
    sunIntensity: 2.05,
    gridColor: "#e2a96b",
    accentColor: "#ea580c",
    sunPosition: [-70, 22, -45],
    turbidity: 6.5,
    rayleigh: 2.4,
    mieCoefficient: 0.008,
    hemisphereSky: "#ffd6a5",
    hemisphereGround: "#c97b4b",
    floorMaterial: "sandstone",
    decorPreset: "canyon",
  },
  blocks: [
    // Sun-baked canyon sandstone floor (exact top at y = 0)
    {
      id: "dco_floor",
      kind: "floor",
      position: [0, -1.0, 0],
      size: [36, 2, 36],
      color: "#e2b682",
      material: "sandstone",
    },

    // Warm golden-ochre canyon cliff perimeter walls (6.6m high)
    {
      id: "dco_wall_north",
      kind: "wall",
      position: [0, 3.3, -18.5],
      size: [38, 6.6, 1],
      color: "#d18b58",
      material: "sandstone",
    },
    {
      id: "dco_wall_south",
      kind: "wall",
      position: [0, 3.3, 18.5],
      size: [38, 6.6, 1],
      color: "#d18b58",
      material: "sandstone",
    },
    {
      id: "dco_wall_west",
      kind: "wall",
      position: [-18.5, 3.3, 0],
      size: [1, 6.6, 36],
      color: "#d18b58",
      material: "sandstone",
    },
    {
      id: "dco_wall_east",
      kind: "wall",
      position: [18.5, 3.3, 0],
      size: [1, 6.6, 36],
      color: "#d18b58",
      material: "sandstone",
    },

    // West sandstone mesa plateau (top y = 2.8, spans x [-14, -8], z [-9, +1]) + South sandstone ramp
    {
      id: "dco_mesa_west",
      kind: "platform",
      position: [-11.0, 1.4, -4.0],
      size: [6.0, 2.8, 10.0],
      color: "#d6945e",
      material: "sandstone",
    },
    {
      id: "dco_mesa_west_parapet",
      kind: "cover",
      position: [-8.35, 3.35, -6.4],
      size: [0.7, 1.1, 3.4],
      color: "#c97e49",
      material: "terracotta",
    },
    {
      id: "dco_ramp_west",
      kind: "ramp",
      position: [-11.0, RAMP_CENTER_Y, RAMP_CENTER_Z],
      size: [3.8, RAMP_THICKNESS, RAMP_LENGTH],
      rotation: [RAMP_ANGLE, 0, 0],
      color: "#dfb07a",
      material: "sandstone",
    },

    // East sandstone mesa plateau (top y = 2.8, spans x [+8, +14], z [-1, +9]) + North sandstone ramp
    {
      id: "dco_mesa_east",
      kind: "platform",
      position: [11.0, 1.4, 4.0],
      size: [6.0, 2.8, 10.0],
      color: "#d6945e",
      material: "sandstone",
    },
    {
      id: "dco_mesa_east_parapet",
      kind: "cover",
      position: [8.35, 3.35, 6.4],
      size: [0.7, 1.1, 3.4],
      color: "#c97e49",
      material: "terracotta",
    },
    {
      id: "dco_ramp_east",
      kind: "ramp",
      position: [11.0, RAMP_CENTER_Y, -RAMP_CENTER_Z],
      size: [3.8, RAMP_THICKNESS, RAMP_LENGTH],
      rotation: [-RAMP_ANGLE, 0, 0],
      color: "#dfb07a",
      material: "sandstone",
    },

    // Central timber rope-bridge catwalk spanning between West & East mesas (top y = 2.8)
    {
      id: "dco_catwalk_main",
      kind: "platform",
      position: [0, 2.65, 0],
      size: [16.4, 0.3, 3.0],
      color: "#ad7246",
      material: "timber",
    },
    {
      id: "dco_bridge_pier_w",
      kind: "cover",
      position: [-4.2, 1.25, 0],
      size: [1.5, 2.5, 2.4],
      color: "#d4915b",
      material: "sandstone",
    },
    {
      id: "dco_bridge_pier_e",
      kind: "cover",
      position: [4.2, 1.25, 0],
      size: [1.5, 2.5, 2.4],
      color: "#d4915b",
      material: "sandstone",
    },

    // Shaded NE bazaar market crate cover cluster
    {
      id: "dco_market_ne_base",
      kind: "cover",
      position: [4.8, 0.85, -8.5],
      size: [2.8, 1.7, 1.8],
      color: "#b87a4a",
      material: "timber",
    },
    {
      id: "dco_market_ne_crate",
      kind: "cover",
      position: [7.6, 0.65, -10.8],
      size: [1.8, 1.3, 1.8],
      color: "#d16b41",
      material: "terracotta",
    },

    // Shaded SW bazaar market crate cover cluster
    {
      id: "dco_market_sw_base",
      kind: "cover",
      position: [-4.8, 0.85, 8.5],
      size: [2.8, 1.7, 1.8],
      color: "#b87a4a",
      material: "timber",
    },
    {
      id: "dco_market_sw_crate",
      kind: "cover",
      position: [-7.6, 0.65, 10.8],
      size: [1.8, 1.3, 1.8],
      color: "#d16b41",
      material: "terracotta",
    },

    // Canyon floor rock outcrops & low supply cover along N/S approaches
    {
      id: "dco_rock_north",
      kind: "cover",
      position: [-1.8, 1.0, -11.5],
      size: [3.6, 2.0, 1.5],
      color: "#cf8c59",
      material: "sandstone",
    },
    {
      id: "dco_rock_south",
      kind: "cover",
      position: [1.8, 1.0, 11.5],
      size: [3.6, 2.0, 1.5],
      color: "#cf8c59",
      material: "sandstone",
    },
    {
      id: "dco_crate_center_n",
      kind: "cover",
      position: [0, 0.7, -4.8],
      size: [2.4, 1.4, 1.2],
      color: "#b37546",
      material: "timber",
    },
    {
      id: "dco_crate_center_s",
      kind: "cover",
      position: [0, 0.7, 4.8],
      size: [2.4, 1.4, 1.2],
      color: "#b37546",
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
      id: "dco_pad_canyon_ne",
      position: [11.0, 0, -10.2],
      radius: 1.35,
      launchVelocity: [0, 14.4, 5.4],
      color: "#f97316",
    },
    {
      id: "dco_pad_canyon_sw",
      position: [-11.0, 0, 10.2],
      radius: 1.35,
      launchVelocity: [0, 14.4, -5.4],
      color: "#f59e0b",
    },
  ],
  kothZones: [
    [0, 0, 0],
    [0, 2.8, 0],
    [-11.0, 2.8, -4.0],
    [11.0, 2.8, 4.0],
  ],
};
