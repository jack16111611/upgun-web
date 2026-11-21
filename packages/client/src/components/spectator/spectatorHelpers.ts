import type { OwnedCard } from "@upgun/shared";
import { worldRuntime, type SyncedPlayerSnapshot } from "../../game/worldRuntime";
import type { RawArenaState } from "../../network/rawStateTypes";
import { useGameStore } from "../../store/gameStore";
import { commsStore } from "../comms";

export const SPECTATOR_BOUNDS = {
  minX: -20,
  maxX: 20,
  minY: 1.2,
  maxY: 22,
  minZ: -20,
  maxZ: 20,
} as const;

export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getLocalRuntimeSnapshot(): SyncedPlayerSnapshot | undefined {
  const localId = worldRuntime.localSessionId;
  return localId ? worldRuntime.players.get(localId) : undefined;
}

export function isRuntimeSpectating(): boolean {
  const localSnap = getLocalRuntimeSnapshot();
  const phase = worldRuntime.phase;
  return (
    worldRuntime.room !== null &&
    localSnap !== undefined &&
    !localSnap.isAlive &&
    phase !== "match_over" &&
    phase !== "lobby"
  );
}

export function isSpectatorInputBlocked(): boolean {
  const game = useGameStore.getState();
  const comms = commsStore.getState();
  if (
    game.lobbyOpen ||
    game.settingsOpen ||
    game.sandboxOpen ||
    comms.chatInputOpen ||
    comms.quickChatOpen ||
    game.phase === "drafting" ||
    game.phase === "match_over"
  ) {
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  ) {
    return true;
  }

  return false;
}

export function getAliveSpectateIds(): string[] {
  const localId = worldRuntime.localSessionId;
  const ids: string[] = [];
  for (const [sessionId, snap] of worldRuntime.players) {
    if (sessionId !== localId && snap.isAlive) {
      ids.push(sessionId);
    }
  }
  ids.sort();
  return ids;
}

export function getSyncedPlayerCards(sessionId: string): OwnedCard[] {
  const rawState = worldRuntime.room?.state as RawArenaState | undefined;
  const rawPlayer = rawState?.players?.get(sessionId);
  if (!rawPlayer?.ownedCards) {
    return [];
  }
  const result: OwnedCard[] = [];
  for (const item of rawPlayer.ownedCards) {
    if (item && typeof item.cardId === "string" && item.cardId.length > 0) {
      result.push({
        cardId: item.cardId,
        level: typeof item.level === "number" && item.level > 0 ? item.level : 1,
      });
    }
  }
  return result;
}

const WEAPON_SOURCE_LABELS: Readonly<Record<string, string>> = {
  rifle: "Rifle",
  grenade: "Grenade",
  splash: "Explosion",
  thorns: "Thorns",
  burn: "Incendiary Burn",
  dash: "Kinetic Dash",
  melee: "Plasma Melee",
};

export function formatWeaponSource(source: string): string {
  return WEAPON_SOURCE_LABELS[source] ?? source;
}
