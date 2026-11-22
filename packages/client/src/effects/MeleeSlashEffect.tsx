import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GUN_GAME_FINAL_TIER } from "@upgun/shared";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  type PointLight,
} from "three";
import { useGameStore } from "../store/gameStore";

const SLASH_DURATION_SEC = 0.25;
const ARC_START_RAD = Math.PI * 0.16;
const ARC_SPAN_RAD = Math.PI * 0.68;

const CYAN_CORE = new Color("#e0f2fe");
const CYAN_BLADE = new Color("#22d3ee");
const CYAN_RIBBON = new Color("#38bdf8");
const CYAN_WAKE = new Color("#0ea5e9");

const GOLD_CORE = new Color("#fef9c3");
const GOLD_BLADE = new Color("#facc15");
const GOLD_RIBBON = new Color("#f59e0b");
const GOLD_WAKE = new Color("#fbbf24");

const localSlashState = {
  seq: 0,
  deflected: false,
  swingSign: 1 as 1 | -1,
};

/**
 * Triggers the local first-person energy-katana melee slash visual with zero
 * React state updates or re-renders.
 */
export function triggerLocalMeleeSlash(deflected = false): void {
  localSlashState.seq += 1;
  localSlashState.deflected = Boolean(deflected);
  localSlashState.swingSign = localSlashState.seq % 2 === 1 ? 1 : -1;
}

export function getLocalMeleeSlashSeq(): number {
  return localSlashState.seq;
}

