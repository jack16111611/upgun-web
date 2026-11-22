import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { HatId } from "@upgun/shared";
import { RobotHead } from "./RobotHead";
import { RobotJetpack } from "./RobotJetpack";
import { RobotArms, RobotLeg } from "./RobotLimbs";

export interface RobotAvatarProps {
  bodyColor: string;
  hatId: HatId;
  isAlive: boolean;
  isBot?: boolean;
  isMoving?: boolean;
  aimPitch?: number;
  hitFlash?: boolean;
  headScale?: number;
  moveSpeed?: number;
  isAirborne?: boolean;
  isDashing?: boolean;
  pose?: "combat" | "hero";
}

const DARK_CHASSIS = "#1e293b";
const GUN_METAL = "#334155";
const TITANIUM = "#64748b";

export function RobotAvatar({
  bodyColor,
  hatId,
  isAlive,
  isBot = false,
  isMoving = false,
  aimPitch = 0,
  hitFlash = false,
  headScale = 1,
  moveSpeed,
  isAirborne = false,
  isDashing = false,
  pose = "combat",
}: RobotAvatarProps) {
  const leanRef = useRef<Group>(null);
  const bodyBobRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftKneeRef = useRef<Group>(null);
  const rightKneeRef = useRef<Group>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const leftEyeMatRef = useRef<MeshStandardMaterial>(null);
  const rightEyeMatRef = useRef<MeshStandardMaterial>(null);
  const coreEmblemMatRef = useRef<MeshStandardMaterial>(null);

  const animRef = useRef({
    walkPhase: 0,
    idleTime: 0,
    smoothedSpeed: 0,
    blinkTimer: 2.2 + Math.random() * 2.4,
    blinkProgress: 0,
  });

  const visorColor = isBot ? "#fef08a" : "#e0f2fe";
  const accentColor = isBot ? "#f59e0b" : "#38bdf8";
  const armorEmissive = hitFlash ? "#ffffff" : "#000000";
  const armorEmissiveIntensity = hitFlash ? 0.72 : 0;

  useFrame((_, delta) => {
    if (!isAlive) return;

    const dt = Math.min(delta, 0.1);
    const alpha = 1 - Math.exp(-15 * dt);
    const anim = animRef.current;
    anim.idleTime += dt;

    const targetSpeed = moveSpeed !== undefined ? Math.max(0, moveSpeed) : isMoving ? 6.5 : 0;
    anim.smoothedSpeed += (targetSpeed - anim.smoothedSpeed) * alpha;

    const speedRatio = Math.min(1.6, anim.smoothedSpeed / 7.5);
    const moving = speedRatio > 0.08 && !isAirborne;
    const isHero = pose === "hero";

    anim.walkPhase += dt * (moving ? 6.5 + speedRatio * 7.2 : 2.1);

    const phase = anim.walkPhase;
    const strideAmp = moving ? Math.min(0.72, 0.2 + speedRatio * 0.44) : 0;

    // Articulated leg hip & knee targets
    let targetLeftHip = isHero ? -0.06 : 0;
    let targetRightHip = isHero ? 0.08 : 0;
    let targetLeftKnee = isHero ? 0.08 : 0.04;
    let targetRightKnee = isHero ? 0.06 : 0.04;

    if (isDashing) {
      targetLeftHip = -0.35;
      targetRightHip = -0.58;
      targetLeftKnee = 0.55;
      targetRightKnee = 0.78;
    } else if (isAirborne) {
      targetLeftHip = 0.28 + Math.sin(anim.idleTime * 5) * 0.06;
      targetRightHip = -0.22 - Math.sin(anim.idleTime * 5) * 0.06;
      targetLeftKnee = 0.52;
      targetRightKnee = 0.42;
    } else if (moving) {
      const sL = Math.sin(phase);
      targetLeftHip = sL * strideAmp;
      targetRightHip = -sL * strideAmp;
      targetLeftKnee = Math.max(0.05, -Math.cos(phase) * strideAmp * 0.9 + 0.18);
      targetRightKnee = Math.max(0.05, Math.cos(phase) * strideAmp * 0.9 + 0.18);
    }

    if (leftLegRef.current) leftLegRef.current.rotation.x += (targetLeftHip - leftLegRef.current.rotation.x) * alpha;
    if (rightLegRef.current) rightLegRef.current.rotation.x += (targetRightHip - rightLegRef.current.rotation.x) * alpha;
    if (leftKneeRef.current) leftKneeRef.current.rotation.x += (targetLeftKnee - leftKneeRef.current.rotation.x) * alpha;
    if (rightKneeRef.current) rightKneeRef.current.rotation.x += (targetRightKnee - rightKneeRef.current.rotation.x) * alpha;

    // Dynamic forward lean while sprinting / dashing
    const targetLean = isDashing ? -0.34 : isAirborne ? -0.14 : -speedRatio * 0.09;
    if (leanRef.current) leanRef.current.rotation.x += (targetLean - leanRef.current.rotation.x) * alpha;

    // Upper body bob & breathing
    const targetBob = isAirborne
      ? Math.sin(anim.idleTime * 4.2) * 0.025
      : moving
        ? Math.abs(Math.sin(phase)) * (0.032 + speedRatio * 0.024)
        : Math.sin(anim.idleTime * 2.3) * 0.014;
    if (bodyBobRef.current) bodyBobRef.current.position.y += (targetBob - bodyBobRef.current.position.y) * alpha;

    // Head tracking & subtle hero look-around
    if (headRef.current) {
      const targetHeadPitch = isHero ? Math.sin(anim.idleTime * 1.1) * 0.05 : aimPitch * 0.55;
      const targetHeadYaw = isHero ? Math.sin(anim.idleTime * 0.75) * 0.16 : 0;
      headRef.current.rotation.x += (targetHeadPitch - headRef.current.rotation.x) * alpha;
      headRef.current.rotation.y += (targetHeadYaw - headRef.current.rotation.y) * alpha;
    }

    // Articulated arm swing / combat aim
    if (rightArmRef.current) {
      const targetRightPitch = isHero
        ? -0.22 + Math.sin(anim.idleTime * 1.8) * 0.03
        : aimPitch * 0.72 + (moving ? Math.sin(phase) * 0.06 : 0);
      rightArmRef.current.rotation.x += (targetRightPitch - rightArmRef.current.rotation.x) * alpha;
    }
    if (leftArmRef.current) {
      const targetLeftPitch = isHero
        ? 0.12 - Math.sin(anim.idleTime * 1.8) * 0.04
        : moving
          ? -Math.sin(phase) * Math.min(0.45, strideAmp * 0.7)
          : aimPitch * 0.25;
      leftArmRef.current.rotation.x += (targetLeftPitch - leftArmRef.current.rotation.x) * alpha;
    }

    // Expressive visor eyes: natural blink + emotion pulse
    anim.blinkTimer -= dt;
    if (anim.blinkTimer <= 0) {
      anim.blinkProgress += dt * 11;
      if (anim.blinkProgress >= Math.PI) {
        anim.blinkProgress = 0;
        anim.blinkTimer = 2.6 + Math.random() * 3.4;
      }
    }
    const blinkSquash = anim.blinkProgress > 0 ? Math.max(0.1, 1 - Math.sin(anim.blinkProgress)) : 1;
    const combatSquint = isDashing ? 0.62 : hitFlash ? 0.55 : isAirborne ? 1.12 : 1.0;
    const eyeScaleY = blinkSquash * combatSquint;
    const eyePulse = 1.2 + Math.sin(anim.idleTime * 3.8) * 0.25 + (isDashing ? 0.8 : 0);

    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;
    if (leftEyeMatRef.current) leftEyeMatRef.current.emissiveIntensity = eyePulse;
    if (rightEyeMatRef.current) rightEyeMatRef.current.emissiveIntensity = eyePulse;
    if (coreEmblemMatRef.current) {
      coreEmblemMatRef.current.emissiveIntensity = hitFlash
        ? 2.4
        : 1.15 + Math.sin(anim.idleTime * 3.2) * 0.25 + (isDashing ? 0.7 : 0);
    }
  });

  return (
    <group name="robot_avatar" visible={isAlive}>
      <group ref={leanRef}>
        <RobotLeg
          side={-1}
          hipRef={leftLegRef}
          kneeRef={leftKneeRef}
          bodyColor={bodyColor}
          accentColor={accentColor}
          armorEmissive={armorEmissive}
          armorEmissiveIntensity={armorEmissiveIntensity}
        />
        <RobotLeg
          side={1}
          hipRef={rightLegRef}
          kneeRef={rightKneeRef}
          bodyColor={bodyColor}
          accentColor={accentColor}
          armorEmissive={armorEmissive}
          armorEmissiveIntensity={armorEmissiveIntensity}
        />

        <group ref={bodyBobRef}>
          {/* Pelvis & Waist Piston Belt */}
          <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.15, 0.27]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.46} metalness={0.55} />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.08, 10]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.42} metalness={0.62} />
          </mesh>

          {/* Beveled Armored Chest Chassis */}
          <mesh position={[0, 0.145, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.54, 0.45, 0.32]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={armorEmissive}
              emissiveIntensity={armorEmissiveIntensity}
              roughness={0.3}
              metalness={0.42}
            />
          </mesh>
          <mesh position={[0, 0.325, -0.02]} rotation={[0.22, 0, 0]} castShadow>
            <boxGeometry args={[0.46, 0.12, 0.29]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={armorEmissive}
              emissiveIntensity={armorEmissiveIntensity}
              roughness={0.28}
              metalness={0.45}
            />
          </mesh>
          {([-1, 1] as const).map((s) => (
            <mesh key={s} position={[s * 0.275, 0.08, 0]} castShadow>
              <boxGeometry args={[0.04, 0.26, 0.24]} />
              <meshStandardMaterial color={GUN_METAL} roughness={0.42} metalness={0.6} />
            </mesh>
          ))}

          {/* Recessed Chest Core Emblem (-Z) */}
          <mesh position={[0, 0.165, -0.172]} castShadow>
            <boxGeometry args={[0.33, 0.23, 0.055]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.38} metalness={0.62} />
          </mesh>
          <mesh position={[0, 0.165, -0.202]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.115, 0.115, 0.026]} />
            <meshStandardMaterial
              ref={coreEmblemMatRef}
              color={visorColor}
              emissive={accentColor}
              emissiveIntensity={1.25}
              roughness={0.15}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[-0.12, 0.355, -0.14]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[0.09, 0.024, 0.04]} />
            <meshStandardMaterial color={TITANIUM} roughness={0.3} metalness={0.78} />
          </mesh>
          <mesh position={[0.12, 0.355, -0.14]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.09, 0.024, 0.04]} />
            <meshStandardMaterial color={TITANIUM} roughness={0.3} metalness={0.78} />
          </mesh>

          <RobotJetpack
            bodyColor={bodyColor}
            accentColor={accentColor}
            isAirborne={isAirborne}
            isDashing={isDashing}
            moveSpeed={moveSpeed}
          />

          <RobotArms
            leftArmRef={leftArmRef}
            rightArmRef={rightArmRef}
            bodyColor={bodyColor}
            visorColor={visorColor}
            accentColor={accentColor}
            armorEmissive={armorEmissive}
            armorEmissiveIntensity={armorEmissiveIntensity}
          />

          <RobotHead
            headRef={headRef}
            leftEyeRef={leftEyeRef}
            rightEyeRef={rightEyeRef}
            leftEyeMatRef={leftEyeMatRef}
            rightEyeMatRef={rightEyeMatRef}
            headScale={headScale}
            bodyColor={bodyColor}
            visorColor={visorColor}
            accentColor={accentColor}
            armorEmissive={armorEmissive}
            armorEmissiveIntensity={armorEmissiveIntensity}
            hatId={hatId}
          />
        </group>
      </group>
    </group>
  );
}
