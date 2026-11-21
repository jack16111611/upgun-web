export interface BarrelSpawnDef {
  id: string;
  position: [number, number, number];
}

export interface TeleporterPairDef {
  id: string;
  a: [number, number, number];
  b: [number, number, number];
  radius: number;
  colorA: string;
  colorB: string;
}

export interface OrbSpawnDef {
  id: string;
  position: [number, number, number];
}

export interface MapPropsConfig {
  mapId: string;
  barrels: readonly BarrelSpawnDef[];
  teleporters: readonly TeleporterPairDef[];
  orbs: readonly OrbSpawnDef[];
}

export const SUNLIT_COURTYARD_PROPS: MapPropsConfig = {
  mapId: "sunlit_courtyard",
  barrels: [
    { id: "sc_barrel_nw", position: [-5.5, 0, -5.5] },
    { id: "sc_barrel_ne", position: [5.5, 0, -5.5] },
    { id: "sc_barrel_se", position: [5.5, 0, 5.5] },
    { id: "sc_barrel_sw", position: [-5.5, 0, 5.5] },
    { id: "sc_barrel_bridge_w", position: [-11.0, 2.8, 0] },
    { id: "sc_barrel_bridge_e", position: [11.0, 2.8, 0] },
  ],
  teleporters: [
    {
      id: "sc_tp_flanks",
      a: [-15.2, 0, 0],
      b: [15.2, 0, 0],
      radius: 1.2,
      colorA: "#0ea5e9",
      colorB: "#f97316",
    },
    {
      id: "sc_tp_arches",
      a: [0, 0, -14.8],
      b: [0, 0, 14.8],
      radius: 1.2,
      colorA: "#14b8a6",
      colorB: "#eab308",
    },
  ],
  orbs: [{ id: "sc_orb_fountain", position: [0, 2.2, 0] }],
};

export const ALPINE_SKY_TEMPLE_PROPS: MapPropsConfig = {
  mapId: "alpine_sky_temple",
  barrels: [
    { id: "ast_barrel_n", position: [0, 0, -7.2] },
    { id: "ast_barrel_s", position: [0, 0, 7.2] },
    { id: "ast_barrel_w", position: [-7.2, 0, 0] },
    { id: "ast_barrel_e", position: [7.2, 0, 0] },
    { id: "ast_barrel_nw", position: [-9.5, 0, -9.5] },
    { id: "ast_barrel_se", position: [9.5, 0, 9.5] },
  ],
  teleporters: [
    {
      id: "ast_tp_terraces",
      a: [-14.5, 0, 0],
      b: [14.5, 0, 0],
      radius: 1.2,
      colorA: "#38bdf8",
      colorB: "#fbbf24",
    },
    {
      id: "ast_tp_gates",
      a: [0, 0, -14.5],
      b: [0, 0, 14.5],
      radius: 1.2,
      colorA: "#22d3ee",
      colorB: "#f43f5e",
    },
  ],
  orbs: [{ id: "ast_orb_sanctum", position: [0, 2.4, 0] }],
};

export const DESERT_CANYON_OUTPOST_PROPS: MapPropsConfig = {
  mapId: "desert_canyon_outpost",
  barrels: [
    { id: "dco_barrel_nw", position: [-5.8, 0, -5.2] },
    { id: "dco_barrel_ne", position: [5.8, 0, -5.2] },
    { id: "dco_barrel_se", position: [5.8, 0, 5.2] },
    { id: "dco_barrel_sw", position: [-5.8, 0, 5.2] },
    { id: "dco_barrel_mesa_w", position: [-11.5, 2.6, 0] },
    { id: "dco_barrel_mesa_e", position: [11.5, 2.6, 0] },
  ],
  teleporters: [
    {
      id: "dco_tp_canyon",
      a: [-15.2, 0, -6.0],
      b: [15.2, 0, 6.0],
      radius: 1.25,
      colorA: "#f59e0b",
      colorB: "#06b6d4",
    },
    {
      id: "dco_tp_bazaar",
      a: [-15.2, 0, 6.0],
      b: [15.2, 0, -6.0],
      radius: 1.25,
      colorA: "#ea580c",
      colorB: "#38bdf8",
    },
  ],
  orbs: [{ id: "dco_orb_center", position: [0, 1.4, 0] }],
};

export const SKYLINE_CONSTRUCTION_PROPS: MapPropsConfig = {
  mapId: "skyline_construction_yard",
  barrels: [
    { id: "scy_barrel_nw", position: [-5.0, 0, -5.6] },
    { id: "scy_barrel_ne", position: [5.0, 0, -5.6] },
    { id: "scy_barrel_se", position: [5.0, 0, 5.6] },
    { id: "scy_barrel_sw", position: [-5.0, 0, 5.6] },
    { id: "scy_barrel_n", position: [0, 0, -8.5] },
    { id: "scy_barrel_s", position: [0, 0, 8.5] },
  ],
  teleporters: [
    {
      id: "scy_tp_deck",
      a: [-15.0, 0, 0],
      b: [15.0, 0, 0],
      radius: 1.2,
      colorA: "#facc15",
      colorB: "#0284c7",
    },
    {
      id: "scy_tp_girders",
      a: [0, 0, -15.0],
      b: [0, 0, 15.0],
      radius: 1.2,
      colorA: "#fb923c",
      colorB: "#22d3ee",
    },
  ],
  orbs: [{ id: "scy_orb_center", position: [0, 1.5, 0] }],
};

export const MAP_PROPS_BY_ID: Readonly<Record<string, MapPropsConfig>> = {
  sunlit_courtyard: SUNLIT_COURTYARD_PROPS,
  alpine_sky_temple: ALPINE_SKY_TEMPLE_PROPS,
  desert_canyon_outpost: DESERT_CANYON_OUTPOST_PROPS,
  skyline_construction_yard: SKYLINE_CONSTRUCTION_PROPS,
  neon_foundry: SUNLIT_COURTYARD_PROPS,
  skyline_rooftops: ALPINE_SKY_TEMPLE_PROPS,
  cyber_colosseum: DESERT_CANYON_OUTPOST_PROPS,
};

export function getMapPropsConfig(mapId: string): MapPropsConfig {
  return MAP_PROPS_BY_ID[mapId] ?? SUNLIT_COURTYARD_PROPS;
}
