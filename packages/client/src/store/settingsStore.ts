import { create } from "zustand";
import {
  DEFAULT_BODY_COLOR,
  DEFAULT_BOT_DIFFICULTY,
  DEFAULT_GAME_MODE,
  DEFAULT_HAT_ID,
  sanitizeBodyColor,
  sanitizeBotDifficulty,
  sanitizeDisplayName,
  sanitizeGameMode,
  sanitizeHatId,
  type BotDifficulty,
  type GameMode,
  type HatId,
} from "@upgun/shared";
import { soundEngine } from "../audio/soundEngine";

const STORAGE_KEY = "upgun_settings_v1";

interface PersistedSettings {
  nickname: string;
  mouseSensitivity: number;
  showTouchControls: boolean;
  audioVolume: number;
  audioMuted: boolean;
  hatId: HatId;
  bodyColor: string;
  preferredGameMode: GameMode;
  preferredBotDifficulty: BotDifficulty;
}

function detectTouchCapability(): boolean {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

function defaultNickname(): string {
  const suffix = 100 + Math.floor(Math.random() * 900);
  return `Player${suffix}`;
}

function clampSensitivity(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1.0;
  }
  return Math.max(0.25, Math.min(3.0, Math.round(value * 100) / 100));
}

function clampVolume(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0.75;
  }
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function loadInitialSettings(): PersistedSettings {
  const fallback: PersistedSettings = {
    nickname: defaultNickname(),
    mouseSensitivity: 1.0,
    showTouchControls: detectTouchCapability(),
    audioVolume: 0.75,
    audioMuted: false,
    hatId: DEFAULT_HAT_ID,
    bodyColor: DEFAULT_BODY_COLOR,
    preferredGameMode: DEFAULT_GAME_MODE,
    preferredBotDifficulty: DEFAULT_BOT_DIFFICULTY,
  };

  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      nickname: sanitizeDisplayName(parsed.nickname, fallback.nickname),
      mouseSensitivity: clampSensitivity(parsed.mouseSensitivity),
      showTouchControls:
        typeof parsed.showTouchControls === "boolean"
          ? parsed.showTouchControls
          : fallback.showTouchControls,
      audioVolume: clampVolume(parsed.audioVolume),
      audioMuted: typeof parsed.audioMuted === "boolean" ? parsed.audioMuted : false,
      hatId: sanitizeHatId(parsed.hatId),
      bodyColor: sanitizeBodyColor(parsed.bodyColor),
      preferredGameMode: sanitizeGameMode(parsed.preferredGameMode),
      preferredBotDifficulty: sanitizeBotDifficulty(parsed.preferredBotDifficulty),
    };
  } catch {
    return fallback;
  }
}

function persistSettings(next: PersistedSettings): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota / private mode failures
  }
}

interface SettingsStoreState extends PersistedSettings {
  setNickname: (raw: string) => void;
  setMouseSensitivity: (val: number) => void;
  setShowTouchControls: (show: boolean) => void;
  setAudioVolume: (val: number) => void;
  setAudioMuted: (muted: boolean) => void;
  setHatId: (hatId: HatId) => void;
  setBodyColor: (bodyColor: string) => void;
  setPreferredGameMode: (mode: GameMode) => void;
  setPreferredBotDifficulty: (difficulty: BotDifficulty) => void;
}

const initial = loadInitialSettings();
soundEngine.setVolume(initial.audioVolume);
soundEngine.setMuted(initial.audioMuted);
soundEngine.attachAutoUnlock();

function snapshotFrom(state: SettingsStoreState): PersistedSettings {
  return {
    nickname: sanitizeDisplayName(state.nickname, initial.nickname),
    mouseSensitivity: state.mouseSensitivity,
    showTouchControls: state.showTouchControls,
    audioVolume: state.audioVolume,
    audioMuted: state.audioMuted,
    hatId: state.hatId,
    bodyColor: state.bodyColor,
    preferredGameMode: state.preferredGameMode,
    preferredBotDifficulty: state.preferredBotDifficulty,
  };
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...initial,
  setNickname: (raw) => {
    const nickname = raw.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 16);
    set({ nickname });
    persistSettings({ ...snapshotFrom(get()), nickname: sanitizeDisplayName(nickname, initial.nickname) });
  },
  setMouseSensitivity: (val) => {
    const mouseSensitivity = clampSensitivity(val);
    set({ mouseSensitivity });
    persistSettings({ ...snapshotFrom(get()), mouseSensitivity });
  },
  setShowTouchControls: (showTouchControls) => {
    set({ showTouchControls });
    persistSettings({ ...snapshotFrom(get()), showTouchControls });
  },
  setAudioVolume: (val) => {
    const audioVolume = clampVolume(val);
    soundEngine.setVolume(audioVolume);
    set({ audioVolume });
    persistSettings({ ...snapshotFrom(get()), audioVolume });
  },
  setAudioMuted: (audioMuted) => {
    soundEngine.setMuted(audioMuted);
    set({ audioMuted });
    persistSettings({ ...snapshotFrom(get()), audioMuted });
  },
  setHatId: (rawHat) => {
    const hatId = sanitizeHatId(rawHat);
    set({ hatId });
    persistSettings({ ...snapshotFrom(get()), hatId });
  },
  setBodyColor: (rawColor) => {
    const bodyColor = sanitizeBodyColor(rawColor);
    set({ bodyColor });
    persistSettings({ ...snapshotFrom(get()), bodyColor });
  },
  setPreferredGameMode: (rawMode) => {
    const preferredGameMode = sanitizeGameMode(rawMode);
    set({ preferredGameMode });
    persistSettings({ ...snapshotFrom(get()), preferredGameMode });
  },
  setPreferredBotDifficulty: (rawDiff) => {
    const preferredBotDifficulty = sanitizeBotDifficulty(rawDiff);
    set({ preferredBotDifficulty });
    persistSettings({ ...snapshotFrom(get()), preferredBotDifficulty });
  },
}));
