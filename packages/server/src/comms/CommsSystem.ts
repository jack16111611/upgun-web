import {
  QUICK_CHAT_CALLOUTS,
  type ChatMessageEvent,
  type QuickChatCallout,
  type QuickChatEvent,
  type WebRTCSignalPayload,
} from "@upgun/shared";
import { sanitizeChatText } from "./chatFilter";

export const CHAT_RATE_LIMIT_MS = 600;

const QUICK_CHAT_MAP = new Map<string, QuickChatCallout>(
  QUICK_CHAT_CALLOUTS.map((callout) => [callout.id, callout]),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Authoritative server communications coordinator for text chat,
 * quick-chat callouts, rate limiting, and WebRTC voice peer signaling.
 */
export class CommsSystem {
  public readonly voicePeers = new Set<string>();
  private readonly lastMessageAt = new Map<string, number>();
  private nextMessageSeq = 0;

  private canSendMessage(sessionId: string, now: number): boolean {
    const prev = this.lastMessageAt.get(sessionId);
    if (prev !== undefined && now - prev < CHAT_RATE_LIMIT_MS) {
      return false;
    }
    this.lastMessageAt.set(sessionId, now);
    return true;
  }

  public handleChatMessage(
    sessionId: string,
    senderName: string,
    senderColor: string,
    rawText: unknown,
  ): ChatMessageEvent | null {
    const cleanText = sanitizeChatText(rawText);
    if (cleanText === null) {
      return null;
    }

    const now = Date.now();
    if (!this.canSendMessage(sessionId, now)) {
      return null;
    }

    const safeName = senderName.trim() || "Player";
    const safeColor = senderColor.trim() || "#38bdf8";

    return {
      id: `chat_${now}_${++this.nextMessageSeq}`,
      senderId: sessionId,
      senderName: safeName,
      senderColor: safeColor,
      text: cleanText,
      timestamp: now,
    };
  }

  public handleQuickChat(
    sessionId: string,
    senderName: string,
    rawCalloutId: unknown,
  ): QuickChatEvent | null {
    if (typeof rawCalloutId !== "string") {
      return null;
    }
    const callout = QUICK_CHAT_MAP.get(rawCalloutId);
    if (!callout) {
      return null;
    }

    const now = Date.now();
    if (!this.canSendMessage(sessionId, now)) {
      return null;
    }

    const safeName = senderName.trim() || "Player";

    return {
      senderId: sessionId,
      senderName: safeName,
      calloutId: callout.id,
      text: `${callout.icon} ${callout.label}`,
      timestamp: now,
    };
  }

  /**
   * Registers a session in the voice mesh and returns the list of existing
   * voice peer sessionIds that the joining peer should establish offers to.
   */
  public handleVoiceJoin(sessionId: string): string[] {
    const existingPeers: string[] = [];
    for (const peerId of this.voicePeers) {
      if (peerId !== sessionId) {
        existingPeers.push(peerId);
      }
    }
    this.voicePeers.add(sessionId);
    return existingPeers;
  }

  public handleVoiceLeave(sessionId: string): boolean {
    return this.voicePeers.delete(sessionId);
  }

  public isVoicePeer(sessionId: string): boolean {
    return this.voicePeers.has(sessionId);
  }

  public getVoicePeers(): string[] {
    return Array.from(this.voicePeers);
  }

  /**
   * Validates an incoming WebRTC offer/answer/ICE relay payload.
   * Ensures both sender and target are active voice peers, rejects self-signals,
   * and stamps authoritative `from: fromId`.
   */
  public validateSignalTarget(
    fromId: string,
    rawPayload: unknown,
  ): WebRTCSignalPayload | null {
    if (!this.voicePeers.has(fromId) || !isRecord(rawPayload)) {
      return null;
    }

    const to = rawPayload["to"];
    if (typeof to !== "string" || to.length === 0 || to === fromId) {
      return null;
    }

    if (!this.voicePeers.has(to)) {
      return null;
    }

    const hasSdp = "sdp" in rawPayload && rawPayload["sdp"] !== undefined;
    const hasCandidate =
      "candidate" in rawPayload && rawPayload["candidate"] !== undefined;

    if (!hasSdp && !hasCandidate) {
      return null;
    }

    const validated: WebRTCSignalPayload = {
      from: fromId,
      to,
    };

    if (hasSdp) {
      validated.sdp = rawPayload["sdp"];
    }
    if (hasCandidate) {
      validated.candidate = rawPayload["candidate"];
    }

    return validated;
  }

  public removeSession(sessionId: string): boolean {
    this.lastMessageAt.delete(sessionId);
    return this.voicePeers.delete(sessionId);
  }
}
