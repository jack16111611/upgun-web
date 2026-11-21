import { schema, t, type SchemaType } from "@colyseus/schema";
import {
  DEFAULT_BODY_COLOR,
  DEFAULT_BOT_DIFFICULTY,
  DEFAULT_GAME_MODE,
  DEFAULT_HAT_ID,
  INITIAL_DRAFT_REROLLS,
  PLAYER_MAX_HP,
  SUNLIT_COURTYARD_MAP,
  WEAPON_RIFLE,
  type BotDifficulty,
  type DeviceType,
  type GameMode,
  type HatId,
  type MatchPhase,
} from "@upgun/shared";

export const OwnedCardState = schema(
  {
    cardId: t.string().default(""),
    level: t.uint8().default(1),
  },
  "OwnedCardState",
);

export type OwnedCardState = SchemaType<typeof OwnedCardState>;

export const BarrelState = schema(
  {
    id: t.string().default(""),
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    hp: t.uint16().default(40),
    maxHp: t.uint16().default(40),
    alive: t.boolean().default(true),
  },
  "BarrelState",
);

export type BarrelState = SchemaType<typeof BarrelState>;

export const OrbState = schema(
  {
    id: t.string().default(""),
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    active: t.boolean().default(true),
    respawnTimer: t.float32().default(0),
  },
  "OrbState",
);

export type OrbState = SchemaType<typeof OrbState>;

export const KothZoneState = schema(
  {
    active: t.boolean().default(false),
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    radius: t.float32().default(4.2),
    ownerId: t.string().default(""),
    contested: t.boolean().default(false),
    overtime: t.boolean().default(false),
    progress: t.float32().default(0),
    rotationTimer: t.float32().default(30),
  },
  "KothZoneState",
);

export type KothZoneState = SchemaType<typeof KothZoneState>;

export const PlayerState = schema(
  {
    sessionId: t.string().default(""),
    displayName: t.string().default(""),
    deviceType: t.string<DeviceType>().default("desktop"),
    color: t.string().default(DEFAULT_BODY_COLOR),
    bodyColor: t.string().default(DEFAULT_BODY_COLOR),
    hatId: t.string<HatId>().default(DEFAULT_HAT_ID),
    isBot: t.boolean().default(false),
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    vx: t.float32().default(0),
    vy: t.float32().default(0),
    vz: t.float32().default(0),
    yaw: t.float32().default(0),
    pitch: t.float32().default(0),
    hp: t.uint16().default(PLAYER_MAX_HP),
    maxHp: t.uint16().default(PLAYER_MAX_HP),
    overshield: t.uint16().default(0),
    isAlive: t.boolean().default(true),
    kills: t.uint16().default(0),
    meleeKills: t.uint16().default(0),
    score: t.uint16().default(0),
    weaponTier: t.uint8().default(0),
    ammo: t.uint8().default(WEAPON_RIFLE.magazineSize),
    magSize: t.uint8().default(WEAPON_RIFLE.magazineSize),
    isReloading: t.boolean().default(false),
    dashCooldown: t.float32().default(0),
    grenadeCooldown: t.float32().default(0),
    meleeCooldown: t.float32().default(0),
    godMode: t.boolean().default(false),
    infiniteMode: t.boolean().default(false),
    ownedCards: t.array(OwnedCardState),
    draftChoices: t.array("string"),
    hasPickedDraft: t.boolean().default(false),
    rerollsRemaining: t.uint8().default(INITIAL_DRAFT_REROLLS),
  },
  "PlayerState",
);

export type PlayerState = SchemaType<typeof PlayerState>;

export const GrenadeState = schema(
  {
    id: t.string().default(""),
    ownerId: t.string().default(""),
    x: t.float32().default(0),
    y: t.float32().default(0),
    z: t.float32().default(0),
    fuseLeft: t.float32().default(2),
  },
  "GrenadeState",
);

export type GrenadeState = SchemaType<typeof GrenadeState>;

export const ArenaState = schema(
  {
    tick: t.uint32().default(0),
    phase: t.string<MatchPhase>().default("lobby"),
    phaseTimer: t.float32().default(0),
    roundNumber: t.uint16().default(0),
    winnerSessionId: t.string().default(""),
    matchChampionId: t.string().default(""),
    mapId: t.string().default(SUNLIT_COURTYARD_MAP.id),
    gameMode: t.string<GameMode>().default(DEFAULT_GAME_MODE),
    botDifficulty: t.string<BotDifficulty>().default(DEFAULT_BOT_DIFFICULTY),
    isPrivate: t.boolean().default(false),
    cheatsEnabled: t.boolean().default(false),
    moonGravity: t.boolean().default(false),
    bigHead: t.boolean().default(false),
    kothZone: KothZoneState,
    players: t.map(PlayerState),
    grenades: t.map(GrenadeState),
    barrels: t.map(BarrelState),
    orbs: t.map(OrbState),
  },
  "ArenaState",
);

export type ArenaState = SchemaType<typeof ArenaState>;
