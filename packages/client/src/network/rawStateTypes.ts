import type { BotDifficulty, DeviceType, GameMode, HatId, MatchPhase } from "@upgun/shared";

export interface RawKothZoneState {
  active?: boolean;
  x?: number;
  y?: number;
  z?: number;
  radius?: number;
  ownerId?: string;
  contested?: boolean;
  overtime?: boolean;
  progress?: number;
  rotationTimer?: number;
}

export interface RawOwnedCard {
  cardId: string;
  level: number;
}

export interface RawBarrelState {
  id: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface RawOrbState {
  id: string;
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnTimer: number;
}

export interface RawPlayerState {
  sessionId: string;
  displayName: string;
  deviceType: DeviceType;
  color: string;
  bodyColor?: string;
  hatId?: HatId;
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  hp: number;
  maxHp: number;
  overshield?: number;
  isAlive: boolean;
  kills: number;
  meleeKills?: number;
  score: number;
  ammo: number;
  magSize: number;
  isReloading: boolean;
  dashCooldown: number;
  grenadeCooldown: number;
  meleeCooldown?: number;
  godMode?: boolean;
  infiniteMode?: boolean;
  weaponTier?: number;
  ownedCards?: Iterable<RawOwnedCard>;
  draftChoices?: Iterable<string>;
  hasPickedDraft: boolean;
  rerollsRemaining: number;
}

export interface RawGrenadeState {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  fuseLeft: number;
}

export interface RawArenaState {
  phase: MatchPhase;
  phaseTimer: number;
  roundNumber: number;
  winnerSessionId: string;
  matchChampionId?: string;
  mapId?: string;
  gameMode?: GameMode;
  botDifficulty?: BotDifficulty;
  kothZone?: RawKothZoneState;
  isPrivate: boolean;
  cheatsEnabled?: boolean;
  moonGravity?: boolean;
  bigHead?: boolean;
  players?: Map<string, RawPlayerState> & {
    forEach: (cb: (val: RawPlayerState, key: string) => void) => void;
  };
  grenades?: Map<string, RawGrenadeState> & {
    forEach: (cb: (val: RawGrenadeState, key: string) => void) => void;
  };
  barrels?: Map<string, RawBarrelState> & {
    forEach: (cb: (val: RawBarrelState, key: string) => void) => void;
  };
  orbs?: Map<string, RawOrbState> & {
    forEach: (cb: (val: RawOrbState, key: string) => void) => void;
  };
}
