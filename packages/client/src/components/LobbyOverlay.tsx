import { useEffect, useRef, useState } from "react";
import {
  MAX_COMBAT_BOTS,
  ROOM_CODE_LENGTH,
  sanitizeRoomCode,
  type BotDifficulty,
  type GameMode,
  type HatId,
} from "@upgun/shared";
import {
  connectCreatePrivate,
  connectJoinByCode,
  connectQuickPlay,
  connectSoloPractice,
  leaveCurrentRoom,
  sendAddBot,
  sendBotDifficulty,
  sendCosmetics,
  sendGameMode,
} from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { CosmeticsPicker } from "./cosmetics";
import { LobbyMatchConfig } from "./LobbyMatchConfig";

export function LobbyOverlay() {
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const status = useGameStore((s) => s.status);
  const roomId = useGameStore((s) => s.roomId);
  const isPrivateRoom = useGameStore((s) => s.isPrivateRoom);
  const cheatsEnabled = useGameStore((s) => s.cheatsEnabled);
  const botCount = useGameStore((s) => s.botCount);
  const roomGameMode = useGameStore((s) => s.gameMode);
  const roomBotDifficulty = useGameStore((s) => s.botDifficulty);
  const connectionError = useGameStore((s) => s.connectionError);
  const setLobbyOpen = useGameStore((s) => s.setLobbyOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);

  const nickname = useSettingsStore((s) => s.nickname);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const hatId = useSettingsStore((s) => s.hatId);
  const bodyColor = useSettingsStore((s) => s.bodyColor);
  const preferredGameMode = useSettingsStore((s) => s.preferredGameMode);
  const preferredBotDifficulty = useSettingsStore((s) => s.preferredBotDifficulty);
  const setHatId = useSettingsStore((s) => s.setHatId);
  const setBodyColor = useSettingsStore((s) => s.setBodyColor);
  const setPreferredGameMode = useSettingsStore((s) => s.setPreferredGameMode);
  const setPreferredBotDifficulty = useSettingsStore((s) => s.setPreferredBotDifficulty);

  const [codeInput, setCodeInput] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCopyTextRef = useRef("");

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!lobbyOpen) {
    return null;
  }

  const isBusy = status === "connecting";
  const isConnected = status === "connected" && Boolean(roomId);
  const inviteUrl =
    isConnected && typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
      : "";

  const announceCopy = (baseMsg: string, state: "copied" | "failed") => {
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
    }
    const text = baseMsg === lastCopyTextRef.current ? `${baseMsg}\u00A0` : baseMsg;
    lastCopyTextRef.current = text;
    setCopyState(state);
    setCopyMessage("");
    requestAnimationFrame(() => {
      setCopyMessage(text);
    });
    copyTimerRef.current = setTimeout(() => {
      setCopyState("idle");
      setCopyMessage("");
    }, 2200);
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      announceCopy("Invite link copied", "copied");
    } catch {
      announceCopy("Copy failed", "failed");
    }
  };

  const handleJoinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void connectJoinByCode(codeInput);
  };

  const handleSelectHat = (nextHat: HatId) => {
    setHatId(nextHat);
    if (isConnected) {
      sendCosmetics(nextHat, bodyColor);
    }
  };

  const handleSelectColor = (nextColor: string) => {
    setBodyColor(nextColor);
    if (isConnected) {
      sendCosmetics(hatId, nextColor);
    }
  };

  const canChangeRoomMode = !isConnected || isPrivateRoom || cheatsEnabled;
  const activeGameMode = isConnected ? roomGameMode : preferredGameMode;
  const activeBotDifficulty = isConnected ? roomBotDifficulty : preferredBotDifficulty;

  const handleSelectGameMode = (mode: GameMode) => {
    setPreferredGameMode(mode);
    if (isConnected && (isPrivateRoom || cheatsEnabled)) {
      sendGameMode(mode);
    }
  };

  const handleSelectBotDifficulty = (difficulty: BotDifficulty) => {
    setPreferredBotDifficulty(difficulty);
    if (isConnected && (isPrivateRoom || cheatsEnabled)) {
      sendBotDifficulty(difficulty);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lobby-title">
      <div className="panel-card lobby-card">
        <div className="panel-header">
          <div>
            <h1 id="lobby-title" className="panel-title">
              UPGUN ARENA
            </h1>
            <p className="panel-subtitle">40 Upgrade Cards • 4 Sunlit Maps • 5 Modes</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>

        <div className="field-group">
          <label htmlFor="lobby-nickname" className="field-label">
            Nickname
          </label>
          <input
            id="lobby-nickname"
            type="text"
            className="text-input"
            maxLength={16}
            value={nickname}
            placeholder="Enter nickname"
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <CosmeticsPicker
          hatId={hatId}
          bodyColor={bodyColor}
          onSelectHat={handleSelectHat}
          onSelectColor={handleSelectColor}
        />

        <LobbyMatchConfig
          gameMode={activeGameMode}
          botDifficulty={activeBotDifficulty}
          disabled={!canChangeRoomMode}
          onSelectGameMode={handleSelectGameMode}
          onSelectBotDifficulty={handleSelectBotDifficulty}
        />

        {isConnected && roomId && (
          <div className="room-banner">
            <div className="room-banner-meta">
              <span className="room-banner-label">
                {isPrivateRoom ? "Private Room" : "Public Room"}
              </span>
              <strong className="room-code-text">{roomId}</strong>
            </div>

            <div className="copy-wrap">
              <button
                type="button"
                className="btn btn--accent"
                data-copied={copyState === "copied" ? "" : undefined}
                data-failed={copyState === "failed" ? "" : undefined}
                onClick={() => void handleCopyInvite()}
              >
                Copy Invite Link
              </button>
              <span
                role="status"
                className={`copy-tip ${copyMessage ? "copy-tip--visible" : ""}`}
              >
                {copyMessage}
              </span>
            </div>
          </div>
        )}

        {connectionError && (
          <div role="alert" className="lobby-error">
            {connectionError}
          </div>
        )}

        <div className="lobby-actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={isBusy}
            onClick={() => void connectQuickPlay()}
          >
            {isBusy ? "Connecting..." : "Quick Play"}
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            disabled={isBusy}
            onClick={() => void connectCreatePrivate()}
          >
            Create Private Room
          </button>
        </div>

        <form className="join-form" onSubmit={handleJoinSubmit}>
          <label htmlFor="join-room-code" className="visually-hidden">
            4-letter room code
          </label>
          <input
            id="join-room-code"
            type="text"
            className="text-input text-input--code"
            maxLength={ROOM_CODE_LENGTH}
            value={codeInput}
            placeholder="CODE"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCodeInput(sanitizeRoomCode(e.target.value))}
          />
          <button
            type="submit"
            className="btn btn--secondary"
            disabled={isBusy || codeInput.length !== ROOM_CODE_LENGTH}
          >
            Join Room
          </button>
        </form>

        <div className="lobby-footer">
          <button
            type="button"
            className="btn btn--practice"
            disabled={isBusy}
            onClick={() => void connectSoloPractice()}
          >
            Practice vs Target Dummy
          </button>

          {isConnected && (isPrivateRoom || cheatsEnabled) && (
            <button
              type="button"
              className="btn btn--secondary"
              disabled={botCount >= MAX_COMBAT_BOTS}
              onClick={() => sendAddBot()}
            >
              Add Combat Bot (+1) ({botCount}/{MAX_COMBAT_BOTS})
            </button>
          )}

          {isConnected && (
            <div className="lobby-footer-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setLobbyOpen(false)}
              >
                Enter Arena
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => void leaveCurrentRoom()}
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
