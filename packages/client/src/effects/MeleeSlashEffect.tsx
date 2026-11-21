import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

const SLASH_DURATION_SEC = 0.24;
const ARC_START_RAD = Math.PI * 0.18;
const ARC_SPAN_RAD = Math.PI * 0.64;

const CYAN_CORE = new Color("#e0f2fe");
const CYAN_BLADE = new Color("#22d3ee");
const CYAN_RIBBON = new Color("#38bdf8");

const GOLD_CORE = new Color("#fef9c3");
const GOLD_BLADE = new Color("#facc15");
const GOLD_RIBBON = new Color("#f59e0b");

interface LocalMeleeSlashState {
  seq: number;
  deflected: boolean;
  swingSign: 1 | -1;
}

const localSlashState: LocalMeleeSlashState = {
  seq: 0,
  deflected: false,
  swingSign: 1,
};

/**
 * Triggers the local first-person energy-blade melee slash visual with zero
 * React state updates or re-renders.
 */
export function triggerLocalMeleeSlash(deflected = false): void {
  localSlashState.seq += 1;
  localSlashState.deflected = Boolean(deflected);
  localSlashState.swingSign = localSlashState.seq % 2 === 1 ? 1 : -1;
}

export function MeleeSlashEffect() {
  const rootRef = useRef<Group | null>(null);
  const tiltRef = useRef<Group | null>(null);
  const sweepRef = useRef<Group | null>(null);
  const flashGroupRef = useRef<Group | null>(null);

  const coreMatRef = useRef<MeshBasicMaterial | null>(null);
  const bladeMatRef = useRef<MeshBasicMaterial | null>(null);
  const ribbonMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashCrossMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashRingMatRef = useRef<MeshBasicMaterial | null>(null);
  const lightRef = useRef<PointLight | null>(null);

  const animRef = useRef({
    lastSeq: localSlashState.seq,
    elapsed: SLASH_DURATION_SEC,
    active: false,
    deflected: false,
    swingSign: 1 as 1 | -1,
  });

  useFrame(({ camera }, delta) => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    const sweep = sweepRef.current;
    if (!root || !tilt || !sweep) {
      return;
    }

    const anim = animRef.current;

    if (localSlashState.seq !== anim.lastSeq) {
      anim.lastSeq = localSlashState.seq;
      anim.elapsed = 0;
      anim.active = true;
      anim.deflected = localSlashState.deflected;
      anim.swingSign = localSlashState.swingSign;

      const coreColor = anim.deflected ? GOLD_CORE : CYAN_CORE;
      const bladeColor = anim.deflected ? GOLD_BLADE : CYAN_BLADE;
      const ribbonColor = anim.deflected ? GOLD_RIBBON : CYAN_RIBBON;

      coreMatRef.current?.color.copy(coreColor);
      bladeMatRef.current?.color.copy(bladeColor);
      ribbonMatRef.current?.color.copy(ribbonColor);
      lightRef.current?.color.copy(bladeColor);
    }

    if (!anim.active) {
      root.visible = false;
      if (lightRef.current) {
        lightRef.current.intensity = 0;
      }
      return;
    }

    const dt = Math.min(delta, 0.05);
    anim.elapsed += dt;

    if (anim.elapsed >= SLASH_DURATION_SEC) {
      anim.active = false;
      root.visible = false;
      if (flashGroupRef.current) {
        flashGroupRef.current.visible = false;
      }
      if (lightRef.current) {
        lightRef.current.intensity = 0;
      }
      return;
    }

    const t = anim.elapsed / SLASH_DURATION_SEC;
    const easeOut = 1 - (1 - t) * (1 - t) * (1 - t);
    const fadeIn = Math.min(1, t / 0.14);
    const fadeOut = 1 - t * t;
    const alpha = fadeIn * fadeOut;

    root.visible = true;
    root.position.copy(camera.position);
    root.quaternion.copy(camera.quaternion);

    // Diagonal slash plane canted across the viewport, alternating left/right
    tilt.rotation.set(0.11, 0, anim.swingSign * 0.44);

    // Rapid curved sweep across the forward view
    sweep.rotation.set(0, anim.swingSign * (1.05 - easeOut * 2.15), 0);
    const deflectBoost = anim.deflected ? 1.16 : 1.0;
    const scale = (0.82 + easeOut * 0.28) * deflectBoost;
    sweep.scale.set(scale, scale, scale);

    if (coreMatRef.current) {
      coreMatRef.current.opacity = Math.min(1, alpha * (anim.deflected ? 1.15 : 0.98));
    }
    if (bladeMatRef.current) {
      bladeMatRef.current.opacity = Math.min(0.95, alpha * (anim.deflected ? 0.95 : 0.82));
    }
    if (ribbonMatRef.current) {
      ribbonMatRef.current.opacity = Math.min(0.62, alpha * (anim.deflected ? 0.62 : 0.46));
    }

    // Bright gold parry burst flash when a grenade or shot is deflected
    const flashGroup = flashGroupRef.current;
    if (flashGroup) {
      if (anim.deflected) {
        const flashRatio = Math.max(0, 1 - t * 1.35);
        flashGroup.visible = flashRatio > 0.01;
        const flashScale = 0.55 + easeOut * 1.35;
        flashGroup.scale.set(flashScale, flashScale, flashScale);
        flashGroup.rotation.z = anim.swingSign * (0.35 + t * 1.2);
        if (flashMatRef.current) {
          flashMatRef.current.opacity = flashRatio * 0.96;
        }
        if (flashCrossMatRef.current) {
          flashCrossMatRef.current.opacity = flashRatio * 0.88;
        }
        if (flashRingMatRef.current) {
          flashRingMatRef.current.opacity = flashRatio * 0.85;
        }
      } else {
        flashGroup.visible = false;
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = alpha * (anim.deflected ? 5.2 : 2.6);
    }
  });

  return (
    <group ref={rootRef} name="melee_slash_effect_root" visible={false} frustumCulled={false}>
      <group ref={tiltRef} position={[0, -0.06, -0.05]} frustumCulled={false}>
        <group ref={sweepRef} frustumCulled={false}>
          {/* Curved blade & slash ribbon oriented in the horizontal sweep plane */}
          <group rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            {/* Wide trailing slash ribbon */}
            <mesh renderOrder={10} frustumCulled={false}>
              <ringGeometry args={[0.34, 0.72, 28, 1, ARC_START_RAD - 0.14, ARC_SPAN_RAD + 0.16]} />
              <meshBasicMaterial
                ref={ribbonMatRef}
                color="#38bdf8"
                transparent
                opacity={0}
                side={DoubleSide}
                blending={AdditiveBlending}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>

            {/* Primary glowing energy-blade crescent */}
            <mesh renderOrder={11} frustumCulled={false}>
              <ringGeometry args={[0.48, 0.67, 28, 1, ARC_START_RAD, ARC_SPAN_RAD]} />
              <meshBasicMaterial
                ref={bladeMatRef}
                color="#22d3ee"
                transparent
                opacity={0}
                side={DoubleSide}
                blending={AdditiveBlending}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>

            {/* Razor-bright leading energy arc edge */}
            <mesh rotation={[0, 0, ARC_START_RAD]} renderOrder={12} frustumCulled={false}>
              <torusGeometry args={[0.66, 0.014, 6, 28, ARC_SPAN_RAD]} />
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
          </group>
        </group>
      </group>

      {/* Golden parry/deflect flash star + shock ring */}
      <group
        ref={flashGroupRef}
        position={[0, -0.02, -0.62]}
        visible={false}
        frustumCulled={false}
      >
        <mesh renderOrder={13} frustumCulled={false}>
          <planeGeometry args={[0.56, 0.055]} />
          <meshBasicMaterial
            ref={flashMatRef}
            color="#fef9c3"
            transparent
            opacity={0}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} renderOrder={13} frustumCulled={false}>
          <planeGeometry args={[0.42, 0.048]} />
          <meshBasicMaterial
            ref={flashCrossMatRef}
            color="#fde047"
            transparent
            opacity={0}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
        <mesh renderOrder={12} frustumCulled={false}>
          <ringGeometry args={[0.12, 0.24, 24]} />
          <meshBasicMaterial
            ref={flashRingMatRef}
            color="#facc15"
            transparent
            opacity={0}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <pointLight
        ref={lightRef}
        position={[0, -0.02, -0.58]}
        color="#22d3ee"
        intensity={0}
        distance={5.5}
        decay={2}
      />
    </group>
  );
}
