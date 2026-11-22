import type { RefObject } from "react";
import type { Group } from "three";

const DARK_CHASSIS = "#1e293b";
const GUN_METAL = "#334155";
const TITANIUM = "#64748b";
const RIFLE_BARREL = "#475569";

export interface RobotLegProps {
  side: -1 | 1;
  hipRef: RefObject<Group | null>;
  kneeRef: RefObject<Group | null>;
  bodyColor: string;
  accentColor: string;
  armorEmissive: string;
  armorEmissiveIntensity: number;
}

/**
 * Articulated hip-to-knee-to-boot robot leg.
 * Hip sits at y = -0.24, knee at local y = -0.28, boot sole cleanly at world y = -0.90.
 */
export function RobotLeg({
  side,
  hipRef,
  kneeRef,
  bodyColor,
  accentColor,
  armorEmissive,
  armorEmissiveIntensity,
}: RobotLegProps) {
  return (
    <group ref={hipRef} position={[side * 0.145, -0.24, 0]}>
      {/* Hip ball joint */}
      <mesh position={[0, -0.01, 0]} castShadow>
        <sphereGeometry args={[0.078, 8, 8]} />
        <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.6} />
      </mesh>

      {/* Armored upper thigh */}
      <mesh position={[0, -0.145, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.165, 0.25, 0.185]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={armorEmissive}
          emissiveIntensity={armorEmissiveIntensity}
          roughness={0.34}
          metalness={0.4}
        />
      </mesh>

      {/* Outer thigh armor bevel + piston accent */}
      <mesh position={[side * 0.088, -0.14, 0.01]} castShadow>
        <boxGeometry args={[0.032, 0.19, 0.12]} />
        <meshStandardMaterial color={GUN_METAL} roughness={0.4} metalness={0.62} />
      </mesh>

      {/* Articulated knee & lower shin */}
      <group ref={kneeRef} position={[0, -0.28, 0]}>
        {/* Knee cylinder joint */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.064, 0.064, 0.15, 8]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.42} metalness={0.65} />
        </mesh>

        {/* Forward knee guard */}
        <mesh position={[0, 0.01, -0.095]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.125, 0.11, 0.05]} />
          <meshStandardMaterial color={TITANIUM} roughness={0.32} metalness={0.68} />
        </mesh>

        {/* Lower shin casing */}
        <mesh position={[0, -0.135, 0.008]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.23, 0.165]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.34}
            metalness={0.4}
          />
        </mesh>

        {/* Rear calf hydraulic strut */}
        <mesh position={[0, -0.13, 0.098]} castShadow>
          <cylinderGeometry args={[0.026, 0.022, 0.2, 6]} />
          <meshStandardMaterial color={TITANIUM} roughness={0.28} metalness={0.78} />
        </mesh>

        {/* Ankle collar */}
        <mesh position={[0, -0.245, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.075, 0.055, 8]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.48} metalness={0.55} />
        </mesh>

        {/* Combat boot (bottom sits at local y = -0.38 -> world y = -0.90) */}
        <mesh position={[0, -0.315, -0.032]} castShadow receiveShadow>
          <boxGeometry args={[0.195, 0.13, 0.28]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.52} />
        </mesh>
        {/* Toe cap armor */}
        <mesh position={[0, -0.33, -0.165]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.06]} />
          <meshStandardMaterial color={GUN_METAL} roughness={0.38} metalness={0.62} />
        </mesh>
        {/* Subtle glowing boot trim */}
        <mesh position={[0, -0.362, -0.032]}>
          <boxGeometry args={[0.202, 0.02, 0.265]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.85}
            roughness={0.22}
          />
        </mesh>
      </group>
    </group>
  );
}

export interface RobotArmsProps {
  leftArmRef: RefObject<Group | null>;
  rightArmRef: RefObject<Group | null>;
  bodyColor: string;
  visorColor: string;
  accentColor: string;
  armorEmissive: string;
  armorEmissiveIntensity: number;
}

/**
 * Articulated shoulder pauldrons, left support arm, and right weapon arm with detailed 3D rifle.
 */
