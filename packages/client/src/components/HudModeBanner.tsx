import {
  BOT_DIFFICULTY_PROFILES,
  getGameModeConfig,
  getGunGameTier,
  GUN_GAME_TIERS,
  type BotDifficulty,
} from "@upgun/shared";
import { sendBotDifficulty, sendVoiceJoin, sendVoiceLeave } from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { useCommsStore, voiceChatManager } from "./comms";

export async function toggleVoiceConnection(): Promise<void> {
  if (voiceChatManager.isConnected()) {
    voiceChatManager.disconnect();
    sendVoiceLeave();
  } else {
    const ok = await voiceChatManager.connect();
    if (ok) {
      sendVoiceJoin();
    }
  }
}

export function HudVoiceToolbar() {
  const micConnected = useCommsStore((s) => s.micConnected);
  const micMuted = useCommsStore((s) => s.micMuted);
  const pttEnabled = useCommsStore((s) => s.pttEnabled);
  const pttHeld = useCommsStore((s) => s.pttHeld);

  return (
    <>
      <button
        type="button"
        className={`hud-top-btn ${micConnected && !micMuted ? "hud-top-btn--active" : ""}`}
        onClick={() => void toggleVoiceConnection()}
        title={micConnected ? "Disconnect voice chat" : "Join WebRTC voice chat"}
      >
        {micConnected ? (micMuted ? "🔇 Voice" : "🎙 Voice") : "🎙 Mic Off"}
      </button>
      {micConnected && (
        <button
          type="button"
          className={`hud-top-btn ${pttEnabled ? "hud-top-btn--active" : ""}`}
          onClick={() => voiceChatManager.setPushToTalkMode(!pttEnabled)}
          title="Toggle Push-to-Talk (Hold T)"
        >
          {pttEnabled ? (pttHeld ? "PTT LIVE" : "PTT (T)") : "Open Mic"}
        </button>
      )}
    </>
  );
}

export function HudModeBanner() {
  const gameMode = useGameStore((s) => s.gameMode);
  const botDifficulty = useGameStore((s) => s.botDifficulty);
  const weaponTier = useGameStore((s) => s.weaponTier);
  const kothZone = useGameStore((s) => s.kothZone);
  const botCount = useGameStore((s) => s.botCount);
  const cheatsEnabled = useGameStore((s) => s.cheatsEnabled);
  const isPrivateRoom = useGameStore((s) => s.isPrivateRoom);
  const setPreferredBotDifficulty = useSettingsStore((s) => s.setPreferredBotDifficulty);

  const modeCfg = getGameModeConfig(gameMode);
  const gunTier = gameMode === "gun_game" ? getGunGameTier(weaponTier) : null;
  const canEditBots = (isPrivateRoom || cheatsEnabled) && botCount > 0;

  return (
    <div className="hud-mode-strip">
      <span className="hud-mode-badge">
        <span aria-hidden="true">{modeCfg.icon}</span>
        <span>{modeCfg.name}</span>
      </span>

      {gunTier && (
        <span className="hud-mode-badge hud-mode-badge--gun">
          Tier {gunTier.tier + 1}/{GUN_GAME_TIERS.length}: {gunTier.icon} {gunTier.name}
        </span>
      )}

      {gameMode === "koth" && kothZone.active && (
        <span
          className={`hud-mode-badge ${
            kothZone.overtime
              ? "hud-mode-badge--overtime"
              : kothZone.contested
                ? "hud-mode-badge--contested"
                : "hud-mode-badge--koth"
          }`}
        >
          {kothZone.overtime
            ? `OVERTIME • ${Math.round(kothZone.progress)}%`
            : kothZone.contested
              ? `CONTESTED • ${Math.round(kothZone.progress)}%`
              : kothZone.ownerName
                ? `HILL: ${kothZone.ownerName} (${Math.round(kothZone.progress)}%)`
                : `HILL OPEN • Rotates in ${Math.ceil(kothZone.rotationTimer)}s`}
        </span>
      )}

      {canEditBots && (
        <select
          aria-label="Bot difficulty"
          className="hud-bot-diff-select"
          value={botDifficulty}
          onChange={(e) => {
            const next = e.target.value as BotDifficulty;
            setPreferredBotDifficulty(next);
            sendBotDifficulty(next);
          }}
        >
          {BOT_DIFFICULTY_PROFILES.map((prof) => (
            <option key={prof.id} value={prof.id}>
              Bots: {prof.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
