import { useEffect, type CSSProperties } from "react";
import { create } from "zustand";
import type { AnnouncementEvent } from "@upgun/shared";
import { playAnnouncementChime } from "./announcerSfx";
import "./match.css";

const BANNER_DURATION_MS = 2200;
const MAX_QUEUED_BANNERS = 6;
const DEFAULT_HITSTOP_MS = 45;
const MAX_HITSTOP_MS = 160;
const HITSTOP_TIME_SCALE = 0.08;

interface QueuedBanner {
  id: number;
  event: AnnouncementEvent;
}

interface BannerStoreState {
  active: QueuedBanner | null;
  queue: QueuedBanner[];
  push: (event: AnnouncementEvent) => void;
  advance: (completedId: number) => void;
  clear: () => void;
}

let nextBannerId = 1;

const useBannerStore = create<BannerStoreState>((set) => ({
  active: null,
  queue: [],
  push: (event) =>
    set((state) => {
      const entry: QueuedBanner = { id: nextBannerId++, event };
      if (!state.active) {
        return { active: entry, queue: state.queue };
      }
      const nextQueue = [...state.queue, entry];
      if (nextQueue.length > MAX_QUEUED_BANNERS) {
        nextQueue.splice(0, nextQueue.length - MAX_QUEUED_BANNERS);
      }
      return { active: state.active, queue: nextQueue };
    }),
  advance: (completedId) =>
    set((state) => {
      if (state.active?.id !== completedId) {
        return state;
      }
      const [nextActive, ...rest] = state.queue;
      return {
        active: nextActive ?? null,
        queue: rest,
      };
    }),
  clear: () => set({ active: null, queue: [] }),
}));

export function pushAnnouncementBanner(event: AnnouncementEvent): void {
  useBannerStore.getState().push(event);
}

export function clearAnnouncementBanners(): void {
  useBannerStore.getState().clear();
}

let hitstopRemainingMs = 0;

export function triggerHitstopMs(ms = DEFAULT_HITSTOP_MS): void {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }
  hitstopRemainingMs = Math.min(MAX_HITSTOP_MS, Math.max(hitstopRemainingMs, ms));
}

export function consumeHitstopScale(dt: number): number {
  if (hitstopRemainingMs <= 0) {
    return 1;
  }
  const dtMs = Number.isFinite(dt) && dt > 0 ? dt * 1000 : 0;
  if (dtMs <= 0) {
    return HITSTOP_TIME_SCALE;
  }
  if (dtMs >= hitstopRemainingMs) {
    const frozenRatio = hitstopRemainingMs / dtMs;
    hitstopRemainingMs = 0;
    return frozenRatio * HITSTOP_TIME_SCALE + (1 - frozenRatio);
  }
  hitstopRemainingMs -= dtMs;
  return HITSTOP_TIME_SCALE;
}

export interface KillstreakBannerProps {
  soundGain?: number;
}

export function KillstreakBanner({ soundGain = 0.28 }: KillstreakBannerProps) {
  const active = useBannerStore((s) => s.active);
  const advance = useBannerStore((s) => s.advance);

  useEffect(() => {
    if (!active) {
      return;
    }
    playAnnouncementChime(active.event.banner, soundGain);
    const timer = window.setTimeout(() => {
      advance(active.id);
    }, BANNER_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, advance, soundGain]);

  if (!active) {
    return null;
  }

  const accent = active.event.accent || "#38bdf8";
  const bannerStyle = {
    "--banner-accent": accent,
  } as CSSProperties;

  return (
    <div
      className="ks-banner-layer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div key={active.id} className="ks-banner" style={bannerStyle}>
        <div className="ks-banner__title">{active.event.banner}</div>
        <div className="ks-banner__underline" aria-hidden="true" />
        {active.event.subtitle && (
          <div className="ks-banner__subtitle">{active.event.subtitle}</div>
        )}
      </div>
    </div>
  );
}
