import { useGameStore } from "../store/gameStore";

export function ConnectionBadge() {
  const status = useGameStore((s) => s.status);
  const roomId = useGameStore((s) => s.roomId);
  const isPrivateRoom = useGameStore((s) => s.isPrivateRoom);

  let modClass = "hud-badge--idle";
  let label = "Lobby: Offline";

  if (status === "connecting") {
    modClass = "hud-badge--connecting";
    label = "Server: Connecting...";
  } else if (status === "connected") {
    modClass = "hud-badge--connected";
    label = roomId
      ? `Room: ${roomId}${isPrivateRoom ? " (Private)" : ""}`
      : "Server: Connected";
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
