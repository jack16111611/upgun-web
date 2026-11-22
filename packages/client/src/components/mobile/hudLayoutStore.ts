import { create } from "zustand";

export type HudControlId =
  | "firePrimary"
  | "fireClaw"
  | "jump"
  | "dash"
  | "grenade"
  | "melee"
  | "reload"
  | "quickChat"
  | "joystick";

export type HudLayoutPreset = "two_thumb" | "three_claw" | "four_claw";

export interface HudControlPlacement {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export type HudControlMap = Record<HudControlId, HudControlPlacement>;

export interface HudControlMeta {
  id: HudControlId;
  name: string;
  baseSize: number;
  variantClass: string;
}

export const HUD_CONTROL_IDS: readonly HudControlId[] = [
  "joystick",
  "firePrimary",
  "fireClaw",
  "jump",
  "dash",
  "grenade",
  "melee",
  "reload",
  "quickChat",
];

export const HUD_CONTROL_META: Record<HudControlId, HudControlMeta> = {
  joystick: {
    id: "joystick",
    name: "Move Stick",
    baseSize: 112,
    variantClass: "touch-btn--joystick",
  },
  firePrimary: {
    id: "firePrimary",
    name: "Fire + Aim",
    baseSize: 74,
    variantClass: "touch-btn--fire",
  },
  fireClaw: {
    id: "fireClaw",
    name: "Claw Fire",
    baseSize: 60,
    variantClass: "touch-btn--claw",
  },
  jump: {
    id: "jump",
    name: "Jump",
    baseSize: 56,
    variantClass: "touch-btn--jump",
  },
  dash: {
    id: "dash",
    name: "Dash",
    baseSize: 56,
    variantClass: "touch-btn--dash",
  },
  grenade: {
    id: "grenade",
    name: "Grenade",
    baseSize: 54,
    variantClass: "touch-btn--grenade",
  },
  melee: {
    id: "melee",
    name: "Katana Melee",
    baseSize: 52,
    variantClass: "touch-btn--melee",
  },
  reload: {
    id: "reload",
    name: "Reload",
    baseSize: 48,
    variantClass: "touch-btn--reload",
  },
  quickChat: {
    id: "quickChat",
    name: "Quick Chat",
    baseSize: 46,
    variantClass: "touch-btn--quickchat",
  },
};

export const HUD_PRESET_LAYOUTS: Record<HudLayoutPreset, HudControlMap> = {
  two_thumb: {
    joystick: { x: 14, y: 74, scale: 1.0, opacity: 0.85 },
    firePrimary: { x: 86, y: 72, scale: 1.12, opacity: 0.92 },
    fireClaw: { x: 11, y: 28, scale: 0.85, opacity: 0.62 },
    jump: { x: 73, y: 80, scale: 1.0, opacity: 0.88 },
    dash: { x: 88, y: 48, scale: 1.0, opacity: 0.88 },
    grenade: { x: 76, y: 56, scale: 0.96, opacity: 0.88 },
    melee: { x: 65, y: 66, scale: 0.94, opacity: 0.86 },
    reload: { x: 61, y: 83, scale: 0.92, opacity: 0.84 },
    quickChat: { x: 92, y: 28, scale: 0.88, opacity: 0.8 },
  },
  three_claw: {
    joystick: { x: 15, y: 76, scale: 1.0, opacity: 0.84 },
    firePrimary: { x: 88, y: 78, scale: 0.95, opacity: 0.78 },
    fireClaw: { x: 13, y: 24, scale: 1.24, opacity: 0.94 },
    jump: { x: 77, y: 74, scale: 1.04, opacity: 0.9 },
    dash: { x: 88, y: 53, scale: 1.02, opacity: 0.9 },
    grenade: { x: 75, y: 52, scale: 0.96, opacity: 0.88 },
    melee: { x: 66, y: 64, scale: 0.94, opacity: 0.86 },
    reload: { x: 66, y: 84, scale: 0.92, opacity: 0.84 },
    quickChat: { x: 92, y: 28, scale: 0.88, opacity: 0.8 },
  },
  four_claw: {
    joystick: { x: 15, y: 76, scale: 1.0, opacity: 0.84 },
    firePrimary: { x: 88, y: 78, scale: 0.9, opacity: 0.74 },
    fireClaw: { x: 13, y: 22, scale: 1.26, opacity: 0.94 },
    jump: { x: 87, y: 23, scale: 1.12, opacity: 0.92 },
    dash: { x: 75, y: 25, scale: 1.08, opacity: 0.92 },
    grenade: { x: 88, y: 52, scale: 0.98, opacity: 0.88 },
    melee: { x: 76, y: 66, scale: 0.96, opacity: 0.88 },
    reload: { x: 75, y: 84, scale: 0.92, opacity: 0.84 },
    quickChat: { x: 25, y: 24, scale: 0.88, opacity: 0.8 },
  },
};

const STORAGE_KEY = "upgun_hud_layout_v1";

interface PersistedHudLayout {
  preset: HudLayoutPreset;
  controls: HudControlMap;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function cloneControlMap(map: HudControlMap): HudControlMap {
  const out = {} as HudControlMap;
  for (const id of HUD_CONTROL_IDS) {
    out[id] = { ...map[id] };
  }
  return out;
}

function sanitizePlacement(
  raw: Partial<HudControlPlacement> | undefined,
  fallback: HudControlPlacement,
): HudControlPlacement {
  const x = typeof raw?.x === "number" && Number.isFinite(raw.x) ? raw.x : fallback.x;
  const y = typeof raw?.y === "number" && Number.isFinite(raw.y) ? raw.y : fallback.y;
  const scale =
    typeof raw?.scale === "number" && Number.isFinite(raw.scale)
      ? raw.scale
      : fallback.scale;
  const opacity =
    typeof raw?.opacity === "number" && Number.isFinite(raw.opacity)
      ? raw.opacity
      : fallback.opacity;

  return {
    x: round2(clamp(x, 4, 96)),
    y: round2(clamp(y, 8, 92)),
    scale: round2(clamp(scale, 0.6, 1.6)),
    opacity: round2(clamp(opacity, 0.3, 1.0)),
  };
}

function sanitizePreset(raw: unknown): HudLayoutPreset {
  if (raw === "two_thumb" || raw === "three_claw" || raw === "four_claw") {
    return raw;
  }
  return "two_thumb";
}

function loadInitialLayout(): PersistedHudLayout {
  const fallback: PersistedHudLayout = {
    preset: "two_thumb",
    controls: cloneControlMap(HUD_PRESET_LAYOUTS.two_thumb),
  };

  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedHudLayout>;
    const preset = sanitizePreset(parsed.preset);
    const presetBase = HUD_PRESET_LAYOUTS[preset];
    const controls = {} as HudControlMap;
    for (const id of HUD_CONTROL_IDS) {
      controls[id] = sanitizePlacement(parsed.controls?.[id], presetBase[id]);
    }
    return { preset, controls };
  } catch {
    return fallback;
  }
}

function persistLayout(data: PersistedHudLayout): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore private-mode or quota errors
  }
}

