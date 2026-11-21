import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import { worldRuntime } from "../game/worldRuntime";
import { useGameStore } from "../store/gameStore";
import { juiceBus } from "./juiceBus";

const BASE_POS_X = 0.23;
const BASE_POS_Y = -0.19;
const BASE_POS_Z = -0.37;
const RIFLE_SCALE = 0.64;

export function ViewmodelRifle() {
  const rootRef = useRef<Group | null>(null);
  const gunRef = useRef<Group | null>(null);
  const flashGroupRef = useRef<Group | null>(null);
  const flashMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashLightRef = useRef<PointLight | null>(null);
  const railLeftMatRef = useRef<MeshStandardMaterial | null>(null);
  const railRightMatRef = useRef<MeshStandardMaterial | null>(null);

  const stateRef = useRef({
    lastRecoilSeq: juiceBus.getRecoilSeq(),
    lastDashSeq: juiceBus.getDashPulseSeq(),
    recoil: 0,
    recoilRollSign: 1,
    flashTimer: 0,
    dashRoll: 0,
    reloadBlend: 0,
    walkPhase: 0,
    idleTime: 0,
    verticalLag: 0,
  });

  useFrame(({ camera }, delta) => {
    const root = rootRef.current;
    const gun = gunRef.current;
    if (!root || !gun) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const localId = worldRuntime.localSessionId;
    const localSnap = localId ? worldRuntime.players.get(localId) : undefined;
    const store = useGameStore.getState();

    const shouldShow =
      worldRuntime.room !== null &&
      !store.lobbyOpen &&
      worldRuntime.phase !== "lobby" &&
      worldRuntime.phase !== "drafting" &&
      (localSnap ? localSnap.isAlive : store.isAlive);

    root.visible = shouldShow;
    if (!shouldShow) {
      if (flashLightRef.current) {
        flashLightRef.current.intensity = 0;
      }
      return;
    }

    const anim = stateRef.current;
    anim.idleTime += dt;

    // Detect recoil impulse
    const recoilSeq = juiceBus.getRecoilSeq();
    if (recoilSeq !== anim.lastRecoilSeq) {
      anim.lastRecoilSeq = recoilSeq;
      anim.recoil = Math.min(1.25, anim.recoil + 0.92);
      anim.recoilRollSign = Math.random() > 0.5 ? 1 : -1;
      anim.flashTimer = 0.065;
      if (flashGroupRef.current) {
        flashGroupRef.current.rotation.z = Math.random() * Math.PI;
      }
    }

    // Detect dash impulse
    const dashSeq = juiceBus.getDashPulseSeq();
    if (dashSeq !== anim.lastDashSeq) {
      anim.lastDashSeq = dashSeq;
      anim.dashRoll = juiceBus.getDashTiltDirection() * 0.24;
    }

    // Smooth decays
    const recoilDecay = Math.exp(-18 * dt);
    anim.recoil *= recoilDecay;
    if (anim.recoil < 0.001) {
      anim.recoil = 0;
    }

    anim.dashRoll *= Math.exp(-8.5 * dt);
    if (Math.abs(anim.dashRoll) < 0.001) {
      anim.dashRoll = 0;
    }

    const reloadTarget = store.isReloading ? 1 : 0;
    anim.reloadBlend += (reloadTarget - anim.reloadBlend) * Math.min(1, dt * 11);

    // Movement sway from local velocity snapshot
    const vx = localSnap?.vx ?? 0;
    const vy = localSnap?.vy ?? 0;
    const vz = localSnap?.vz ?? 0;
    const horizSpeed = Math.hypot(vx, vz);
    const moveFactor = Math.min(1, horizSpeed / 7.5);
    anim.walkPhase += dt * (4.5 + moveFactor * 6.5);

    const targetVertLag = Math.max(-0.025, Math.min(0.025, -vy * 0.0028));
    anim.verticalLag += (targetVertLag - anim.verticalLag) * Math.min(1, dt * 10);

    const idleX = Math.sin(anim.idleTime * 1.7) * 0.003;
    const idleY = Math.cos(anim.idleTime * 2.4) * 0.0035;
    const walkX = Math.sin(anim.walkPhase) * 0.011 * moveFactor;
    const walkY = Math.abs(Math.cos(anim.walkPhase)) * -0.01 * moveFactor;

    // Reload dip & cant
    const reloadDipY = -0.095 * anim.reloadBlend;
    const reloadPitch = -0.38 * anim.reloadBlend;
    const reloadRoll = 0.42 * anim.reloadBlend;

    // Recoil kickback
    const kickZ = anim.recoil * 0.068;
    const kickY = anim.recoil * 0.012;
    const kickPitch = anim.recoil * 0.095;
    const kickRoll = anim.recoil * 0.03 * anim.recoilRollSign;

    // Attach cleanly to active camera
    root.position.copy(camera.position);
    root.quaternion.copy(camera.quaternion);

    gun.position.set(
      BASE_POS_X + idleX + walkX - anim.dashRoll * 0.08,
      BASE_POS_Y + idleY + walkY + anim.verticalLag + reloadDipY + kickY,
      BASE_POS_Z + kickZ,
    );
    gun.rotation.set(
      kickPitch + reloadPitch,
      -walkX * 0.9,
      anim.dashRoll + reloadRoll + kickRoll,
    );

    // Neon energy rail color: cyan normally, amber pulse when reloading
    const railColor = store.isReloading ? "#f59e0b" : "#22d3ee";
    const railIntensity = store.isReloading
      ? 1.0 + (0.5 + 0.5 * Math.sin(anim.idleTime * 16)) * 1.4
      : 1.6 + anim.recoil * 1.5;
    if (railLeftMatRef.current) {
      railLeftMatRef.current.emissive.set(railColor);
      railLeftMatRef.current.emissiveIntensity = railIntensity;
    }
    if (railRightMatRef.current) {
      railRightMatRef.current.emissive.set(railColor);
      railRightMatRef.current.emissiveIntensity = railIntensity;
    }

    // Muzzle flash decay
    if (anim.flashTimer > 0) {
      anim.flashTimer = Math.max(0, anim.flashTimer - dt);
      const ratio = anim.flashTimer / 0.065;
      if (flashGroupRef.current) {
        flashGroupRef.current.visible = true;
        const s = 0.65 + ratio * 0.7;
        flashGroupRef.current.scale.set(s, s, 0.8 + ratio * 0.9);
      }
      if (flashMatRef.current) {
        flashMatRef.current.opacity = ratio * 0.95;
      }
      if (flashLightRef.current) {
        flashLightRef.current.intensity = ratio * 3.4;
      }
    } else {
      if (flashGroupRef.current) {
        flashGroupRef.current.visible = false;
      }
      if (flashLightRef.current) {
        flashLightRef.current.intensity = 0;
      }
    }
  });

  return (
    <group ref={rootRef} name="viewmodel_rifle_root" visible={false} frustumCulled={false}>
      <group ref={gunRef} scale={RIFLE_SCALE} frustumCulled={false}>
        {/* Main receiver body */}
        <mesh position={[0, 0, 0]} frustumCulled={false}>
          <boxGeometry args={[0.072, 0.09, 0.42]} />
          <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.28} />
        </mesh>

        {/* Upper shroud */}
        <mesh position={[0, 0.052, -0.02]} frustumCulled={false}>
          <boxGeometry args={[0.052, 0.028, 0.36]} />
          <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.4} />
        </mesh>

        {/* Neon cyan energy rails (left & right) */}
        <mesh position={[-0.039, 0.015, -0.03]} frustumCulled={false}>
          <boxGeometry args={[0.008, 0.016, 0.34]} />
          <meshStandardMaterial
            ref={railLeftMatRef}
            color="#38bdf8"
            emissive="#22d3ee"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.039, 0.015, -0.03]} frustumCulled={false}>
          <boxGeometry args={[0.008, 0.016, 0.34]} />
          <meshStandardMaterial
            ref={railRightMatRef}
            color="#38bdf8"
            emissive="#22d3ee"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>

        {/* Barrel & muzzle brake */}
        <mesh position={[0, 0.022, -0.27]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.016, 0.02, 0.22, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.022, -0.37]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.023, 0.021, 0.05, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Angled magazine */}
        <mesh position={[0, -0.085, -0.05]} rotation={[0.22, 0, 0]} frustumCulled={false}>
          <boxGeometry args={[0.04, 0.11, 0.068]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.45} />
        </mesh>

        {/* Foregrip */}
        <mesh position={[0, -0.06, -0.17]} rotation={[-0.25, 0, 0]} frustumCulled={false}>
          <boxGeometry args={[0.034, 0.075, 0.038]} />
          <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.65} />
        </mesh>

        {/* Compact holo optic frame + reticle dot */}
        <mesh position={[0, 0.085, 0.05]} frustumCulled={false}>
          <boxGeometry args={[0.048, 0.04, 0.065]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.088, 0.048]} frustumCulled={false}>
          <boxGeometry args={[0.008, 0.008, 0.008]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>

        {/* Muzzle flash cone & glow */}
        <group ref={flashGroupRef} position={[0, 0.022, -0.43]} visible={false} frustumCulled={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
            <coneGeometry args={[0.075, 0.18, 6]} />
            <meshBasicMaterial
              ref={flashMatRef}
              color="#fef08a"
              transparent
              opacity={0.95}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh frustumCulled={false}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>

        <pointLight
          ref={flashLightRef}
          position={[0, 0.04, -0.44]}
          color="#bae6fd"
          intensity={0}
          distance={4.5}
          decay={2}
        />
      </group>
    </group>
  );
}
