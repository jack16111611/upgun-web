import { useRef, useState } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  DEFAULT_BODY_COLOR,
  DEFAULT_HAT_ID,
  PLAYER_MAX_HP,
  type HatId,
} from "@upgun/shared";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { worldRuntime } from "../game/worldRuntime";
import { useGameStore } from "../store/gameStore";
import { PlayerSpeechVisuals } from "./comms";
import { RobotAvatar } from "./cosmetics";

const HP_BAR_WIDTH = 0.96;
const HP_BAR_HEIGHT = 0.12;

function lerpAngle(current: number, target: number, factor: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * factor;
}

function RemoteAvatar({ sessionId, bigHead }: { sessionId: string; bigHead: boolean }) {
  const rootRef = useRef<Group>(null);
  const bodyYawRef = useRef<Group>(null);
  const hpFillRef = useRef<Mesh>(null);
  const hpMatRef = useRef<MeshBasicMaterial>(null);
  const initializedRef = useRef(false);
  const prevHpRef = useRef<number | null>(null);
  const hitFlashUntilRef = useRef(0);

  const initialSnap = worldRuntime.players.get(sessionId);
  const [appearance, setAppearance] = useState<{
    bodyColor: string;
    hatId: HatId;
    isBot: boolean;
    isMoving: boolean;
    hitFlash: boolean;
  }>({
    bodyColor: initialSnap?.bodyColor ?? DEFAULT_BODY_COLOR,
    hatId: initialSnap?.hatId ?? DEFAULT_HAT_ID,
    isBot: initialSnap?.isBot ?? false,
    isMoving: false,
    hitFlash: false,
  });

  useFrame((_, delta) => {
    const snap = worldRuntime.players.get(sessionId);
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (!snap || !snap.isAlive) {
      root.visible = false;
      prevHpRef.current = snap?.hp ?? null;
      return;
    }

    root.visible = true;
    const smooth = Math.min(1, delta * 18);

    if (!initializedRef.current) {
      root.position.set(snap.x, snap.y, snap.z);
      if (bodyYawRef.current) {
        bodyYawRef.current.rotation.y = snap.yaw;
      }
      initializedRef.current = true;
    } else {
      root.position.x += (snap.x - root.position.x) * smooth;
      root.position.y += (snap.y - root.position.y) * smooth;
      root.position.z += (snap.z - root.position.z) * smooth;
      if (bodyYawRef.current) {
        bodyYawRef.current.rotation.y = lerpAngle(
          bodyYawRef.current.rotation.y,
          snap.yaw,
          smooth,
        );
      }
    }

    const now = performance.now();
    if (prevHpRef.current !== null && snap.hp < prevHpRef.current) {
      hitFlashUntilRef.current = now + 120;
    }
    prevHpRef.current = snap.hp;

    const movingNow = Math.hypot(snap.vx, snap.vz) > 0.6;
    const hitFlashNow = now < hitFlashUntilRef.current;

    if (
      appearance.bodyColor !== snap.bodyColor ||
      appearance.hatId !== snap.hatId ||
      appearance.isBot !== snap.isBot ||
      appearance.isMoving !== movingNow ||
      appearance.hitFlash !== hitFlashNow
    ) {
      setAppearance({
        bodyColor: snap.bodyColor,
        hatId: snap.hatId,
        isBot: snap.isBot,
        isMoving: movingNow,
        hitFlash: hitFlashNow,
      });
    }

    const hpRatio = Math.max(0, Math.min(1, snap.hp / Math.max(1, snap.maxHp || PLAYER_MAX_HP)));
    if (hpFillRef.current) {
      hpFillRef.current.scale.x = Math.max(0.001, hpRatio);
      hpFillRef.current.position.x = -(HP_BAR_WIDTH * (1 - hpRatio)) * 0.5;
    }
    if (hpMatRef.current) {
      if (hpRatio > 0.55) {
        hpMatRef.current.color.set("#4ade80");
      } else if (hpRatio > 0.25) {
        hpMatRef.current.color.set("#facc15");
      } else {
        hpMatRef.current.color.set("#f87171");
      }
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      <group ref={bodyYawRef}>
        <RobotAvatar
          bodyColor={appearance.bodyColor}
          hatId={appearance.hatId}
          isAlive
          isBot={appearance.isBot}
          isMoving={appearance.isMoving}
          hitFlash={appearance.hitFlash}
          headScale={bigHead ? 2.5 : 1}
        />
      </group>

      {/* Camera-facing floating HP bar */}
      <Billboard position={[0, 1.38, 0]}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[HP_BAR_WIDTH + 0.06, HP_BAR_HEIGHT + 0.06]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
        </mesh>
        <mesh ref={hpFillRef} position={[0, 0, 0.001]}>
          <planeGeometry args={[HP_BAR_WIDTH, HP_BAR_HEIGHT]} />
          <meshBasicMaterial ref={hpMatRef} color="#4ade80" />
        </mesh>
      </Billboard>

      {/* Speaking indicator ring & 3s Quick-Chat floating bubble */}
      <PlayerSpeechVisuals sessionId={sessionId} yOffset={bigHead ? 2.05 : 1.68} />
    </group>
  );
}

export function RemotePlayers() {
  const remotePlayerIds = useGameStore((state) => state.remotePlayerIds);
  const bigHead = useGameStore((state) => state.bigHead);

  return (
    <group name="remote_players">
      {remotePlayerIds.map((id) => (
        <RemoteAvatar key={id} sessionId={id} bigHead={bigHead} />
      ))}
    </group>
  );
}
