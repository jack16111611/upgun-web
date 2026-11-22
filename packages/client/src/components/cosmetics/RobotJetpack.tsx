import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";

const DARK_CHASSIS = "#1e293b";
const GUN_METAL = "#334155";
const TITANIUM = "#64748b";

export interface RobotJetpackProps {
  bodyColor: string;
  accentColor: string;
  isAirborne?: boolean;
  isDashing?: boolean;
  moveSpeed?: number;
}

/**
 * Dual-nozzle UpGun jetpack thruster pack mounted on the rear torso (+Z)
 * with dynamic emissive plasma flame cones when jumping/airborne or dashing.
 */
export function RobotJetpack({
  bodyColor,
  accentColor,
  isAirborne = false,
  isDashing = false,
  moveSpeed = 0,
}: RobotJetpackProps) {
  const leftOuterRef = useRef<Group>(null);
  const rightOuterRef = useRef<Group>(null);
  const leftOuterMatRef = useRef<MeshBasicMaterial>(null);
  const rightOuterMatRef = useRef<MeshBasicMaterial>(null);
  const leftCoreMatRef = useRef<MeshBasicMaterial>(null);
  const rightCoreMatRef = useRef<MeshBasicMaterial>(null);
  const coreCellMatRef = useRef<MeshStandardMaterial>(null);

  const thrustRef = useRef(0);
  const flickerPhaseRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    flickerPhaseRef.current += dt * (isDashing ? 46 : isAirborne ? 32 : 16);

    const speedRatio = Math.min(1, Math.max(0, moveSpeed) / 10);
    const targetThrust = isDashing ? 1.55 : isAirborne ? 1.0 : speedRatio * 0.22;
    const alpha = 1 - Math.exp(-16 * dt);
    thrustRef.current += (targetThrust - thrustRef.current) * alpha;

    const thrust = thrustRef.current;
    const t = flickerPhaseRef.current;
    const flickerL = 0.88 + Math.sin(t) * 0.12 + Math.cos(t * 2.3) * 0.06;
    const flickerR = 0.88 + Math.cos(t * 1.07) * 0.12 + Math.sin(t * 2.1) * 0.06;

    const visible = thrust > 0.08;
    const flameColor = isDashing ? "#fde047" : accentColor;
    const coreColor = isDashing ? "#ffffff" : "#e0f2fe";

    if (leftOuterRef.current) {
      leftOuterRef.current.visible = visible;
      if (visible) {
        const lenL = Math.max(0.15, thrust * flickerL);
        const widL = 0.65 + thrust * 0.35;
        leftOuterRef.current.scale.set(widL, lenL, widL);
      }
    }
    if (rightOuterRef.current) {
      rightOuterRef.current.visible = visible;
      if (visible) {
        const lenR = Math.max(0.15, thrust * flickerR);
        const widR = 0.65 + thrust * 0.35;
        rightOuterRef.current.scale.set(widR, lenR, widR);
      }
    }

    const outerOpacity = Math.min(0.95, thrust * 0.72);
    const coreOpacity = Math.min(1, thrust * 0.9);
    if (leftOuterMatRef.current) {
      leftOuterMatRef.current.color.set(flameColor);
      leftOuterMatRef.current.opacity = outerOpacity;
    }
    if (rightOuterMatRef.current) {
      rightOuterMatRef.current.color.set(flameColor);
      rightOuterMatRef.current.opacity = outerOpacity;
    }
    if (leftCoreMatRef.current) {
      leftCoreMatRef.current.color.set(coreColor);
      leftCoreMatRef.current.opacity = coreOpacity;
    }
    if (rightCoreMatRef.current) {
      rightCoreMatRef.current.color.set(coreColor);
      rightCoreMatRef.current.opacity = coreOpacity;
    }
    if (coreCellMatRef.current) {
      coreCellMatRef.current.emissive.set(isDashing ? "#facc15" : accentColor);
      coreCellMatRef.current.emissiveIntensity = 0.9 + thrust * 1.4;
    }
  });

  return (
    <group position={[0, 0.16, 0.21]} name="robot_jetpack">
      {/* Central armor housing */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.3, 0.12]} />
        <meshStandardMaterial color={GUN_METAL} roughness={0.42} metalness={0.58} />
      </mesh>
      {/* Top color cowl */}
      <mesh position={[0, 0.145, -0.01]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.06, 0.12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.34} metalness={0.42} />
      </mesh>
      {/* Central fusion cell core */}
      <mesh position={[0, 0.02, 0.065]}>
        <boxGeometry args={[0.1, 0.16, 0.026]} />
        <meshStandardMaterial
          ref={coreCellMatRef}
          color="#e0f2fe"
          emissive={accentColor}
          emissiveIntensity={1.0}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* Twin thruster pods & nozzles */}
      {([-1, 1] as const).map((side) => {
        const isLeft = side === -1;
        return (
          <group key={side} position={[side * 0.135, -0.01, 0.02]} rotation={[0.16, 0, side * -0.06]}>
            {/* Cylindrical fuel pod */}
            <mesh castShadow>
              <cylinderGeometry args={[0.062, 0.068, 0.28, 10]} />
              <meshStandardMaterial color={DARK_CHASSIS} roughness={0.38} metalness={0.65} />
            </mesh>
            {/* Heat sink band */}
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.068, 0.068, 0.045, 10]} />
              <meshStandardMaterial color={TITANIUM} roughness={0.3} metalness={0.78} />
            </mesh>
            {/* Flared thruster nozzle */}
            <mesh position={[0, -0.165, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.072, 0.085, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.8} />
            </mesh>
            {/* Inner hot nozzle ring */}
            <mesh position={[0, -0.202, 0]}>
              <cylinderGeometry args={[0.046, 0.046, 0.016, 10]} />
              <meshBasicMaterial color={accentColor} toneMapped={false} />
            </mesh>

            {/* Dynamic Emissive Flame Cone */}
            <group
              ref={isLeft ? leftOuterRef : rightOuterRef}
              position={[0, -0.21, 0]}
              visible={false}
            >
              {/* Outer plasma cone */}
              <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.066, 0.42, 8]} />
                <meshBasicMaterial
                  ref={isLeft ? leftOuterMatRef : rightOuterMatRef}
                  color={accentColor}
                  transparent
                  opacity={0.75}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              {/* Inner white-hot plasma core */}
              <mesh position={[0, -0.125, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.036, 0.26, 8]} />
                <meshBasicMaterial
                  ref={isLeft ? leftCoreMatRef : rightCoreMatRef}
                  color="#e0f2fe"
                  transparent
                  opacity={0.92}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
