import { create } from "zustand";
import {
  DEFAULT_BOT_DIFFICULTY,
  DEFAULT_GAME_MODE,
  INITIAL_DRAFT_REROLLS,
  PLAYER_MAX_HP,
  SUNLIT_COURTYARD_MAP,
  WEAPON_RIFLE,
  type BotDifficulty,
  type DeviceType,
  type GameMode,
  type MatchPhase,
  type OwnedCard,
} from "@upgun/shared";
import type { MatchVictoryPlayer } from "../components/match";

export type ConnectionStatus = "idle" | "connecting" | "connected";

export interface KothZoneHudSnapshot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  radius: number;
  ownerId: string;
  ownerName: string;
  contested: boolean;
  overtime: boolean;
  progress: number;
  rotationTimer: number;
}

export interface ScoreboardRow {
  sessionId: string;
  displayName: string;
  deviceType: DeviceType;
  isBot: boolean;
  color: string;
  score: number;
  kills: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

export interface DraftPlayerStatus {
  sessionId: string;
  displayName: string;
  hasPicked: boolean;
  isBot: boolean;
}

export interface HudSnapshot {
  phase: MatchPhase;
  phaseTimer: number;
  roundNumber: number;
  winnerSessionId: string;
  winnerName: string;
  matchChampionId: string;
  mapId: string;
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  weaponTier: number;
  kothZone: KothZoneHudSnapshot;
  isPrivateRoom: boolean;
  cheatsEnabled: boolean;
  moonGravity: boolean;
  bigHead: boolean;
  playerCount: number;
  humanCount: number;
  botCount: number;
  hasDummy: boolean;
  hp: number;
  maxHp: number;
  overshield: number;
  isAlive: boolean;
  ammo: number;
  magSize: number;
  isReloading: boolean;
  dashCooldown: number;
  grenadeCooldown: number;
  meleeCooldown: number;
  godMode: boolean;
  infiniteMode: boolean;
  kills: number;
  score: number;
  ownedCards: OwnedCard[];
  draftChoices: string[];
  hasPickedDraft: boolean;
  rerollsRemaining: number;
  draftStatuses: DraftPlayerStatus[];
  scoreboardRows: ScoreboardRow[];
  matchStandings: MatchVictoryPlayer[];
}

interface GameStoreState extends HudSnapshot {
  status: ConnectionStatus;
  sessionId: string | null;
  roomId: string | null;
  connectionError: string | null;
  lobbyOpen: boolean;
  settingsOpen: boolean;
  scoreboardOpen: boolean;
  cardsDrawerOpen: boolean;
  sandboxOpen: boolean;
  isPointerLocked: boolean;
  activeDevice: DeviceType;
  hitmarkerUntil: number;
  hitmarkerKill: boolean;
  remotePlayerIds: string[];
  setConnected: (sessionId: string, roomId: string, isPrivate: boolean) => void;
  setConnecting: () => void;
  setIdle: (error?: string | null) => void;
  setLobbyOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setScoreboardOpen: (open: boolean) => void;
  toggleScoreboard: () => void;
  setCardsDrawerOpen: (open: boolean) => void;
  toggleCardsDrawer: () => void;
  setSandboxOpen: (open: boolean) => void;
  toggleSandbox: () => void;
  setPointerLocked: (locked: boolean) => void;
  setActiveDevice: (device: DeviceType) => void;
  setRemotePlayerIds: (ids: string[]) => void;
  syncHudSnapshot: (snapshot: HudSnapshot) => void;
  triggerHitmarker: (killed: boolean) => void;
}

const DEFAULT_KOTH_ZONE: KothZoneHudSnapshot = {
  active: false,
  x: 0,
  y: 0,
  z: 0,
  radius: 4.2,
  ownerId: "",
  ownerName: "",
  contested: false,
  overtime: false,
  progress: 0,
  rotationTimer: 30,
};

const DEFAULT_HUD: HudSnapshot = {
  phase: "lobby",
  phaseTimer: 0,
  roundNumber: 0,
  winnerSessionId: "",
  winnerName: "",
  matchChampionId: "",
  mapId: SUNLIT_COURTYARD_MAP.id,
  gameMode: DEFAULT_GAME_MODE,
  botDifficulty: DEFAULT_BOT_DIFFICULTY,
  weaponTier: 0,
  kothZone: DEFAULT_KOTH_ZONE,
  isPrivateRoom: false,
  cheatsEnabled: false,
  moonGravity: false,
  bigHead: false,
  playerCount: 0,
  humanCount: 0,
  botCount: 0,
  hasDummy: false,
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  overshield: 0,
  isAlive: true,
  ammo: WEAPON_RIFLE.magazineSize,
  magSize: WEAPON_RIFLE.magazineSize,
  isReloading: false,
  dashCooldown: 0,
  grenadeCooldown: 0,
  meleeCooldown: 0,
  godMode: false,
  infiniteMode: false,
  kills: 0,
  score: 0,
  ownedCards: [],
  draftChoices: [],
  hasPickedDraft: false,
  rerollsRemaining: INITIAL_DRAFT_REROLLS,
  draftStatuses: [],
  scoreboardRows: [],
  matchStandings: [],
};

const initialDevice: DeviceType =
  typeof navigator !== "undefined" && navigator.maxTouchPoints > 0
    ? "mobile"
    : "desktop";

export const useGameStore = create<GameStoreState>((set) => ({
  ...DEFAULT_HUD,
  status: "idle",
  sessionId: null,
  roomId: null,
  connectionError: null,
  lobbyOpen: true,
  settingsOpen: false,
  scoreboardOpen: false,
  cardsDrawerOpen: false,
  sandboxOpen: false,
  isPointerLocked: false,
  activeDevice: initialDevice,
  hitmarkerUntil: 0,
  hitmarkerKill: false,
  remotePlayerIds: [],
  setConnected: (sessionId, roomId, isPrivate) =>
    set({
      status: "connected",
      sessionId,
      roomId,
      isPrivateRoom: isPrivate,
      connectionError: null,
    }),
  setConnecting: () =>
    set({
      ...DEFAULT_HUD,
      status: "connecting",
      sessionId: null,
      roomId: null,
      connectionError: null,
      cardsDrawerOpen: false,
      sandboxOpen: false,
      remotePlayerIds: [],
    }),
  setIdle: (error = null) =>
    set({
      ...DEFAULT_HUD,
      status: "idle",
      sessionId: null,
      roomId: null,
      connectionError: error,
      scoreboardOpen: false,
      cardsDrawerOpen: false,
      sandboxOpen: false,
      remotePlayerIds: [],
    }),
  setLobbyOpen: (lobbyOpen) => set({ lobbyOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setScoreboardOpen: (scoreboardOpen) => set({ scoreboardOpen }),
  toggleScoreboard: () => set((s) => ({ scoreboardOpen: !s.scoreboardOpen })),
  setCardsDrawerOpen: (cardsDrawerOpen) => set({ cardsDrawerOpen }),
  toggleCardsDrawer: () => set((s) => ({ cardsDrawerOpen: !s.cardsDrawerOpen })),
  setSandboxOpen: (sandboxOpen) => set({ sandboxOpen }),
  toggleSandbox: () => set((s) => ({ sandboxOpen: !s.sandboxOpen })),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  setActiveDevice: (activeDevice) => set({ activeDevice }),
  setRemotePlayerIds: (remotePlayerIds) => set({ remotePlayerIds }),
  syncHudSnapshot: (snapshot) => set(snapshot),
  triggerHitmarker: (killed) =>
    set({
      hitmarkerUntil: performance.now() + (killed ? 240 : 160),
      hitmarkerKill: killed,
    }),
}));
