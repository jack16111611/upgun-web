import type { HatId } from "@upgun/shared";

const GUN_METAL = "#334155";
const DARK_TRIM = "#0f172a";

export interface RobotHatProps {
  hatId: HatId;
  accentColor: string;
}

/**
 * Wearable headgear anchored cleanly to the robot head crest at local y = 0.42.
 */
export function RobotHat({ hatId, accentColor }: RobotHatProps) {
  switch (hatId) {
    case "crown":
      return (
        <group position={[0, 0.425, 0]} name="hat_crown">
          {/* Base gold circlet */}
          <mesh position={[0, 0.042, 0]} castShadow>
            <cylinderGeometry args={[0.205, 0.185, 0.092, 10]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.82} roughness={0.2} />
          </mesh>
          {/* Inner velvet cushion */}
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.165, 0.165, 0.075, 10]} />
            <meshStandardMaterial color="#9f1239" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* 5 Crown spires */}
          {[
            [0, -0.175],
            [-0.165, -0.055],
            [0.165, -0.055],
            [-0.11, 0.145],
            [0.11, 0.145],
          ].map(([sx, sz], idx) => (
            <group key={idx} position={[sx ?? 0, 0.138, sz ?? 0]}>
              <mesh castShadow>
                <coneGeometry args={[0.05, 0.14, 4]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.84} roughness={0.18} />
              </mesh>
              <mesh position={[0, 0.075, 0]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshStandardMaterial color="#fef08a" metalness={0.7} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Front glowing ruby */}
          <mesh position={[0, 0.048, -0.2]}>
            <octahedronGeometry args={[0.042, 0]} />
            <meshStandardMaterial
              color="#fda4af"
              emissive="#f43f5e"
              emissiveIntensity={1.25}
              roughness={0.15}
              toneMapped={false}
            />
          </mesh>
        </group>
      );

    case "tophat":
      return (
        <group position={[0, 0.425, 0]} name="hat_tophat">
          {/* Crisp brim with metallic rim */}
          <mesh position={[0, 0.016, 0]} castShadow>
            <cylinderGeometry args={[0.275, 0.28, 0.034, 16]} />
            <meshStandardMaterial color={DARK_TRIM} roughness={0.42} metalness={0.35} />
          </mesh>
          {/* Tall tapered silk crown */}
          <mesh position={[0, 0.178, 0]} castShadow>
            <cylinderGeometry args={[0.185, 0.158, 0.305, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.38} metalness={0.38} />
          </mesh>
          {/* Glowing neon hatband */}
          <mesh position={[0, 0.062, 0]}>
            <cylinderGeometry args={[0.17, 0.164, 0.055, 16]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.25}
              roughness={0.18}
              toneMapped={false}
            />
          </mesh>
          {/* Front gold buckle accent */}
          <mesh position={[0, 0.062, -0.168]}>
            <boxGeometry args={[0.062, 0.064, 0.018]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.22} />
          </mesh>
        </group>
      );

    case "viking":
      return (
        <group position={[0, 0.395, 0]} name="hat_viking">
          {/* Forged steel dome */}
          <mesh castShadow>
            <sphereGeometry args={[0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Center ridge crest */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.045, 0.19, 0.44]} />
            <meshStandardMaterial color="#64748b" metalness={0.78} roughness={0.28} />
          </mesh>
          {/* Riveted iron brow band */}
          <mesh position={[0, 0.022, 0]} castShadow>
            <cylinderGeometry args={[0.242, 0.242, 0.055, 14]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.3} />
          </mesh>
          {/* Curved ivory horns with brass ferrules */}
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.215, 0.08, 0]}>
              <mesh rotation={[0, 0, side * -1.1]} castShadow>
                <cylinderGeometry args={[0.058, 0.062, 0.045, 8]} />
                <meshStandardMaterial color="#d97706" metalness={0.78} roughness={0.25} />
              </mesh>
              <mesh position={[side * 0.085, 0.042, 0]} rotation={[0, 0, side * -1.05]} castShadow>
                <cylinderGeometry args={[0.034, 0.054, 0.175, 8]} />
                <meshStandardMaterial color="#fef3c7" roughness={0.38} metalness={0.1} />
              </mesh>
              <mesh position={[side * 0.155, 0.165, 0]} rotation={[0, 0, side * -0.24]} castShadow>
                <coneGeometry args={[0.036, 0.17, 8]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.32} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
      );

    case "antenna":
      return (
        <group position={[0, 0.425, 0]} name="hat_antenna">
          {/* Transceiver base block */}
          <mesh position={[0, 0.022, 0]} castShadow>
            <boxGeometry args={[0.27, 0.052, 0.15]} />
            <meshStandardMaterial color={GUN_METAL} metalness={0.65} roughness={0.32} />
          </mesh>
          {/* Twin angled whip antennae with luminous orbs */}
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.095, 0.042, 0]} rotation={[0, 0, side * -0.24]}>
              <mesh position={[0, 0.03, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.036, 0.05, 8]} />
                <meshStandardMaterial color={DARK_TRIM} metalness={0.7} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.145, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.022, 0.25, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshStandardMaterial
                  color="#e0f2fe"
                  emissive={accentColor}
                  emissiveIntensity={1.55}
                  roughness={0.14}
                  toneMapped={false}
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
