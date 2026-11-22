import { Client, type Room } from "@colyseus/sdk";
import {
  ARENA_ROOM_NAME,
  NET_MSG,
  ROOM_CODE_LENGTH,
  sanitizeDisplayName,
  sanitizeRoomCode,
  type BotDifficulty,
  type CheatCodeId,
  type DeviceType,
  type GameMode,
  type HatId,
  type InputFrame,
  type JoinRoomOptions,
  type WebRTCSignalPayload,
} from "@upgun/shared";
import { resetArenaPropsRuntime } from "../components/arena";
import { commsStore, voiceChatManager } from "../components/comms";
import { clearAnnouncementBanners } from "../components/match";
import { useSpectatorStore } from "../components/spectator";
import { resetJuiceBus } from "../effects";
import { resetWorldRuntime, worldRuntime } from "../game/worldRuntime";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { attachRoomEventListeners } from "./roomEventListeners";
import { ensureServerAwake, probeServerHealthOnce, SERVER_URL } from "./serverWakeup";
import { ArenaStateSync, type RawArenaState } from "./stateSync";

export { SERVER_URL } from "./serverWakeup";

const client = new Client(SERVER_URL);
const stateSync = new ArenaStateSync();

if (typeof window !== "undefined") {
  void probeServerHealthOnce();
}

let activeRoom: Room | null = null;
let connectionSeq = 0;

function getJoinOptions(isPrivate: boolean): JoinRoomOptions {
  const settings = useSettingsStore.getState();
  const nickname = sanitizeDisplayName(settings.nickname, "Player");
  const deviceType = useGameStore.getState().activeDevice;
  return {
    displayName: nickname,
    deviceType,
    isPrivate,
    hatId: settings.hatId,
    bodyColor: settings.bodyColor,
    gameMode: settings.preferredGameMode,
    botDifficulty: settings.preferredBotDifficulty,
  };
}

function updateRoomUrlParam(code: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (code) {
    url.searchParams.set("room", code);
  } else {
    url.searchParams.delete("room");
  }
  window.history.replaceState({}, "", url.toString());
}

function resetClientRoomSession(): void {
  voiceChatManager.disconnect();
  voiceChatManager.setCallbacks(null, null);
  commsStore.getState().resetComms();
  useSpectatorStore.getState().resetSpectator();
  resetWorldRuntime();
  resetJuiceBus();
  resetArenaPropsRuntime();
  clearAnnouncementBanners();
  stateSync.reset();
}

async function leaveActiveRoomSilent(): Promise<void> {
  if (!activeRoom) {
    return;
  }
  const room = activeRoom;
  activeRoom = null;
  resetClientRoomSession();
  try {
    await room.leave();
  } catch {
    // Ignore leave errors when switching rooms
  }
}

function attachRoomListeners(room: Room, token: number, isPrivate: boolean): void {
  activeRoom = room;
  stateSync.reset();

  worldRuntime.room = room;
  worldRuntime.localSessionId = room.sessionId;
  useGameStore.getState().setConnected(room.sessionId, room.roomId, isPrivate);

  room.onStateChange((state: RawArenaState) => {
    if (token !== connectionSeq) {
      return;
    }
    stateSync.apply(room, state);
  });

  attachRoomEventListeners(room);

  room.onLeave(() => {
    if (activeRoom === room) {
      activeRoom = null;
      resetClientRoomSession();
      useGameStore.getState().setIdle(null);
      useGameStore.getState().setLobbyOpen(true);
    }
  });
}

async function runConnection(
  openRoom: () => Promise<Room<RawArenaState>>,
  options: { isPrivate: boolean; closeLobbyOnSuccess: boolean; syncUrlCode: boolean },
): Promise<boolean> {
  const token = ++connectionSeq;
  await leaveActiveRoomSilent();
  if (token !== connectionSeq) {
    return false;
  }

  useGameStore.getState().setConnecting();

  try {
    // Probes ${HTTP_SERVER_URL}/api/status; exits immediately and falls through
    // to direct Colyseus connection if blocked by an ad-blocker/extension (<250ms).
    await ensureServerAwake();
    if (token !== connectionSeq) {
      return false;
    }

    const room = await openRoom();
    if (token !== connectionSeq) {
      void room.leave();
      return false;
    }

    attachRoomListeners(room, token, options.isPrivate);
    updateRoomUrlParam(options.syncUrlCode ? room.roomId : null);

    if (options.closeLobbyOnSuccess) {
      useGameStore.getState().setLobbyOpen(false);
    }
    return true;
  } catch (err: unknown) {
    if (token !== connectionSeq) {
      return false;
    }
    const msg =
      err instanceof Error && err.message
        ? err.message
        : `Could not connect to server at ${SERVER_URL}.`;
    useGameStore.getState().setIdle(msg);
    useGameStore.getState().setLobbyOpen(true);
    return false;
  }
}

export function sendInputFrame(frame: InputFrame): void {
  worldRuntime.room?.send(NET_MSG.INPUT, frame);
}

export function sendStartSoloPractice(): void {
  worldRuntime.room?.send(NET_MSG.START_SOLO_PRACTICE);
}

