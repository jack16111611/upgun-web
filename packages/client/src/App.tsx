import { useEffect } from "react";
import { HudOverlay } from "./components/HudOverlay";
import { Scene } from "./components/Scene";
import { autoJoinFromUrl, leaveCurrentRoom } from "./network/colyseusClient";

export function App() {
  useEffect(() => {
    autoJoinFromUrl();
    return () => {
      void leaveCurrentRoom();
    };
  }, []);

  return (
    <main className="viewport">
      <HudOverlay />
      <Scene />
    </main>
  );
}
