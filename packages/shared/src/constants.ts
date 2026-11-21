export const TICK_RATE = 60;
export const FIXED_DT_MS = 1000 / TICK_RATE;
export const FIXED_DT_SEC = 1 / TICK_RATE;

export const MAX_RECURSION_DEPTH = 3;

export const ARENA_ROOM_NAME = "arena_room";

export type MatchPhase =
  | "lobby"
  | "countdown"
  | "combat"
  | "round_over"
  | "drafting"
  | "match_over";

export const MATCH_WIN_SCORE = 5;
export const MAX_COMBAT_BOTS = 5;

export type DeviceType = "desktop" | "mobile" | "gamepad";

export type GameMode = "classic" | "gun_game" | "koth" | "low_grav" | "instagib";
export type BotDifficulty = "easy" | "medium" | "hard" | "nightmare";

export const DEFAULT_GAME_MODE: GameMode = "classic";
export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = "medium";

export const MAX_DISPLAY_NAME_LENGTH = 16;
export const MAX_CHAT_LENGTH = 120;
export const ROOM_CODE_LENGTH = 4;

export interface JoinRoomOptions {
  displayName?: string;
  deviceType?: DeviceType;
  isPrivate?: boolean;
  hatId?: string;
  bodyColor?: string;
  gameMode?: GameMode;
  botDifficulty?: BotDifficulty;
}

export const COUNTDOWN_DURATION_SEC = 3;
export const ROUND_OVER_DURATION_SEC = 3;
export const DRAFTING_DURATION_SEC = 14;
export const INITIAL_DRAFT_REROLLS = 1;

export const PLAYER_RADIUS = 0.4;
export const PLAYER_HALF_HEIGHT = 0.5;
/** Exact Y height of the capsule center when the player's feet rest on y = 0. */
export const PLAYER_CAPSULE_CENTER_Y = PLAYER_HALF_HEIGHT + PLAYER_RADIUS;
/** Spawn capsule center slightly (+0.05m) above the floor so colliders never start intersecting. */
export const PLAYER_SPAWN_Y = PLAYER_CAPSULE_CENTER_Y + 0.05;
export const PLAYER_EYE_OFFSET_Y = 0.65;
export const PLAYER_MAX_HP = 100;

export const PLAYER_MOVE_SPEED = 7.5;
export const PLAYER_GROUND_ACCEL = 60;
export const PLAYER_AIR_ACCEL = 22;
export const PLAYER_GRAVITY = 24;
export const PLAYER_JUMP_SPEED = 9.2;
export const PLAYER_MAX_JUMPS = 2;
export const PLAYER_DASH_SPEED = 19.5;
export const PLAYER_DASH_DURATION_SEC = 0.16;
export const PLAYER_DASH_COOLDOWN_SEC = 1.5;
export const MAX_PITCH_RAD = Math.PI / 2 - 0.05;

export const WEAPON_RIFLE = {
  damage: 25,
  fireCooldownMs: 120,
  fireCooldownSec: 0.12,
  magazineSize: 12,
  reloadDurationSec: 1.2,
  maxRange: 120,
} as const;

export const WEAPON_GRENADE = {
  fuseSec: 2.0,
  maxDamage: 65,
  splashRadius: 6.5,
  cooldownSec: 5.0,
  throwSpeed: 18.0,
  throwUpwardBoost: 4.5,
  radius: 0.18,
  restitution: 0.55,
  friction: 0.4,
} as const;

export const WEAPON_MELEE = {
  damage: 45,
  range: 2.6,
  coneCos: 0.45,
  cooldownSec: 0.65,
  knockbackForce: 13.5,
  deflectRadius: 2.8,
  deflectSpeedScale: 1.4,
} as const;

export type CheatCodeId =
  | "IDDQD"
  | "INFINITE"
  | "UPGUNMAX"
  | "MOON"
  | "BIGHEAD"
  | "BOTARMY";

export const PLAYER_COLORS = [
  "#38bdf8",
  "#f43f5e",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#ec4899",
] as const;

export const DUMMY_SESSION_ID = "bot_target_dummy";
export const DUMMY_COLOR = "#f97316";