export function RobotArms({
  leftArmRef,
  rightArmRef,
  bodyColor,
  visorColor,
  accentColor,
  armorEmissive,
  armorEmissiveIntensity,
}: RobotArmsProps) {
  return (
    <>
      {/* Left Shoulder Pauldron & Support Arm */}
      <group ref={leftArmRef} position={[-0.34, 0.27, 0]}>
        {/* Shoulder ball joint */}
        <mesh castShadow>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.6} />
        </mesh>
        {/* Beveled shoulder pauldron */}
        <mesh position={[-0.025, 0.035, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.175, 0.155, 0.24]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.32}
            metalness={0.42}
          />
        </mesh>
        <mesh position={[-0.105, 0.04, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.03, 0.08, 0.18]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Upper arm */}
        <mesh position={[-0.02, -0.11, -0.04]} rotation={[0.35, 0, 0.08]} castShadow>
          <boxGeometry args={[0.115, 0.2, 0.115]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.55} />
        </mesh>
        {/* Elbow + angled forearm brace */}
        <mesh position={[0.025, -0.21, -0.145]} rotation={[0.92, 0, -0.22]} castShadow>
          <boxGeometry args={[0.115, 0.24, 0.115]} />
          <meshStandardMaterial color={GUN_METAL} roughness={0.4} metalness={0.55} />
        </mesh>
        {/* Armored gauntlet cuff */}
        <mesh position={[0.06, -0.245, -0.225]} rotation={[0.92, 0, -0.22]} castShadow>
          <boxGeometry args={[0.13, 0.09, 0.13]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.34}
            metalness={0.42}
          />
        </mesh>
      </group>

      {/* Right Shoulder Pauldron, Weapon Arm & Detailed Cyber-Rifle */}
      <group ref={rightArmRef} position={[0.34, 0.27, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.6} />
        </mesh>
        {/* Beveled shoulder pauldron */}
        <mesh position={[0.025, 0.035, 0]} rotation={[0, 0, -0.18]} castShadow>
          <boxGeometry args={[0.175, 0.155, 0.24]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.32}
            metalness={0.42}
          />
        </mesh>
        <mesh position={[0.105, 0.04, 0]} rotation={[0, 0, -0.18]} castShadow>
          <boxGeometry args={[0.03, 0.08, 0.18]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
        {/* Upper arm & forearm gripping rifle */}
        <mesh position={[0.015, -0.1, -0.05]} rotation={[0.45, 0, -0.05]} castShadow>
          <boxGeometry args={[0.115, 0.19, 0.115]} />
          <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.55} />
        </mesh>
        <mesh position={[0, -0.165, -0.165]} rotation={[1.28, 0, 0]} castShadow>
          <boxGeometry args={[0.115, 0.25, 0.115]} />
          <meshStandardMaterial color={GUN_METAL} roughness={0.4} metalness={0.55} />
        </mesh>
        <mesh position={[-0.01, -0.175, -0.23]} castShadow>
          <boxGeometry args={[0.125, 0.11, 0.11]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={armorEmissive}
            emissiveIntensity={armorEmissiveIntensity}
            roughness={0.34}
            metalness={0.42}
          />
        </mesh>

        {/* Detailed 3D UpGun Cyber-Rifle pointing along -Z */}
        <group position={[-0.035, -0.17, -0.4]} name="cyber_rifle">
          {/* Main receiver */}
          <mesh castShadow>
            <boxGeometry args={[0.095, 0.135, 0.5]} />
            <meshStandardMaterial color={DARK_CHASSIS} roughness={0.36} metalness={0.62} />
          </mesh>
          {/* Upper tactical shroud */}
          <mesh position={[0, 0.072, -0.03]} castShadow>
            <boxGeometry args={[0.068, 0.036, 0.4]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.38} metalness={0.65} />
          </mesh>
          {/* Extended barrel & muzzle brake */}
          <mesh position={[0, 0.018, -0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.03, 0.26, 8]} />
            <meshStandardMaterial color={RIFLE_BARREL} roughness={0.28} metalness={0.78} />
          </mesh>
          <mesh position={[0, 0.018, -0.47]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.03, 0.065, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.75} />
          </mesh>
          {/* Glowing side plasma rail strips */}
          {([-1, 1] as const).map((railSide) => (
            <mesh key={railSide} position={[railSide * 0.052, 0.02, -0.06]}>
              <boxGeometry args={[0.014, 0.026, 0.38]} />
              <meshStandardMaterial
                color={visorColor}
                emissive={accentColor}
                emissiveIntensity={1.25}
                roughness={0.18}
              />
            </mesh>
          ))}
          {/* Holo optic */}
          <mesh position={[0, 0.11, 0.05]} castShadow>
            <boxGeometry args={[0.052, 0.048, 0.09]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* Angled magazine + grip */}
          <mesh position={[0, -0.105, -0.05]} rotation={[0.24, 0, 0]} castShadow>
            <boxGeometry args={[0.056, 0.15, 0.082]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.46} metalness={0.48} />
          </mesh>
          <mesh position={[0, -0.085, 0.14]} rotation={[-0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.052, 0.12, 0.065]} />
            <meshStandardMaterial color="#0f172a" roughness={0.55} metalness={0.35} />
          </mesh>
        </group>
      </group>
    </>
  );
}
