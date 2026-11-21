import { create } from "zustand";
import type { KillerHighlightEvent } from "@upgun/shared";

export type SpectatorMode = "follow" | "freefly";

export type ActiveKillerHighlight = KillerHighlightEvent & {
  untilMs: number;
};

export const KILLER_FOCUS_DURATION_MS = 1500;

export interface SpectatorStoreState {
  mode: SpectatorMode;
  targetSessionId: string | null;
  killerHighlight: ActiveKillerHighlight | null;
  setMode: (mode: SpectatorMode) => void;
  toggleMode: () => void;
  setTargetSessionId: (sessionId: string | null) => void;
  cycleTarget: (direction: 1 | -1, aliveIds: string[]) => void;
  triggerKillerHighlight: (ev: KillerHighlightEvent) => void;
  clearExpiredKillerHighlight: (nowMs?: number) => void;
  resetSpectator: () => void;
}

export const useSpectatorStore = create<SpectatorStoreState>((set) => ({
  mode: "follow",
  targetSessionId: null,
  killerHighlight: null,

  setMode: (mode) => set({ mode }),

  toggleMode: () =>
    set((state) => ({
      mode: state.mode === "follow" ? "freefly" : "follow",
    })),

  setTargetSessionId: (targetSessionId) => set({ targetSessionId }),

  cycleTarget: (direction, aliveIds) =>
    set((state) => {
      if (aliveIds.length === 0) {
        return { targetSessionId: null };
      }

      const currentIdx = state.targetSessionId
        ? aliveIds.indexOf(state.targetSessionId)
        : -1;

      if (currentIdx === -1) {
        const fallback =
          direction >= 0
            ? (aliveIds[0] ?? null)
            : (aliveIds[aliveIds.length - 1] ?? null);
        return { targetSessionId: fallback };
      }

      const nextIdx = (currentIdx + direction + aliveIds.length) % aliveIds.length;
      return { targetSessionId: aliveIds[nextIdx] ?? null };
    }),

  triggerKillerHighlight: (ev) =>
    set((state) => {
      const nextTarget =
        ev.killerId && ev.killerId !== ev.victimId
          ? ev.killerId
          : state.targetSessionId;
      return {
        killerHighlight: {
          ...ev,
          untilMs: performance.now() + KILLER_FOCUS_DURATION_MS,
        },
        targetSessionId: nextTarget,
      };
    }),

  clearExpiredKillerHighlight: (nowMs = performance.now()) =>
    set((state) => {
      if (!state.killerHighlight || nowMs < state.killerHighlight.untilMs) {
        return state;
      }
      return { killerHighlight: null };
    }),

  resetSpectator: () =>
    set({
      mode: "follow",
      targetSessionId: null,
      killerHighlight: null,
    }),
}));