export function sendDeviceType(deviceType: DeviceType): void {
  worldRuntime.room?.send(NET_MSG.SET_DEVICE_TYPE, deviceType);
}

export function sendCosmetics(hatId: HatId, bodyColor: string): void {
  worldRuntime.room?.send(NET_MSG.SET_COSMETICS, { hatId, bodyColor });
}

export function sendPickCard(cardId: string): void {
  worldRuntime.room?.send(NET_MSG.PICK_CARD, { cardId });
}

export function sendRerollDraft(): void {
  worldRuntime.room?.send(NET_MSG.REROLL_DRAFT);
}

export function sendCheatCommand(code: CheatCodeId): void {
  worldRuntime.room?.send(NET_MSG.CHEAT_COMMAND, { code });
}

export function sendSandboxGrantCard(cardId: string): void {
  worldRuntime.room?.send(NET_MSG.SANDBOX_GRANT_CARD, { cardId });
}

export function sendAddBot(): void {
  worldRuntime.room?.send(NET_MSG.ADD_BOT);
}

export function sendPlayAgain(): void {
  worldRuntime.room?.send(NET_MSG.PLAY_AGAIN);
}

export function sendGameMode(gameMode: GameMode): void {
  worldRuntime.room?.send(NET_MSG.SET_GAME_MODE, { gameMode });
}

export function sendBotDifficulty(botDifficulty: BotDifficulty): void {
  worldRuntime.room?.send(NET_MSG.SET_BOT_DIFFICULTY, { botDifficulty });
}

export function sendChatMessage(text: string): void {
  worldRuntime.room?.send(NET_MSG.CHAT_MESSAGE, { text });
}

export function sendQuickChat(calloutId: string): void {
  worldRuntime.room?.send(NET_MSG.QUICK_CHAT, { calloutId });
}

export function sendVoiceJoin(): void {
  worldRuntime.room?.send(NET_MSG.WEBRTC_JOIN);
}

export function sendVoiceLeave(): void {
  worldRuntime.room?.send(NET_MSG.WEBRTC_LEAVE);
}

export function sendVoiceSignal(
  type: "offer" | "answer" | "ice",
  payload: WebRTCSignalPayload,
): void {
  const msgType =
    type === "offer"
      ? NET_MSG.WEBRTC_OFFER
      : type === "answer"
        ? NET_MSG.WEBRTC_ANSWER
        : NET_MSG.WEBRTC_ICE;
  worldRuntime.room?.send(msgType, payload);
}

export function sendVoiceSpeaking(speaking: boolean): void {
  worldRuntime.room?.send(NET_MSG.VOICE_SPEAKING, { speaking });
}

export async function connectQuickPlay(): Promise<boolean> {
  return runConnection(
    () => client.joinOrCreate<RawArenaState>(ARENA_ROOM_NAME, getJoinOptions(false)),
    { isPrivate: false, closeLobbyOnSuccess: true, syncUrlCode: false },
  );
}

export async function connectCreatePrivate(): Promise<boolean> {
  return runConnection(
    () => client.create<RawArenaState>(ARENA_ROOM_NAME, getJoinOptions(true)),
    { isPrivate: true, closeLobbyOnSuccess: false, syncUrlCode: true },
  );
}

export async function connectJoinByCode(rawCode: string): Promise<boolean> {
  const code = sanitizeRoomCode(rawCode);
  if (code.length !== ROOM_CODE_LENGTH) {
    useGameStore
      .getState()
      .setIdle(`Enter a valid ${ROOM_CODE_LENGTH}-letter room code.`);
    return false;
  }

  return runConnection(
    () => client.joinById<RawArenaState>(code, getJoinOptions(false)),
    { isPrivate: false, closeLobbyOnSuccess: true, syncUrlCode: true },
  );
}

export async function connectSoloPractice(): Promise<boolean> {
  const store = useGameStore.getState();
  if (
    store.status === "connected" &&
    store.humanCount === 1 &&
    !store.hasDummy &&
    worldRuntime.room
  ) {
    sendStartSoloPractice();
    store.setLobbyOpen(false);
    return true;
  }

  const ok = await runConnection(
    () => client.create<RawArenaState>(ARENA_ROOM_NAME, getJoinOptions(true)),
    { isPrivate: true, closeLobbyOnSuccess: true, syncUrlCode: false },
  );
  if (ok) {
    sendStartSoloPractice();
  }
  return ok;
}

export async function leaveCurrentRoom(): Promise<void> {
  connectionSeq += 1;
  await leaveActiveRoomSilent();
  updateRoomUrlParam(null);
  useGameStore.getState().setIdle(null);
  useGameStore.getState().setLobbyOpen(true);
}

export function autoJoinFromUrl(): void {
  if (typeof window === "undefined") {
    return;
  }
  const param = new URLSearchParams(window.location.search).get("room");
  if (!param) {
    return;
  }
  const code = sanitizeRoomCode(param);
  if (code.length === ROOM_CODE_LENGTH) {
    void connectJoinByCode(code);
  }
}