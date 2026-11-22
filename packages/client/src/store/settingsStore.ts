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
import type { AimAssistPreset } from "../input/aimAssist";
import { gyroInput } from "../input/gyroInput";

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
  aimAssistPreset: AimAssistPreset;
  aimAssistCustomized: boolean;
  autoFireEnabled: boolean;
  gyroEnabled: boolean;
  gyroSensitivityX: number;
  gyroSensitivityY: number;
  gyroInvertY: boolean;
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

function sanitizeAimAssistPreset(value: unknown, fallback: AimAssistPreset): AimAssistPreset {
  if (value === "off" || value === "standard" || value === "strong") {
    return value;
  }
  return fallback;
}

function loadInitialSettings(): PersistedSettings {
  const touchCapable = detectTouchCapability();
  const fallback: PersistedSettings = {
    nickname: defaultNickname(),
    mouseSensitivity: 1.0,
    showTouchControls: touchCapable,
    audioVolume: 0.75,
    audioMuted: false,
    hatId: DEFAULT_HAT_ID,
    bodyColor: DEFAULT_BODY_COLOR,
    preferredGameMode: DEFAULT_GAME_MODE,
    preferredBotDifficulty: DEFAULT_BOT_DIFFICULTY,
    aimAssistPreset: touchCapable ? "strong" : "off",
    aimAssistCustomized: false,
    autoFireEnabled: touchCapable,
    gyroEnabled: false,
    gyroSensitivityX: 1.0,
    gyroSensitivityY: 1.0,
    gyroInvertY: false,
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
      aimAssistPreset: sanitizeAimAssistPreset(parsed.aimAssistPreset, fallback.aimAssistPreset),
      aimAssistCustomized:
        typeof parsed.aimAssistCustomized === "boolean" ? parsed.aimAssistCustomized : false,
      autoFireEnabled:
        typeof parsed.autoFireEnabled === "boolean"
          ? parsed.autoFireEnabled
          : fallback.autoFireEnabled,
      gyroEnabled: typeof parsed.gyroEnabled === "boolean" ? parsed.gyroEnabled : false,
      gyroSensitivityX: clampSensitivity(parsed.gyroSensitivityX),
      gyroSensitivityY: clampSensitivity(parsed.gyroSensitivityY),
      gyroInvertY: typeof parsed.gyroInvertY === "boolean" ? parsed.gyroInvertY : false,
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

function syncGyroConfig(state: Pick<PersistedSettings, "gyroEnabled" | "gyroSensitivityX" | "gyroSensitivityY" | "gyroInvertY">): void {
  gyroInput.setConfig({
    enabled: state.gyroEnabled,
    sensitivityX: state.gyroSensitivityX,
    sensitivityY: state.gyroSensitivityY,
    invertY: state.gyroInvertY,
  });
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
  setAimAssistPreset: (preset: AimAssistPreset, manual?: boolean) => void;
  setAutoFireEnabled: (enabled: boolean) => void;
  setGyroEnabled: (enabled: boolean) => void;
  setGyroSensitivityX: (val: number) => void;
  setGyroSensitivityY: (val: number) => void;
  setGyroInvertY: (invert: boolean) => void;
}

const initial = loadInitialSettings();
soundEngine.setVolume(initial.audioVolume);
soundEngine.setMuted(initial.audioMuted);
soundEngine.attachAutoUnlock();
syncGyroConfig(initial);

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
    aimAssistPreset: state.aimAssistPreset,
    aimAssistCustomized: state.aimAssistCustomized,
    autoFireEnabled: state.autoFireEnabled,
    gyroEnabled: state.gyroEnabled,
    gyroSensitivityX: state.gyroSensitivityX,
    gyroSensitivityY: state.gyroSensitivityY,
    gyroInvertY: state.gyroInvertY,
  };
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...initial,
  setNickname: (raw) => {
    const nickname = raw.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 16);
    set({ nickname });
    persistSettings({
      ...snapshotFrom(get()),
      nickname: sanitizeDisplayName(nickname, initial.nickname),
    });
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
  setAimAssistPreset: (rawPreset, manual = true) => {
    const aimAssistPreset = sanitizeAimAssistPreset(rawPreset, "standard");
    const aimAssistCustomized = manual ? true : get().aimAssistCustomized;
    set({ aimAssistPreset, aimAssistCustomized });
    persistSettings({ ...snapshotFrom(get()), aimAssistPreset, aimAssistCustomized });
  },
  setAutoFireEnabled: (autoFireEnabled) => {
    set({ autoFireEnabled });
    persistSettings({ ...snapshotFrom(get()), autoFireEnabled });
  },
  setGyroEnabled: (gyroEnabled) => {
    set({ gyroEnabled });
    const snap = { ...snapshotFrom(get()), gyroEnabled };
    syncGyroConfig(snap);
    persistSettings(snap);
  },
  setGyroSensitivityX: (val) => {
    const gyroSensitivityX = clampSensitivity(val);
    set({ gyroSensitivityX });
    const snap = { ...snapshotFrom(get()), gyroSensitivityX };
    syncGyroConfig(snap);
    persistSettings(snap);
  },
  setGyroSensitivityY: (val) => {
    const gyroSensitivityY = clampSensitivity(val);
    set({ gyroSensitivityY });
    const snap = { ...snapshotFrom(get()), gyroSensitivityY };
    syncGyroConfig(snap);
    persistSettings(snap);
  },
  setGyroInvertY: (gyroInvertY) => {
    set({ gyroInvertY });
    const snap = { ...snapshotFrom(get()), gyroInvertY };
    syncGyroConfig(snap);
    persistSettings(snap);
  },
}));
