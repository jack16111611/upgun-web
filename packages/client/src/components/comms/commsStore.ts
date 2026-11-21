import { create } from "zustand";
import type { ChatMessageEvent, QuickChatEvent } from "@upgun/shared";

export const MAX_CHAT_HISTORY = 40;
export const SPEECH_BUBBLE_DURATION_MS = 3000;

export interface SpeechBubbleEntry {
  text: string;
  calloutId: string;
  expiresAt: number;
}

export interface CommsChatEntry extends ChatMessageEvent {
  isQuickChat?: boolean;
  calloutId?: string;
}

export interface CommsStoreState {
  chatMessages: CommsChatEntry[];
  lastChatActivityAt: number;
  activeSpeechBubbles: Record<string, SpeechBubbleEntry>;
  speakingPeers: Record<string, boolean>;
  mutedPeers: Record<string, boolean>;
  micConnected: boolean;
  micMuted: boolean;
  pttEnabled: boolean;
  pttHeld: boolean;
  chatInputOpen: boolean;
  quickChatOpen: boolean;
  micError: string | null;
  addChatMessage: (msg: ChatMessageEvent) => void;
  addQuickChat: (ev: QuickChatEvent, senderColor?: string) => void;
  pruneExpiredBubbles: (now?: number) => void;
  setPeerSpeaking: (sessionId: string, speaking: boolean) => void;
  setPeerMuted: (sessionId: string, muted: boolean) => void;
  setMicConnected: (connected: boolean) => void;
  setMicMuted: (muted: boolean) => void;
  setPttEnabled: (enabled: boolean) => void;
  setPttHeld: (held: boolean) => void;
  setChatInputOpen: (open: boolean) => void;
  setQuickChatOpen: (open: boolean) => void;
  setMicError: (error: string | null) => void;
  removePeer: (sessionId: string) => void;
  resetComms: () => void;
}

export const useCommsStore = create<CommsStoreState>((set) => ({
  chatMessages: [],
  lastChatActivityAt: 0,
  activeSpeechBubbles: {},
  speakingPeers: {},
  mutedPeers: {},
  micConnected: false,
  micMuted: false,
  pttEnabled: false,
  pttHeld: false,
  chatInputOpen: false,
  quickChatOpen: false,
  micError: null,

  addChatMessage: (msg) =>
    set((state) => {
      const next = [...state.chatMessages, msg];
      if (next.length > MAX_CHAT_HISTORY) {
        next.splice(0, next.length - MAX_CHAT_HISTORY);
      }
      return {
        chatMessages: next,
        lastChatActivityAt: Date.now(),
      };
    }),

  addQuickChat: (ev, senderColor = "#38bdf8") =>
    set((state) => {
      const now = Date.now();
      const entry: CommsChatEntry = {
        id: `qc_${ev.senderId}_${ev.timestamp}_${Math.random().toString(36).slice(2, 6)}`,
        senderId: ev.senderId,
        senderName: ev.senderName,
        senderColor,
        text: ev.text,
        timestamp: ev.timestamp,
        isQuickChat: true,
        calloutId: ev.calloutId,
      };
      const nextMessages = [...state.chatMessages, entry];
      if (nextMessages.length > MAX_CHAT_HISTORY) {
        nextMessages.splice(0, nextMessages.length - MAX_CHAT_HISTORY);
      }
      return {
        chatMessages: nextMessages,
        lastChatActivityAt: now,
        activeSpeechBubbles: {
          ...state.activeSpeechBubbles,
          [ev.senderId]: {
            text: ev.text,
            calloutId: ev.calloutId,
            expiresAt: now + SPEECH_BUBBLE_DURATION_MS,
          },
        },
      };
    }),

  pruneExpiredBubbles: (now = Date.now()) =>
    set((state) => {
      let changed = false;
      const next: Record<string, SpeechBubbleEntry> = {};
      for (const [id, entry] of Object.entries(state.activeSpeechBubbles)) {
        if (entry.expiresAt > now) {
          next[id] = entry;
        } else {
          changed = true;
        }
      }
      return changed ? { activeSpeechBubbles: next } : state;
    }),

  setPeerSpeaking: (sessionId, speaking) =>
    set((state) => {
      if (Boolean(state.speakingPeers[sessionId]) === speaking) {
        return state;
      }
      const next = { ...state.speakingPeers };
      if (speaking) {
        next[sessionId] = true;
      } else {
        delete next[sessionId];
      }
      return { speakingPeers: next };
    }),

  setPeerMuted: (sessionId, muted) =>
    set((state) => {
      const next = { ...state.mutedPeers };
      if (muted) {
        next[sessionId] = true;
      } else {
        delete next[sessionId];
      }
      return { mutedPeers: next };
    }),

  setMicConnected: (micConnected) => set({ micConnected }),
  setMicMuted: (micMuted) => set({ micMuted }),
  setPttEnabled: (pttEnabled) => set({ pttEnabled }),
  setPttHeld: (pttHeld) => set({ pttHeld }),
  setChatInputOpen: (chatInputOpen) => set({ chatInputOpen }),
  setQuickChatOpen: (quickChatOpen) => set({ quickChatOpen }),
  setMicError: (micError) => set({ micError }),

  removePeer: (sessionId) =>
    set((state) => {
      const nextSpeaking = { ...state.speakingPeers };
      const nextBubbles = { ...state.activeSpeechBubbles };
      delete nextSpeaking[sessionId];
      delete nextBubbles[sessionId];
      return {
        speakingPeers: nextSpeaking,
        activeSpeechBubbles: nextBubbles,
      };
    }),

  resetComms: () =>
    set({
      chatMessages: [],
      lastChatActivityAt: 0,
      activeSpeechBubbles: {},
      speakingPeers: {},
      mutedPeers: {},
      micConnected: false,
      micMuted: false,
      pttEnabled: false,
      pttHeld: false,
      chatInputOpen: false,
      quickChatOpen: false,
      micError: null,
    }),
}));

/** Alias matching `commsStore` naming convention for direct store access. */
export const commsStore = useCommsStore;
