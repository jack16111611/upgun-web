import { Canvas } from "@react-three/fiber";
import { getArenaMap } from "@upgun/shared";
import { JuiceSystem } from "../effects";
import { MeleeSlashEffect } from "../effects/MeleeSlashEffect";
import { useGameStore } from "../store/gameStore";
import { ArenaPropsVisuals, KothZoneVisual, StylizedArenaGeometry } from "./arena";
import { CombatEffects } from "./CombatEffects";
import { PlayerController } from "./PlayerController";
import { RemotePlayers } from "./RemotePlayers";
import { SpectatorCamera } from "./spectator";

export function Scene() {
  const mapId = useGameStore((s) => s.mapId);
  const activeMap = getArenaMap(mapId);

  return (
    <Canvas
      shadows
      camera={{ fov: 75, near: 0.1, far: 280, position: [0, 2, 12] }}
      dpr={[1, 2]}
    >
      <StylizedArenaGeometry map={activeMap} />
      <ArenaPropsVisuals mapId={mapId} />
      <KothZoneVisual />
      <RemotePlayers />
      <CombatEffects />
      <PlayerController />
      <SpectatorCamera />
      <JuiceSystem />
      <MeleeSlashEffect />
    </Canvas>
  );
}
