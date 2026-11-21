import type { HatId } from "@upgun/shared";

const GUN_METAL = "#334155";

export interface RobotHatProps {
  hatId: HatId;
  accentColor: string;
}

export function RobotHat({ hatId, accentColor }: RobotHatProps) {
  switch (hatId) {
    case "crown":
      return (
        <group position={[0, 0.42, 0]} name="hat_crown">
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.09, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.78} roughness={0.22} />
          </mesh>
          {[
            [0, -0.17],
            [0, 0.17],
            [-0.17, 0],
            [0.17, 0],
          ].map(([sx, sz], idx) => (
            <mesh key={idx} position={[sx ?? 0, 0.14, sz ?? 0]} castShadow>
              <coneGeometry args={[0.055, 0.14, 4]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.05, -0.195]}>
            <boxGeometry args={[0.07, 0.06, 0.03]} />
            <meshStandardMaterial
              color="#fda4af"
              emissive="#f43f5e"
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
        </group>
      );

    case "tophat":
      return (
        <group position={[0, 0.42, 0]} name="hat_tophat">
          <mesh position={[0, 0.015, 0]} castShadow>
            <cylinderGeometry args={[0.27, 0.27, 0.035, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.17, 0]} castShadow>
            <cylinderGeometry args={[0.175, 0.155, 0.29, 14]} />
            <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.168, 0.162, 0.055, 14]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
        </group>
      );

    case "viking":
      return (
        <group position={[0, 0.39, 0]} name="hat_viking">
          <mesh castShadow>
            <sphereGeometry args={[0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.235, 0.235, 0.05, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.32} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.21, 0.08, 0]}>
              <mesh position={[side * 0.08, 0.04, 0]} rotation={[0, 0, side * -1.05]} castShadow>
                <cylinderGeometry args={[0.032, 0.052, 0.17, 7]} />
                <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.1} />
              </mesh>
              <mesh position={[side * 0.15, 0.16, 0]} rotation={[0, 0, side * -0.25]} castShadow>
                <coneGeometry args={[0.034, 0.16, 7]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.35} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
      );

    case "antenna":
      return (
        <group position={[0, 0.42, 0]} name="hat_antenna">
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.26, 0.05, 0.14]} />
            <meshStandardMaterial color={GUN_METAL} metalness={0.6} roughness={0.35} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.09, 0.04, 0]} rotation={[0, 0, side * -0.24]}>
              <mesh position={[0, 0.13, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.022, 0.26, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.27, 0]}>
                <sphereGeometry args={[0.048, 8, 8]} />
                <meshStandardMaterial
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={1.35}
                  roughness={0.15}
                />
              </mesh>
            </group>
          ))}
        </group>
      );

    case "none":
    default:
      return null;
  }
}
