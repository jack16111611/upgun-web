import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { HatId } from "@upgun/shared";
import { RobotHat } from "./RobotHat";

export interface RobotAvatarProps {
  bodyColor: string;
  hatId: HatId;
  isAlive: boolean;
  isBot?: boolean;
  isMoving?: boolean;
  aimPitch?: number;
  hitFlash?: boolean;
  headScale?: number;
}

const DARK_CHASSIS = "#1e293b";
const GUN_METAL = "#334155";
const RIFLE_BARREL = "#475569";

export function RobotAvatar({
  bodyColor,
  hatId,
  isAlive,
  isBot = false,
  isMoving = false,
  aimPitch = 0,
  hitFlash = false,
  headScale = 1,
}: RobotAvatarProps) {
  const bodyBobRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const walkPhaseRef = useRef(0);

  const visorColor = isBot ? "#fef08a" : "#e0f2fe";
  const accentColor = isBot ? "#f59e0b" : "#38bdf8";
  const armorEmissive = hitFlash ? "#ffffff" : "#000000";
  const armorEmissiveIntensity = hitFlash ? 0.65 : 0;

  useFrame((_, delta) => {
    if (!isAlive) {
      return;
    }

    const dt = Math.min(delta, 0.1);
    const damp = Math.min(1, dt * 14);

    if (isMoving) {
      walkPhaseRef.current += dt * 11;
    } else {
      walkPhaseRef.current += dt * 2.2;
    }

    const phase = walkPhaseRef.current;
    const targetLegSwing = isMoving ? Math.sin(phase) * 0.52 : 0;
    const targetBob = isMoving
      ? Math.abs(Math.sin(phase)) * 0.05
      : Math.sin(phase) * 0.012;

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x +=
        (targetLegSwing - leftLegRef.current.rotation.x) * damp;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x +=
        (-targetLegSwing - rightLegRef.current.rotation.x) * damp;
    }
    if (bodyBobRef.current) {
      bodyBobRef.current.position.y +=
        (targetBob - bodyBobRef.current.position.y) * damp;
    }
    if (headRef.current) {
      const targetHeadPitch = aimPitch * 0.55;
      headRef.current.rotation.x +=
        (targetHeadPitch - headRef.current.rotation.x) * damp;
    }
    if (rightArmRef.current) {
      const targetArmPitch = aimPitch * 0.7;
      rightArmRef.current.rotation.x +=
        (targetArmPitch - rightArmRef.current.rotation.x) * damp;
    }
  });

  return (
    <group name="robot_avatar" visible={isAlive}>
      {/* Articulated Legs: feet sit cleanly at y = -0.90 */}
      <group ref={leftLegRef} position={[-0.14, -0.24, 0]}>
        <mesh position={[0, -0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.48, 0.18]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.38}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[0, -0.57, -0.03]} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.18, 0.27]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.5} metalness={0.45} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.14, -0.24, 0]}>
        <mesh position={[0, -0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.48, 0.18]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.38}
            metalness={0.35}
          />
        </mesh>
        <mesh position={[0, -0.57, -0.03]} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.18, 0.27]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.5} metalness={0.45} />
        </mesh>
      </group>

      {/* Upper Body Group (subtle walk/idle bob) */}
      <group ref={bodyBobRef}>
        {/* Pelvis / Waist Chassis */}
        <mesh position={[0, -0.17, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.16, 0.26]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.5} metalness={0.45} />
        </mesh>

        {/* Armored Torso */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.52, 0.48, 0.32]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.32}
            metalness={0.38}
          />
        </mesh>

        {/* Front Chest Core Plate (-Z) */}
        <mesh position={[0, 0.16, -0.17]} castShadow>
          <boxGeometry args={[0.32, 0.24, 0.05]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.4} metalness={0.55} />
        </mesh>
        <mesh position={[0, 0.16, -0.2]}>
          <boxGeometry args={[0.2, 0.08, 0.025]} />
          <meshStandardMaterial
            color={visorColor}
            emissive={accentColor}
            emissiveIntensity={1.15}
            roughness={0.18}
          />
        </mesh>

        {/* Rear Power Pack (+Z) */}
        <mesh position={[0, 0.15, 0.19]} castShadow>
          <boxGeometry args={[0.3, 0.32, 0.1]} />
          <meshStandardMaterial color={GUN_METAL} roughness={0.48} metalness={0.5} />
        </mesh>

        {/* Left Shoulder & Support Arm */}
        <group position={[-0.33, 0.27, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.18, 0.22]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={armorEmissive}
              emissiveIntensity={armorEmissiveIntensity}
              roughness={0.35}
              metalness={0.35}
            />
          </mesh>
          <mesh position={[0.04, -0.16, -0.12]} rotation={[0.6, 0, -0.18]} castShadow>
            <boxGeometry args={[0.12, 0.32, 0.12]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.45} />
          </mesh>
        </group>

        {/* Right Shoulder, Arm & Stylized Cyber-Rifle */}
        <group ref={rightArmRef} position={[0.33, 0.27, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.18, 0.22]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={armorEmissive}
              emissiveIntensity={armorEmissiveIntensity}
              roughness={0.35}
              metalness={0.35}
            />
          </mesh>
          <mesh position={[0, -0.14, -0.14]} rotation={[1.15, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.45} />
          </mesh>

          {/* Stylized Cyber-Rifle pointing along -Z */}
          <group position={[-0.03, -0.17, -0.36]} name="cyber_rifle">
            <mesh castShadow>
              <boxGeometry args={[0.09, 0.13, 0.48]} />
              <meshStandardMaterial color={DARK_CHASSIS} roughness={0.4} metalness={0.55} />
            </mesh>
            <mesh position={[0, 0.015, -0.31]} castShadow>
              <boxGeometry args={[0.06, 0.06, 0.24]} />
              <meshStandardMaterial color={RIFLE_BARREL} roughness={0.35} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.075, -0.06]}>
              <boxGeometry args={[0.038, 0.028, 0.38]} />
              <meshStandardMaterial
                color={visorColor}
                emissive={accentColor}
                emissiveIntensity={1.1}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, -0.1, -0.04]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.055, 0.14, 0.08]} />
              <meshStandardMaterial color={GUN_METAL} roughness={0.5} metalness={0.4} />
            </mesh>
          </group>
        </group>

        {/* Articulated Head (top sits at y = 0.42 + 0.42 = +0.84) + Hat */}
        <group ref={headRef} position={[0, 0.42, 0]} scale={[headScale, headScale, headScale]}>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.08, 8]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.5} metalness={0.5} />
          </mesh>

          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.36, 0.38]} />
            <meshStandardMaterial
              color={bodyColor}
              emissive={armorEmissive}
              emissiveIntensity={armorEmissiveIntensity}
              roughness={0.3}
              metalness={0.38}
            />
          </mesh>

          {/* Side Ear Pods */}
          <mesh position={[-0.23, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.05, 8]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.45} metalness={0.55} />
          </mesh>
          <mesh position={[0.23, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.05, 8]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.45} metalness={0.55} />
          </mesh>

          {/* Glowing Neon Visor (-Z) */}
          <mesh position={[0, 0.25, -0.195]}>
            <boxGeometry args={[0.34, 0.13, 0.04]} />
            <meshStandardMaterial
              color={visorColor}
              emissive={accentColor}
              emissiveIntensity={1.25}
              roughness={0.15}
            />
          </mesh>

          <RobotHat hatId={hatId} accentColor={accentColor} />
        </group>
      </group>
    </group>
  );
}
