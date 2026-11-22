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
import { getLocalMeleeSlashSeq } from "./MeleeSlashEffect";
import {
  resolveViewmodelWeapon,
  ViewmodelWeaponMeshes,
  type ViewmodelWeaponId,
} from "./ViewmodelWeaponMeshes";

const BASE_POS_X = 0.23;
const BASE_POS_Y = -0.19;
const BASE_POS_Z = -0.37;

export function ViewmodelRifle() {
  const gameMode = useGameStore((s) => s.gameMode);
  const weaponTier = useGameStore((s) => s.weaponTier);
  const weapon = resolveViewmodelWeapon(gameMode, weaponTier);

  const rootRef = useRef<Group | null>(null);
  const gunRef = useRef<Group | null>(null);
  const flashGroupRef = useRef<Group | null>(null);
  const flashMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashCoreMatRef = useRef<MeshBasicMaterial | null>(null);
  const flashLightRef = useRef<PointLight | null>(null);
  const energyMatRef = useRef<MeshStandardMaterial | null>(null);

  const stateRef = useRef({
    lastWeaponId: weapon.id as ViewmodelWeaponId,
    swapDip: 0,
    lastRecoilSeq: juiceBus.getRecoilSeq(),
    lastDashSeq: juiceBus.getDashPulseSeq(),
    lastSlashSeq: getLocalMeleeSlashSeq(),
    recoil: 0,
    recoilRollSign: 1,
    slashKick: 0,
    slashSign: 1,
    flashTimer: 0,
    dashRoll: 0,
    sprintTilt: 0,
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

    // Trigger crisp equip draw-in when Gun Game tier or mode weapon changes
    if (anim.lastWeaponId !== weapon.id) {
      anim.lastWeaponId = weapon.id;
      anim.swapDip = 1.0;
    }
    anim.swapDip *= Math.exp(-12 * dt);
    if (anim.swapDip < 0.002) {
      anim.swapDip = 0;
    }

    // Detect shot recoil impulse
    const recoilSeq = juiceBus.getRecoilSeq();
    if (recoilSeq !== anim.lastRecoilSeq) {
      anim.lastRecoilSeq = recoilSeq;
      if (!weapon.isMelee) {
        anim.recoil = Math.min(1.4, anim.recoil + 0.92 * weapon.recoilScale);
        anim.recoilRollSign = Math.random() > 0.5 ? 1 : -1;
        anim.flashTimer = 0.068;
        if (flashGroupRef.current) {
          flashGroupRef.current.rotation.z = Math.random() * Math.PI * 2;
        }
      }
    }

    // Detect melee slash impulse for katana swing feedback
    const slashSeq = getLocalMeleeSlashSeq();
    if (slashSeq !== anim.lastSlashSeq) {
      anim.lastSlashSeq = slashSeq;
      anim.slashKick = 1.0;
      anim.slashSign = slashSeq % 2 === 1 ? 1 : -1;
    }
    anim.slashKick *= Math.exp(-13 * dt);
    if (anim.slashKick < 0.002) {
      anim.slashKick = 0;
    }

    // Detect dash impulse
    const dashSeq = juiceBus.getDashPulseSeq();
    if (dashSeq !== anim.lastDashSeq) {
      anim.lastDashSeq = dashSeq;
      anim.dashRoll = juiceBus.getDashTiltDirection() * 0.28;
    }

    // Smooth exponential decays
    anim.recoil *= Math.exp(-18 * dt);
    if (anim.recoil < 0.001) anim.recoil = 0;

    anim.dashRoll *= Math.exp(-8.5 * dt);
    if (Math.abs(anim.dashRoll) < 0.001) anim.dashRoll = 0;

    const reloadTarget = store.isReloading && !weapon.isMelee ? 1 : 0;
    anim.reloadBlend += (reloadTarget - anim.reloadBlend) * (1 - Math.exp(-12 * dt));

    // Movement sway, walking bob, and sprint/dash tilt
    const vx = localSnap?.vx ?? 0;
    const vy = localSnap?.vy ?? 0;
    const vz = localSnap?.vz ?? 0;
    const horizSpeed = Math.hypot(vx, vz);
    const moveFactor = Math.min(1.25, horizSpeed / 7.5);
    anim.walkPhase += dt * (4.4 + moveFactor * 6.8);

    const targetSprintTilt = horizSpeed > 10.5 ? 0.14 : moveFactor > 0.85 ? 0.045 : 0;
    anim.sprintTilt += (targetSprintTilt - anim.sprintTilt) * (1 - Math.exp(-10 * dt));

    const targetVertLag = Math.max(-0.028, Math.min(0.028, -vy * 0.003));
    anim.verticalLag += (targetVertLag - anim.verticalLag) * (1 - Math.exp(-11 * dt));

    const idleX = Math.sin(anim.idleTime * 1.7) * 0.003;
    const idleY = Math.cos(anim.idleTime * 2.4) * 0.0035;
    const walkX = Math.sin(anim.walkPhase) * 0.011 * moveFactor;
    const walkY = Math.abs(Math.cos(anim.walkPhase)) * -0.0105 * moveFactor;

    const reloadDipY = -0.095 * anim.reloadBlend;
    const reloadPitch = -0.38 * anim.reloadBlend;
    const reloadRoll = 0.42 * anim.reloadBlend;

    const swapDipY = -0.14 * anim.swapDip;
    const swapPitch = -0.45 * anim.swapDip;

    const kickZ = anim.recoil * 0.068;
    const kickY = anim.recoil * 0.013;
    const kickPitch = anim.recoil * 0.095;
    const kickRoll = anim.recoil * 0.032 * anim.recoilRollSign;

    const katanaSlashX = weapon.isMelee ? -anim.slashKick * 0.22 * anim.slashSign : 0;
    const katanaSlashYaw = weapon.isMelee ? anim.slashKick * 0.95 * anim.slashSign : 0;
    const katanaSlashPitch = weapon.isMelee ? -anim.slashKick * 0.55 : 0;

    root.position.copy(camera.position);
    root.quaternion.copy(camera.quaternion);

    gun.position.set(
      BASE_POS_X + idleX + walkX - anim.dashRoll * 0.085 + katanaSlashX,
      BASE_POS_Y + idleY + walkY + anim.verticalLag + reloadDipY + swapDipY + kickY,
      BASE_POS_Z + kickZ - (weapon.isMelee ? anim.slashKick * 0.09 : 0),
    );
    gun.rotation.set(
      kickPitch + reloadPitch + swapPitch + katanaSlashPitch,
      -walkX * 0.9 + katanaSlashYaw,
      anim.dashRoll + anim.sprintTilt + reloadRoll + kickRoll,
    );

    // Dynamic energy rail/blade emissive pulse
    if (energyMatRef.current) {
      const reloading = store.isReloading && !weapon.isMelee;
      const railColor = reloading ? "#f59e0b" : weapon.accentColor;
      const pulse = reloading
        ? 1.0 + (0.5 + 0.5 * Math.sin(anim.idleTime * 16)) * 1.4
        : weapon.isMelee
          ? 1.85 + Math.sin(anim.idleTime * 5.2) * 0.4 + anim.slashKick * 1.6
          : 1.6 + anim.recoil * 1.6;
      energyMatRef.current.emissive.set(railColor);
      energyMatRef.current.emissiveIntensity = pulse;
    }

    // Muzzle flash decay (guns only)
    if (!weapon.isMelee && anim.flashTimer > 0) {
      anim.flashTimer = Math.max(0, anim.flashTimer - dt);
      const ratio = anim.flashTimer / 0.068;
      if (flashGroupRef.current) {
        flashGroupRef.current.visible = true;
        const s = (0.65 + ratio * 0.72) * Math.min(1.35, weapon.recoilScale);
        flashGroupRef.current.scale.set(s, s, 0.8 + ratio * 0.95);
      }
      if (flashMatRef.current) {
        flashMatRef.current.opacity = ratio * 0.95;
      }
      if (flashCoreMatRef.current) {
        flashCoreMatRef.current.opacity = ratio * 0.88;
      }
      if (flashLightRef.current) {
        flashLightRef.current.intensity = ratio * 3.8;
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
      <group ref={gunRef} scale={weapon.scale} frustumCulled={false}>
        <ViewmodelWeaponMeshes
          weaponId={weapon.id}
          accentColor={weapon.accentColor}
          energyMatRef={energyMatRef}
        />

        {/* Dynamic Muzzle Flash Cone & Plasma Core */}
        {!weapon.isMelee && (
          <>
            <group
              ref={flashGroupRef}
              position={[0, 0.024, weapon.muzzleZ]}
              visible={false}
              frustumCulled={false}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
                <coneGeometry args={[0.075, 0.19, 6]} />
                <meshBasicMaterial
                  ref={flashMatRef}
                  color={weapon.flashColor}
                  transparent
                  opacity={0.95}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh frustumCulled={false}>
                <sphereGeometry args={[0.048, 8, 8]} />
                <meshBasicMaterial
                  ref={flashCoreMatRef}
                  color={weapon.accentColor}
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
              position={[0, 0.04, weapon.muzzleZ - 0.02]}
              color={weapon.flashColor}
              intensity={0}
              distance={5}
              decay={2}
            />
          </>
        )}
      </group>
    </group>
  );
}
