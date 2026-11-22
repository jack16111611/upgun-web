import { useServerWakeStore } from "../network/serverWakeup";
import { useGameStore } from "../store/gameStore";

export function ConnectionBadge() {
  const status = useGameStore((s) => s.status);
  const roomId = useGameStore((s) => s.roomId);
  const isPrivateRoom = useGameStore((s) => s.isPrivateRoom);

  const wakePhase = useServerWakeStore((s) => s.wakePhase);
  const wakeElapsedSec = useServerWakeStore((s) => s.wakeElapsedSec);
  const serverPingMs = useServerWakeStore((s) => s.serverPingMs);

  const pingSuffix = serverPingMs !== null ? ` • ${serverPingMs} ms` : "";

  let modClass = "hud-badge--idle";
  let label = "Server: Standby";

  if (status === "connected") {
    modClass = "hud-badge--connected";
    label = roomId
      ? `Room: ${roomId}${isPrivateRoom ? " (Private)" : ""}${pingSuffix}`
      : `Connected${pingSuffix}`;
  } else if (wakePhase === "waking") {
    modClass = "hud-badge--connecting";
    label = `Waking server... ${wakeElapsedSec}s`;
  } else if (status === "connecting") {
    modClass = "hud-badge--connecting";
    label = "Server: Connecting...";
  } else if (wakePhase === "ready") {
    modClass = "hud-badge--connected";
    label = serverPingMs !== null ? `Ready • ${serverPingMs} ms` : "Server Ready";
  } else if (wakePhase === "error") {
    modClass = "hud-badge--idle";
    label = "Server: Offline";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`hud-badge ${modClass}`}
    >
      <span aria-hidden="true" className="hud-dot" />
      <span>{label}</span>
    </div>
  );
}