export function MeleeSlashEffect() {
  const rootRef = useRef<Group | null>(null);
  const tiltRef = useRef<Group | null>(null);
  const sweepRef = useRef<Group | null>(null);
  const flashGroupRef = useRef<Group | null>(null);

  const coreMatRef = useRef<MeshBasicMaterial | null>(null);
  const bladeMatRef = useRef<MeshBasicMaterial | null>(null);
  const ribbonMatRef = useRef<MeshBasicMaterial | null>(null);
  const wakeMatRef = useRef<MeshBasicMaterial | null>(null);
  const katanaEdgeMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashCrossMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashRingMatRef = useRef<MeshBasicMaterial | null>(null);
  const lightRef = useRef<PointLight | null>(null);

  const animRef = useRef({
    lastSeq: localSlashState.seq,
    elapsed: SLASH_DURATION_SEC,
    active: false,
    deflected: false,
    goldenAura: false,
    swingSign: 1 as 1 | -1,
  });

  useFrame(({ camera }, delta) => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    const sweep = sweepRef.current;
    if (!root || !tilt || !sweep) return;

    const anim = animRef.current;
    if (localSlashState.seq !== anim.lastSeq) {
      const store = useGameStore.getState();
      const isGoldenKatana =
        store.gameMode === "gun_game" && store.weaponTier >= GUN_GAME_FINAL_TIER;

      anim.lastSeq = localSlashState.seq;
      anim.elapsed = 0;
      anim.active = true;
      anim.deflected = localSlashState.deflected;
      anim.goldenAura = isGoldenKatana || localSlashState.deflected;
      anim.swingSign = localSlashState.swingSign;

      const coreColor = anim.goldenAura ? GOLD_CORE : CYAN_CORE;
      const bladeColor = anim.goldenAura ? GOLD_BLADE : CYAN_BLADE;
      const ribbonColor = anim.goldenAura ? GOLD_RIBBON : CYAN_RIBBON;
      const wakeColor = anim.goldenAura ? GOLD_WAKE : CYAN_WAKE;

      coreMatRef.current?.color.copy(coreColor);
      bladeMatRef.current?.color.copy(bladeColor);
      ribbonMatRef.current?.color.copy(ribbonColor);
      wakeMatRef.current?.color.copy(wakeColor);
      katanaEdgeMatRef.current?.color.copy(coreColor);
      lightRef.current?.color.copy(bladeColor);
    }

    if (!anim.active) {
      root.visible = false;
      if (lightRef.current) lightRef.current.intensity = 0;
      return;
    }

    anim.elapsed += Math.min(delta, 0.05);
    if (anim.elapsed >= SLASH_DURATION_SEC) {
      anim.active = false;
      root.visible = false;
      if (flashGroupRef.current) flashGroupRef.current.visible = false;
      if (lightRef.current) lightRef.current.intensity = 0;
      return;
    }

    const t = anim.elapsed / SLASH_DURATION_SEC;
    const easeOut = 1 - (1 - t) * (1 - t) * (1 - t);
    const alpha = Math.min(1, t / 0.12) * (1 - t * t);

    root.visible = true;
    root.position.copy(camera.position);
    root.quaternion.copy(camera.quaternion);

    tilt.rotation.set(0.11, 0, anim.swingSign * 0.42);
    sweep.rotation.set(0, anim.swingSign * (1.12 - easeOut * 2.28), 0);
    const auraBoost = anim.deflected ? 1.2 : anim.goldenAura ? 1.12 : 1.0;
    const scale = (0.82 + easeOut * 0.3) * auraBoost;
    sweep.scale.set(scale, scale, scale);

    if (coreMatRef.current) coreMatRef.current.opacity = Math.min(1, alpha * (anim.goldenAura ? 1.18 : 0.98));
    if (bladeMatRef.current) bladeMatRef.current.opacity = Math.min(0.96, alpha * (anim.goldenAura ? 0.96 : 0.84));
    if (ribbonMatRef.current) ribbonMatRef.current.opacity = Math.min(0.68, alpha * (anim.goldenAura ? 0.68 : 0.48));
    if (wakeMatRef.current) wakeMatRef.current.opacity = Math.min(0.45, alpha * (anim.goldenAura ? 0.44 : 0.3));
    if (katanaEdgeMatRef.current) katanaEdgeMatRef.current.opacity = Math.min(1, alpha * 1.1);

    const flashGroup = flashGroupRef.current;
    if (flashGroup) {
      if (anim.goldenAura) {
        const flashRatio = Math.max(0, 1 - t * (anim.deflected ? 1.3 : 1.55));
        flashGroup.visible = flashRatio > 0.01;
        const flashScale = 0.48 + easeOut * (anim.deflected ? 1.35 : 0.92);
        flashGroup.scale.set(flashScale, flashScale, flashScale);
        flashGroup.rotation.z = anim.swingSign * (0.35 + t * 1.35);
        const glintMul = anim.deflected ? 1.0 : 0.72;
        if (flashMatRef.current) flashMatRef.current.opacity = flashRatio * 0.96 * glintMul;
        if (flashCrossMatRef.current) flashCrossMatRef.current.opacity = flashRatio * 0.88 * glintMul;
        if (flashRingMatRef.current) flashRingMatRef.current.opacity = flashRatio * 0.85 * glintMul;
      } else {
        flashGroup.visible = false;
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = alpha * (anim.deflected ? 5.6 : anim.goldenAura ? 4.1 : 2.8);
    }
  });

  const slashMatProps = {
    transparent: true,
    opacity: 0,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  };

  return (
    <group ref={rootRef} name="melee_slash_effect_root" visible={false} frustumCulled={false}>
      <group ref={tiltRef} position={[0, -0.06, -0.05]} frustumCulled={false}>
        <group ref={sweepRef} frustumCulled={false}>
          <group rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            <mesh renderOrder={9} frustumCulled={false}>
              <ringGeometry args={[0.24, 0.78, 30, 1, ARC_START_RAD - 0.24, ARC_SPAN_RAD + 0.24]} />
              <meshBasicMaterial ref={wakeMatRef} color="#0ea5e9" {...slashMatProps} />
            </mesh>
            <mesh renderOrder={10} frustumCulled={false}>
              <ringGeometry args={[0.34, 0.72, 30, 1, ARC_START_RAD - 0.14, ARC_SPAN_RAD + 0.16]} />
              <meshBasicMaterial ref={ribbonMatRef} color="#38bdf8" {...slashMatProps} />
            </mesh>
            <mesh renderOrder={11} frustumCulled={false}>
              <ringGeometry args={[0.48, 0.68, 30, 1, ARC_START_RAD, ARC_SPAN_RAD]} />
              <meshBasicMaterial ref={bladeMatRef} color="#22d3ee" {...slashMatProps} />
            </mesh>
            <mesh rotation={[0, 0, ARC_START_RAD]} renderOrder={12} frustumCulled={false}>
              <torusGeometry args={[0.67, 0.015, 6, 30, ARC_SPAN_RAD]} />
              <meshBasicMaterial
                ref={coreMatRef}
                color="#e0f2fe"
                transparent
                opacity={0}
                blending={AdditiveBlending}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0.42, 0.36, 0]} rotation={[0, 0, -0.78]} renderOrder={12} frustumCulled={false}>
              <boxGeometry args={[0.018, 0.56, 0.012]} />
              <meshBasicMaterial
                ref={katanaEdgeMatRef}
                color="#e0f2fe"
                transparent
                opacity={0}
                blending={AdditiveBlending}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* Golden parry/deflect & Golden Katana aura flash star + shock ring */}
      <group ref={flashGroupRef} position={[0, -0.02, -0.62]} visible={false} frustumCulled={false}>
        <mesh renderOrder={13} frustumCulled={false}>
          <planeGeometry args={[0.58, 0.055]} />
          <meshBasicMaterial ref={flashMatRef} color="#fef9c3" {...slashMatProps} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={13} frustumCulled={false}>
          <planeGeometry args={[0.44, 0.048]} />
          <meshBasicMaterial ref={flashCrossMatRef} color="#fde047" {...slashMatProps} />
        </mesh>
        <mesh renderOrder={12} frustumCulled={false}>
          <ringGeometry args={[0.13, 0.25, 24]} />
          <meshBasicMaterial ref={flashRingMatRef} color="#facc15" {...slashMatProps} />
        </mesh>
      </group>

      <pointLight
        ref={lightRef}
        position={[0, -0.02, -0.58]}
        color="#22d3ee"
        intensity={0}
        distance={5.8}
        decay={2}
      />
    </group>
  );
}
