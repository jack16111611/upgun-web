import type { Client } from "colyseus";
import {
  NET_MSG,
  sanitizeBodyColor,
  sanitizeBotDifficulty,
  sanitizeDeviceType,
  sanitizeGameMode,
  sanitizeHatId,
  sanitizeInputFrame,
  type AnnouncementEvent,
  type BotDifficulty,
  type GameMode,
} from "@upgun/shared";
import type { CheatSystem } from "../cheats";
import { registerCommsMessages, type CommsSystem } from "../comms";
import type { ArenaState } from "../schema/ArenaState";
import type { DraftSystem } from "../systems/DraftSystem";
import type { PlayerEntity } from "../systems/PlayerEntity";

export interface RoomMessageDeps {
  onMessage: (type: string, handler: (client: Client, payload: unknown) => void) => void;
  broadcast: (type: string, message: unknown) => void;
  getClientById: (sessionId: string) => Client | undefined;
  state: ArenaState;
  players: Map<string, PlayerEntity>;
  draftSystem: DraftSystem;
  cheatSystem: CheatSystem;
  commsSystem: CommsSystem;
  getHumanCount: () => number;
  getBotCount: () => number;
  spawnCombatBot: () => boolean;
  onSetGameMode: (mode: GameMode) => void;
  onSetBotDifficulty: (diff: BotDifficulty) => void;
  onPlayAgain: () => void;
}

export function registerArenaRoomMessages(deps: RoomMessageDeps): void {
  deps.onMessage(NET_MSG.INPUT, (client, rawInput) => {
    const entity = deps.players.get(client.sessionId);
    if (entity) entity.latestInput = sanitizeInputFrame(rawInput);
  });

  deps.onMessage(NET_MSG.SET_DEVICE_TYPE, (client, rawDevice) => {
    const entity = deps.players.get(client.sessionId);
    if (entity) entity.schema.deviceType = sanitizeDeviceType(rawDevice);
  });

  deps.onMessage(NET_MSG.SET_COSMETICS, (client, rawPayload) => {
    const entity = deps.players.get(client.sessionId);
    if (!entity || !rawPayload || typeof rawPayload !== "object") return;
    const p = rawPayload as Record<string, unknown>;
    entity.setCosmetics(sanitizeHatId(p.hatId), sanitizeBodyColor(p.bodyColor));
  });

  deps.onMessage(NET_MSG.SET_GAME_MODE, (_client, rawPayload) => {
    if (!deps.state.isPrivate) return;
    const raw =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.gameMode;
    deps.onSetGameMode(sanitizeGameMode(raw));
  });

  deps.onMessage(NET_MSG.SET_BOT_DIFFICULTY, (_client, rawPayload) => {
    if (!deps.state.isPrivate) return;
    const raw =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.botDifficulty;
    deps.onSetBotDifficulty(sanitizeBotDifficulty(raw));
  });

  deps.onMessage(NET_MSG.START_SOLO_PRACTICE, () => {
    if (!deps.state.isPrivate) return;
    deps.state.cheatsEnabled = true;
    if (deps.getBotCount() === 0) deps.spawnCombatBot();
  });

  deps.onMessage(NET_MSG.ADD_BOT, () => {
    if (!deps.state.isPrivate || !deps.state.cheatsEnabled) return;
    deps.spawnCombatBot();
  });

  deps.onMessage(NET_MSG.PICK_CARD, (client, rawPayload) => {
    const entity = deps.players.get(client.sessionId);
    if (entity) deps.draftSystem.handlePickCard(deps.state, entity, rawPayload);
  });

  deps.onMessage(NET_MSG.REROLL_DRAFT, (client) => {
    const entity = deps.players.get(client.sessionId);
    if (entity) deps.draftSystem.handleRerollDraft(deps.state, entity);
  });

  deps.onMessage(NET_MSG.CHEAT_COMMAND, (client, rawPayload) => {
    if (!deps.state.isPrivate || !deps.state.cheatsEnabled) return;
    const entity = deps.players.get(client.sessionId);
    if (!entity) return;
    const code =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.code;
    deps.cheatSystem.executeCheat(deps.state.cheatsEnabled, code, entity, {
      spawnExtraBot: () => deps.spawnCombatBot(),
      announce: (banner, subtitle, accent) => {
        deps.broadcast(NET_MSG.ANNOUNCEMENT_EVENT, {
          banner,
          subtitle,
          actorId: entity.sessionId,
          accent,
        } satisfies AnnouncementEvent);
      },
    });
  });

  deps.onMessage(NET_MSG.SANDBOX_GRANT_CARD, (client, rawPayload) => {
    if (!deps.state.isPrivate || !deps.state.cheatsEnabled) return;
    const entity = deps.players.get(client.sessionId);
    if (!entity) return;
    const cardId =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.cardId;
    deps.cheatSystem.grantSandboxCard(deps.state.cheatsEnabled, cardId, entity);
  });

  deps.onMessage(NET_MSG.PLAY_AGAIN, () => {
    deps.onPlayAgain();
  });

  registerCommsMessages({
    onMessage: deps.onMessage,
    broadcast: deps.broadcast,
    getClientById: deps.getClientById,
    players: deps.players,
    commsSystem: deps.commsSystem,
  });
}
