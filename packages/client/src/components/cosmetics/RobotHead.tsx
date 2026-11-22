import type { RefObject } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { HatId } from "@upgun/shared";
import { RobotHat } from "./RobotHat";

const DARK_CHASSIS = "#1e293b";
const GUN_METAL = "#334155";

export interface RobotHeadProps {
  headRef: RefObject<Group | null>;
  leftEyeRef: RefObject<Mesh | null>;
  rightEyeRef: RefObject<Mesh | null>;
  leftEyeMatRef: RefObject<MeshStandardMaterial | null>;
  rightEyeMatRef: RefObject<MeshStandardMaterial | null>;
  headScale: number;
  bodyColor: string;
  visorColor: string;
  accentColor: string;
  armorEmissive: string;
  armorEmissiveIntensity: number;
  hatId: HatId;
}

/**
 * Articulated robot head with beveled helmet crest, side ear comms pods,
 * expressive glowing visor eyes, and clean top hat anchor (local y = 0.42).
 */
export function RobotHead({
  headRef,
  leftEyeRef,
  rightEyeRef,
  leftEyeMatRef,
  rightEyeMatRef,
  headScale,
  bodyColor,
  visorColor,
  accentColor,
  armorEmissive,
  armorEmissiveIntensity,
  hatId,
}: RobotHeadProps) {
  return (
    <group ref={headRef} position={[0, 0.42, 0]} scale={[headScale, headScale, headScale]}>
      {/* Neck column */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.115, 0.085, 10]} />
        <meshStandardMaterial color={DARK_CHASSIS} roughness={0.45} metalness={0.6} />
      </mesh>

      {/* Main Beveled Helmet Chassis */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.43, 0.34, 0.38]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={armorEmissive}
          emissiveIntensity={armorEmissiveIntensity}
          roughness={0.28}
          metalness={0.42}
        />
      </mesh>
      {/* Helmet top bevel cap (clean hat anchor) */}
      <mesh position={[0, 0.415, 0]} castShadow>
        <boxGeometry args={[0.35, 0.03, 0.31]} />
        <meshStandardMaterial color={GUN_METAL} roughness={0.36} metalness={0.62} />
      </mesh>
      {/* Brow visor overhang */}
      <mesh position={[0, 0.345, -0.185]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.39, 0.055, 0.07]} />
        <meshStandardMaterial color={DARK_CHASSIS} roughness={0.38} metalness={0.6} />
      </mesh>

      {/* Side Ear Comms Pods with LED rings */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.235, 0.24, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.082, 0.082, 0.055, 10]} />
            <meshStandardMaterial color={GUN_METAL} roughness={0.4} metalness={0.64} />
          </mesh>
          <mesh position={[side * 0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.042, 0.042, 0.012, 10]} />
            <meshStandardMaterial
              color={visorColor}
              emissive={accentColor}
              emissiveIntensity={1.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Dark Recessed Visor Faceplate (-Z) */}
      <mesh position={[0, 0.235, -0.192]}>
        <boxGeometry args={[0.36, 0.165, 0.032]} />
        <meshStandardMaterial color="#090d16" roughness={0.18} metalness={0.75} />
      </mesh>

      {/* Glowing Expressive Visor Eyes */}
      <mesh ref={leftEyeRef} position={[-0.085, 0.24, -0.212]}>
        <boxGeometry args={[0.095, 0.068, 0.014]} />
        <meshStandardMaterial
          ref={leftEyeMatRef}
          color={visorColor}
          emissive={accentColor}
          emissiveIntensity={1.4}
          roughness={0.12}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.085, 0.24, -0.212]}>
        <boxGeometry args={[0.095, 0.068, 0.014]} />
        <meshStandardMaterial
          ref={rightEyeMatRef}
          color={visorColor}
          emissive={accentColor}
          emissiveIntensity={1.4}
          roughness={0.12}
          toneMapped={false}
        />
      </mesh>

      <RobotHat hatId={hatId} accentColor={accentColor} />
    </group>
  );
}