export const NET_MSG = {
  INPUT: "input",
  SET_DEVICE_TYPE: "set_device_type",
  SET_COSMETICS: "set_cosmetics",
  SET_GAME_MODE: "set_game_mode",
  SET_BOT_DIFFICULTY: "set_bot_difficulty",
  START_SOLO_PRACTICE: "start_solo_practice",
  ADD_BOT: "add_bot",
  PICK_CARD: "pick_card",
  REROLL_DRAFT: "reroll_draft",
  CHEAT_COMMAND: "cheat_command",
  SANDBOX_GRANT_CARD: "sandbox_grant_card",
  PLAY_AGAIN: "play_again",
  CHAT_MESSAGE: "chat_message",
  QUICK_CHAT: "quick_chat",
  WEBRTC_JOIN: "webrtc_join",
  WEBRTC_LEAVE: "webrtc_leave",
  WEBRTC_OFFER: "webrtc_offer",
  WEBRTC_ANSWER: "webrtc_answer",
  WEBRTC_ICE: "webrtc_ice",
  VOICE_SPEAKING: "voice_speaking",
  KILLER_HIGHLIGHT: "killer_highlight",
  SHOT_EVENT: "shot_event",
  HIT_EVENT: "hit_event",
  EXPLOSION_EVENT: "explosion_event",
  JUMP_PAD_EVENT: "jump_pad_event",
  MELEE_SWING_EVENT: "melee_swing_event",
  DEFLECT_EVENT: "deflect_event",
  ANNOUNCEMENT_EVENT: "announcement_event",
  TELEPORT_EVENT: "teleport_event",
  ORB_PICKUP_EVENT: "orb_pickup_event",
} as const;

export interface QuickChatCallout {
  id: string;
  label: string;
  icon: string;
}

export const QUICK_CHAT_CALLOUTS: readonly QuickChatCallout[] = [
  { id: "nice_shot", label: "Nice Shot!", icon: "🎯" },
  { id: "watch_grenade", label: "Watch the Grenade!", icon: "💣" },
  { id: "gg", label: "GG!", icon: "🏆" },
  { id: "behind_you", label: "Behind You!", icon: "👀" },
  { id: "rematch", label: "Rematch?", icon: "🔁" },
  { id: "too_close", label: "Too Close!", icon: "😅" },
  { id: "help", label: "Help!", icon: "🆘" },
  { id: "haha", label: "Haha!", icon: "😂" },
] as const;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShotEvent {
  shooterId: string;
  origin: Vec3;
  end: Vec3;
  hit: boolean;
}

export interface HitEvent {
  shooterId: string;
  targetId: string;
  damage: number;
  remainingHp: number;
  killed: boolean;
  crit?: boolean;
  point: Vec3;
}

export interface ExplosionEvent {
  grenadeId: string;
  ownerId: string;
  position: Vec3;
  radius: number;
}

export interface JumpPadEvent {
  sessionId: string;
  padId: string;
  position: Vec3;
}

export interface MeleeSwingEvent {
  attackerId: string;
  origin: Vec3;
  direction: Vec3;
  range: number;
  deflected: boolean;
}

export interface DeflectEvent {
  deflectorId: string;
  position: Vec3;
  kind: "grenade" | "shot";
}

export interface AnnouncementEvent {
  banner: string;
  subtitle: string;
  actorId: string;
  accent: string;
}

export interface TeleportEvent {
  entityId: string;
  from: Vec3;
  to: Vec3;
  color: string;
}

export interface OrbPickupEvent {
  playerId: string;
  position: Vec3;
}

export interface ChatMessageEvent {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export interface QuickChatEvent {
  senderId: string;
  senderName: string;
  calloutId: string;
  text: string;
  timestamp: number;
}

export interface VoiceSpeakingEvent {
  sessionId: string;
  speaking: boolean;
}

export interface KillerHighlightEvent {
  victimId: string;
  killerId: string;
  killerName: string;
  killerHp: number;
  killerMaxHp: number;
  weaponSource: string;
}

export interface WebRTCSignalPayload {
  from?: string;
  to: string;
  sdp?: unknown;
  candidate?: unknown;
}
