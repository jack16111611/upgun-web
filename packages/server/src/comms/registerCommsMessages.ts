import type { Client } from "colyseus";
import { NET_MSG, type VoiceSpeakingEvent } from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";
import type { CommsSystem } from "./CommsSystem";

export interface CommsMessageDeps {
  onMessage: (type: string, handler: (client: Client, payload: unknown) => void) => void;
  broadcast: (type: string, message: unknown) => void;
  getClientById: (sessionId: string) => Client | undefined;
  players: Map<string, PlayerEntity>;
  commsSystem: CommsSystem;
}

export function registerCommsMessages(deps: CommsMessageDeps): void {
  deps.onMessage(NET_MSG.CHAT_MESSAGE, (client, rawPayload) => {
    const player = deps.players.get(client.sessionId);
    if (!player) return;
    const rawText =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.text;
    const event = deps.commsSystem.handleChatMessage(
      client.sessionId,
      player.schema.displayName,
      player.schema.bodyColor || player.schema.color,
      rawText,
    );
    if (event) {
      deps.broadcast(NET_MSG.CHAT_MESSAGE, event);
    }
  });

  deps.onMessage(NET_MSG.QUICK_CHAT, (client, rawPayload) => {
    const player = deps.players.get(client.sessionId);
    if (!player) return;
    const rawId =
      typeof rawPayload === "string"
        ? rawPayload
        : (rawPayload as Record<string, unknown> | null)?.calloutId;
    const event = deps.commsSystem.handleQuickChat(
      client.sessionId,
      player.schema.displayName,
      rawId,
    );
    if (event) {
      deps.broadcast(NET_MSG.QUICK_CHAT, event);
    }
  });

  deps.onMessage(NET_MSG.WEBRTC_JOIN, (client) => {
    const existingPeers = deps.commsSystem.handleVoiceJoin(client.sessionId);
    client.send(NET_MSG.WEBRTC_JOIN, { peers: existingPeers });
  });

  deps.onMessage(NET_MSG.WEBRTC_LEAVE, (client) => {
    if (deps.commsSystem.handleVoiceLeave(client.sessionId)) {
      deps.broadcast(NET_MSG.WEBRTC_LEAVE, { sessionId: client.sessionId });
    }
  });

  for (const signalType of [NET_MSG.WEBRTC_OFFER, NET_MSG.WEBRTC_ANSWER, NET_MSG.WEBRTC_ICE]) {
    deps.onMessage(signalType, (client, rawPayload) => {
      const validated = deps.commsSystem.validateSignalTarget(client.sessionId, rawPayload);
      if (!validated) return;
      const targetClient = deps.getClientById(validated.to);
      targetClient?.send(signalType, validated);
    });
  }

  deps.onMessage(NET_MSG.VOICE_SPEAKING, (client, rawPayload) => {
    if (!deps.commsSystem.isVoicePeer(client.sessionId)) return;
    const speaking =
      typeof rawPayload === "boolean"
        ? rawPayload
        : Boolean((rawPayload as Record<string, unknown> | null)?.speaking);
    deps.broadcast(NET_MSG.VOICE_SPEAKING, {
      sessionId: client.sessionId,
      speaking,
    } satisfies VoiceSpeakingEvent);
  });
}