export interface HudLayoutStoreState {
  preset: HudLayoutPreset;
  controls: HudControlMap;
  editorOpen: boolean;
  selectedControl: HudControlId | null;
  setEditorOpen: (open: boolean) => void;
  setSelectedControl: (id: HudControlId | null) => void;
  updateControl: (id: HudControlId, patch: Partial<HudControlPlacement>) => void;
  applyPreset: (preset: HudLayoutPreset) => void;
  resetLayout: () => void;
}

const initial = loadInitialLayout();

export const useHudLayoutStore = create<HudLayoutStoreState>((set, get) => ({
  preset: initial.preset,
  controls: initial.controls,
  editorOpen: false,
  selectedControl: null,

  setEditorOpen: (editorOpen) =>
    set((state) => ({
      editorOpen,
      selectedControl: editorOpen ? state.selectedControl ?? "firePrimary" : null,
    })),

  setSelectedControl: (selectedControl) => set({ selectedControl }),

  updateControl: (id, patch) => {
    const current = get();
    const nextPlacement = sanitizePlacement(
      { ...current.controls[id], ...patch },
      current.controls[id],
    );
    const nextControls: HudControlMap = {
      ...current.controls,
      [id]: nextPlacement,
    };
    set({ controls: nextControls });
    persistLayout({ preset: current.preset, controls: nextControls });
  },

  applyPreset: (preset) => {
    const valid = sanitizePreset(preset);
    const controls = cloneControlMap(HUD_PRESET_LAYOUTS[valid]);
    set({ preset: valid, controls });
    persistLayout({ preset: valid, controls });
  },

  resetLayout: () => {
    const preset = get().preset;
    const controls = cloneControlMap(HUD_PRESET_LAYOUTS[preset]);
    set({ controls });
    persistLayout({ preset, controls });
  },
}));

export const hudLayoutStore = useHudLayoutStore;
