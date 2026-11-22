import { create } from "zustand";

const DEFAULT_PROD_SERVER_URL = "wss://upgun-server.onrender.com";
const PROBE_TIMEOUT_MS = 4000;
const RETRY_INTERVAL_MS = 1500;
const MAX_WAKE_DURATION_MS = 60_000;
const FRESH_READY_WINDOW_MS = 15_000;

export type ServerWakePhase = "idle" | "waking" | "ready" | "error";

export interface ServerWakeState {
  wakePhase: ServerWakePhase;
  wakeElapsedSec: number;
  serverPingMs: number | null;
  lastError: string | null;
}

export interface HealthProbeResult {
  ok: boolean;
  pingMs: number | null;
  error: string | null;
}

function getFallbackServerUrl(): string {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "ws://localhost:2567";
  }
  return DEFAULT_PROD_SERVER_URL;
}

function normalizeWsServerUrl(raw: unknown): string {
  const fallback = getFallbackServerUrl();
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return fallback;
  }
  const normalized = value
    .replace(/^https:\/\//i, "wss://")
    .replace(/^http:\/\//i, "ws://")
    .replace(/\/+$/, "");
  return normalized || fallback;
}

export const SERVER_URL = normalizeWsServerUrl(import.meta.env.VITE_SERVER_URL);

export const HTTP_SERVER_URL = SERVER_URL
  .replace(/^wss:\/\//i, "https://")
  .replace(/^ws:\/\//i, "http://")
  .replace(/\/+$/, "");

const HEALTH_URL = `${HTTP_SERVER_URL}/health`;

export const useServerWakeStore = create<ServerWakeState>(() => ({
  wakePhase: "idle",
  wakeElapsedSec: 0,
  serverPingMs: null,
  lastError: null,
}));

let lastReadyAtMs = 0;
let activeWakePromise: Promise<boolean> | null = null;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchHealthOnce(): Promise<HealthProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const startedAt = nowMs();

  try {
    const response = await fetch(HEALTH_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const pingMs = Math.max(1, Math.round(nowMs() - startedAt));
    if (response.ok) {
      return { ok: true, pingMs, error: null };
    }
    return { ok: false, pingMs: null, error: `Server responded with HTTP ${response.status}` };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, pingMs: null, error: "Server health check timed out" };
    }
    const message = err instanceof Error && err.message ? err.message : "Network error";
    return { ok: false, pingMs: null, error: message };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function probeServerHealthOnce(): Promise<HealthProbeResult> {
  if (activeWakePromise) {
    const state = useServerWakeStore.getState();
    return {
      ok: state.wakePhase === "ready",
      pingMs: state.serverPingMs,
      error: state.lastError,
    };
  }

  const prev = useServerWakeStore.getState();
  const startedAt = Date.now();
  let tickTimer: ReturnType<typeof setInterval> | null = null;

  if (prev.wakePhase !== "ready") {
    useServerWakeStore.setState({
      wakePhase: "waking",
      wakeElapsedSec: 0,
      lastError: null,
    });
    tickTimer = setInterval(() => {
      if (activeWakePromise) return;
      useServerWakeStore.setState({
        wakeElapsedSec: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      });
    }, 250);
  }

  const result = await fetchHealthOnce();
  if (tickTimer !== null) {
    clearInterval(tickTimer);
  }

  if (activeWakePromise) {
    return result;
  }

  if (result.ok) {
    lastReadyAtMs = Date.now();
    useServerWakeStore.setState({
      wakePhase: "ready",
      wakeElapsedSec: 0,
      serverPingMs: result.pingMs,
      lastError: null,
    });
  } else {
    useServerWakeStore.setState({
      wakePhase: "idle",
      wakeElapsedSec: 0,
      lastError: result.error,
    });
  }

  return result;
}

export async function ensureServerAwake(): Promise<boolean> {
  const current = useServerWakeStore.getState();
  if (current.wakePhase === "ready" && Date.now() - lastReadyAtMs < FRESH_READY_WINDOW_MS) {
    return true;
  }

  if (activeWakePromise) {
    return activeWakePromise;
  }

  activeWakePromise = (async () => {
    const startedAt = Date.now();
    useServerWakeStore.setState({
      wakePhase: "waking",
      wakeElapsedSec: 0,
      lastError: null,
    });

    const elapsedTimer = setInterval(() => {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      useServerWakeStore.setState({ wakeElapsedSec: elapsedSec });
    }, 250);

    try {
      let lastError: string | null = null;

      while (Date.now() - startedAt < MAX_WAKE_DURATION_MS) {
        const result = await fetchHealthOnce();
        if (result.ok) {
          lastReadyAtMs = Date.now();
          useServerWakeStore.setState({
            wakePhase: "ready",
            wakeElapsedSec: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
            serverPingMs: result.pingMs,
            lastError: null,
          });
          return true;
        }

        lastError = result.error;
        const remainingMs = MAX_WAKE_DURATION_MS - (Date.now() - startedAt);
        if (remainingMs <= 0) {
          break;
        }
        await sleep(Math.min(RETRY_INTERVAL_MS, remainingMs));
      }

      const timeoutMsg =
        lastError
          ? `Game server failed to wake within 60s (${lastError}).`
          : "Game server did not respond within 60s.";
      useServerWakeStore.setState({
        wakePhase: "error",
        wakeElapsedSec: Math.round(MAX_WAKE_DURATION_MS / 1000),
        serverPingMs: null,
        lastError: timeoutMsg,
      });
      throw new Error(timeoutMsg);
    } finally {
      clearInterval(elapsedTimer);
      activeWakePromise = null;
    }
  })();

  return activeWakePromise;
}
