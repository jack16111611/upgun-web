import type { DeviceType } from "@upgun/shared";
import { useGameStore } from "../store/gameStore";
import { useCommsStore, voiceChatManager } from "./comms";

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === "mobile") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="device-icon">
        <path
          fill="currentColor"
          d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h10V5H7Zm5 14.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        />
      </svg>
    );
  }
  if (type === "gamepad") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="device-icon">
        <path
          fill="currentColor"
          d="M6 7h12a4 4 0 0 1 3.9 4.9l-1 5A3 3 0 0 1 18 19a2.8 2.8 0 0 1-2.2-1l-1.5-2h-4.6l-1.5 2A2.8 2.8 0 0 1 6 19a3 3 0 0 1-2.9-2.1l-1-5A4 4 0 0 1 6 7Zm1 4v2h2v2h2v-2h2v-2h-2V9H9v2H7Zm8.5 1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm2.5 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="device-icon">
      <path
        fill="currentColor"
        d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5v2h3v2H7v-2h3v-2H5a2 2 0 0 1-2-2V5Zm2 0v10h14V5H5Z"
      />
    </svg>
  );
}

const DEVICE_NAME: Record<DeviceType, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  gamepad: "Gamepad",
};

export function ScoreboardOverlay() {
  const scoreboardOpen = useGameStore((s) => s.scoreboardOpen);
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const status = useGameStore((s) => s.status);
  const sessionId = useGameStore((s) => s.sessionId);
  const roomId = useGameStore((s) => s.roomId);
  const rows = useGameStore((s) => s.scoreboardRows);
  const setScoreboardOpen = useGameStore((s) => s.setScoreboardOpen);
  const speakingPeers = useCommsStore((s) => s.speakingPeers);
  const mutedPeers = useCommsStore((s) => s.mutedPeers);

  if (!scoreboardOpen || lobbyOpen || settingsOpen || status !== "connected") {
    return null;
  }

  return (
    <div
      className="scoreboard-backdrop"
      role="dialog"
      aria-label="Live Scoreboard"
    >
      <div className="panel-card scoreboard-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Scoreboard</h2>
            {roomId && <p className="panel-subtitle">Room {roomId}</p>}
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setScoreboardOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="scoreboard-table-wrap">
          <table className="scoreboard-table">
            <caption className="visually-hidden">Live Match Scoreboard</caption>
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Device</th>
                <th scope="col">Score</th>
                <th scope="col">Kills</th>
                <th scope="col">HP</th>
                <th scope="col">Voice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelf = row.sessionId === sessionId;
                const isSpeaking = Boolean(speakingPeers[row.sessionId]);
                const isMuted = Boolean(mutedPeers[row.sessionId]);
                return (
                  <tr
                    key={row.sessionId}
                    className={isSelf ? "scoreboard-row--self" : undefined}
                  >
                    <td>
                      <span className="scoreboard-player-cell">
                        <span
                          aria-hidden="true"
                          className="scoreboard-swatch"
                          style={{ backgroundColor: row.color }}
                        />
                        <span>
                          {row.displayName}
                          {isSelf ? " (You)" : ""}
                          {row.isBot ? " (Bot)" : ""}
                        </span>
                        {isSpeaking && (
                          <span className="scoreboard-speaking-dot" title="Speaking" aria-label="Speaking" />
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="scoreboard-device-cell" title={DEVICE_NAME[row.deviceType]}>
                        <DeviceIcon type={row.deviceType} />
                        <span className="scoreboard-device-label">
                          {DEVICE_NAME[row.deviceType]}
                        </span>
                      </span>
                    </td>
                    <td>{row.score}</td>
                    <td>{row.kills}</td>
                    <td className={!row.isAlive ? "scoreboard-dead" : undefined}>
                      {row.isAlive ? `${row.hp}` : "KO"}
                    </td>
                    <td>
                      {!isSelf && !row.isBot ? (
                        <button
                          type="button"
                          className={`scoreboard-mute-btn ${isMuted ? "scoreboard-mute-btn--muted" : ""}`}
                          aria-pressed={isMuted}
                          onClick={() => voiceChatManager.setPeerMuted(row.sessionId, !isMuted)}
                        >
                          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                        </button>
                      ) : (
                        <span className="scoreboard-voice-na">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
