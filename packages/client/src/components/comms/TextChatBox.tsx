import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { MAX_CHAT_LENGTH } from "@upgun/shared";
import { useCommsStore } from "./commsStore";
import "./comms.css";

const CHAT_AUTO_FADE_MS = 6000;

export interface TextChatBoxProps {
  enabled: boolean;
  showTouchControls?: boolean;
  onSendChat: (text: string) => void;
  onToggleMic?: () => void;
  onToggleMute?: () => void;
  onTogglePtt?: () => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function TextChatBox({
  enabled,
  showTouchControls = false,
  onSendChat,
  onToggleMic,
  onToggleMute,
  onTogglePtt,
}: TextChatBoxProps) {
  const chatMessages = useCommsStore((s) => s.chatMessages);
  const lastChatActivityAt = useCommsStore((s) => s.lastChatActivityAt);
  const chatInputOpen = useCommsStore((s) => s.chatInputOpen);
  const setChatInputOpen = useCommsStore((s) => s.setChatInputOpen);
  const micConnected = useCommsStore((s) => s.micConnected);
  const micMuted = useCommsStore((s) => s.micMuted);
  const pttEnabled = useCommsStore((s) => s.pttEnabled);
  const pttHeld = useCommsStore((s) => s.pttHeld);
  const micError = useCommsStore((s) => s.micError);

  const [draft, setDraft] = useState("");
  const [faded, setFaded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-fade chat feed after 6s of inactivity
  useEffect(() => {
    if (chatInputOpen) {
      setFaded(false);
      return;
    }
    if (lastChatActivityAt === 0) {
      setFaded(true);
      return;
    }
    const elapsed = Date.now() - lastChatActivityAt;
    const remaining = CHAT_AUTO_FADE_MS - elapsed;
    if (remaining <= 0) {
      setFaded(true);
      return;
    }
    setFaded(false);
    const timer = setTimeout(() => setFaded(true), remaining);
    return () => clearTimeout(timer);
  }, [lastChatActivityAt, chatInputOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Close input automatically if disabled (e.g. Lobby/Settings/Sandbox opened)
  useEffect(() => {
    if (!enabled && chatInputOpen) {
      setChatInputOpen(false);
      setDraft("");
    }
  }, [enabled, chatInputOpen, setChatInputOpen]);

  // Focus input when opened
  useEffect(() => {
    if (chatInputOpen) {
      inputRef.current?.focus();
    }
  }, [chatInputOpen]);

  // Global Enter key opens chat input when in arena
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) {
        return;
      }
      if (useCommsStore.getState().chatInputOpen) {
        return;
      }
      if (isEditableElement(e.target)) {
        return;
      }
      e.preventDefault();
      if (document.pointerLockElement && document.exitPointerLock) {
        document.exitPointerLock();
      }
      setChatInputOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, setChatInputOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length > 0) {
      onSendChat(trimmed.slice(0, MAX_CHAT_LENGTH));
    }
    setDraft("");
    setChatInputOpen(false);
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft("");
      setChatInputOpen(false);
    }
  };

  if (!enabled) {
    return null;
  }

  const hasVoiceControls = Boolean(onToggleMic || onToggleMute || onTogglePtt);
  const micTransmitting = micConnected && !micMuted && (!pttEnabled || pttHeld);
  const visibleMessages = chatMessages.slice(-8);

  return (
    <section
      className={[
        "comms-chat",
        showTouchControls ? "comms-chat--touch" : "",
        chatInputOpen ? "comms-chat--open" : "",
        faded && !chatInputOpen ? "comms-chat--faded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="In-game communications"
    >
      {(hasVoiceControls || showTouchControls) && (
        <div className="comms-mic-bar">
          {onToggleMic && (
            <button
              type="button"
              className={`comms-mic-btn ${
                micConnected
                  ? micTransmitting
                    ? "comms-mic-btn--live"
                    : "comms-mic-btn--connected"
                  : ""
              }`}
              onClick={onToggleMic}
              title={micConnected ? "Disconnect voice chat" : "Join voice chat"}
            >
              {micConnected ? "🎙 Voice On" : "🎙 Join Voice"}
            </button>
          )}
          {micConnected && onToggleMute && (
            <button
              type="button"
              className={`comms-mic-btn ${micMuted ? "comms-mic-btn--muted" : ""}`}
              onClick={onToggleMute}
              title={micMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {micMuted ? "🔇 Muted" : "🔊 Mic"}
            </button>
          )}
          {micConnected && onTogglePtt && (
            <button
              type="button"
              className={`comms-mic-btn ${
                pttEnabled
                  ? pttHeld
                    ? "comms-mic-btn--live"
                    : "comms-mic-btn--ptt"
                  : ""
              }`}
              onClick={onTogglePtt}
              title="Toggle Push-to-Talk (Hold T)"
            >
              {pttEnabled ? (pttHeld ? "PTT [T] LIVE" : "PTT [T]") : "Open Mic"}
            </button>
          )}
          {showTouchControls && !chatInputOpen && (
            <button
              type="button"
              className="comms-mic-btn"
              onClick={() => setChatInputOpen(true)}
            >
              ⌨ Chat
            </button>
          )}
        </div>
      )}

      {micError && <div className="comms-mic-error">{micError}</div>}

      {visibleMessages.length > 0 && (
        <div ref={feedRef} className="comms-chat-feed" aria-live="polite">
          {visibleMessages.map((msg) => (
            <div
              key={msg.id}
              className={`comms-chat-line ${msg.isQuickChat ? "comms-chat-line--quick" : ""}`}
            >
              <span className="comms-chat-sender" style={{ color: msg.senderColor }}>
                {msg.senderName}
              </span>
              <span className="comms-chat-sep">:</span>
              <span className="comms-chat-text">{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {chatInputOpen ? (
        <form className="comms-chat-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="comms-chat-input"
            value={draft}
            maxLength={MAX_CHAT_LENGTH}
            placeholder="Say something... (Enter to send, Esc to cancel)"
            aria-label="Chat message"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={() => {
              if (draft.trim().length === 0) {
                setChatInputOpen(false);
              }
            }}
          />
          <button type="submit" className="comms-chat-send">
            Send
          </button>
        </form>
      ) : (
        !showTouchControls && (
          <div className="comms-chat-hint">
            Enter: Chat • Hold C: Quick Chat{micConnected && pttEnabled ? " • Hold T: Talk" : ""}
          </div>
        )
      )}
    </section>
  );
}
