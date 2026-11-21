import { useMemo, useRef } from "react";
import {
  arenaPropsRuntime,
  getDefaultTeleportersForMap,
  type SyncedBarrel,
  type SyncedOrb,
  type SyncedTeleporter,
} from "./arenaPropsRuntime";
export {
  arenaPropsRuntime,
  pushTeleportFlash,
  resetArenaPropsRuntime,
  type SyncedBarrel,
  type SyncedOrb,
  type SyncedTeleporter,
} from "./arenaPropsRuntime";
import { BarrelVisuals } from "./BarrelVisuals";
import { OverchargeOrbVisuals } from "./OverchargeOrbVisuals";
import { TeleporterVisuals } from "./TeleporterVisuals";

export interface ArenaPropsVisualsProps {
  mapId: string;
  barrels?: readonly SyncedBarrel[];
  teleporters?: readonly SyncedTeleporter[];
  orbs?: readonly SyncedOrb[];
}

export function ArenaPropsVisuals({
  mapId,
  barrels,
  teleporters,
  orbs,
}: ArenaPropsVisualsProps) {
  const barrelsRef = useRef<readonly SyncedBarrel[] | undefined>(barrels);
  barrelsRef.current = barrels;

  const orbsRef = useRef<readonly SyncedOrb[] | undefined>(orbs);
  orbsRef.current = orbs;

  const activeTeleporters = useMemo<readonly SyncedTeleporter[]>(() => {
    if (teleporters && teleporters.length > 0) {
      return teleporters;
    }
    if (arenaPropsRuntime.mapId === mapId && arenaPropsRuntime.teleporters.length > 0) {
      return arenaPropsRuntime.teleporters;
    }
    return getDefaultTeleportersForMap(mapId);
  }, [mapId, teleporters]);

  return (
    <group name={`arena_props_${mapId}`}>
      <BarrelVisuals barrelsRef={barrelsRef} />
      <TeleporterVisuals teleporters={activeTeleporters} />
      <OverchargeOrbVisuals orbsRef={orbsRef} />
    </group>
  );
}
