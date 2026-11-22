import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { RobotAvatar } from "./cosmetics";

const STONE_BASE = "#e6dcc8";
const STONE_PLINTH = "#f4efe4";
const STONE_CARVED = "#d5c7ad";
const GOLD_TRIM = "#f59e0b";
const GOLD_BRIGHT = "#fbbf24";
const ACCENT_GLOW = "#38bdf8";

const FINIAL_ANGLES = [
  Math.PI * 0.25,
  Math.PI * 0.75,
  Math.PI * 1.25,
  Math.PI * 1.75,
] as const;

const HERO_SCALE = 1.24;
const PEDESTAL_TOP_Y = 0.72;
const ROBOT_FEET_LOCAL_Y = -0.9;
const HERO_POS_Y = PEDESTAL_TOP_Y - ROBOT_FEET_LOCAL_Y * HERO_SCALE;

export function LobbyHeroPedestal() {
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const status = useGameStore((s) => s.status);
  const bodyColor = useSettingsStore((s) => s.bodyColor);
  const hatId = useSettingsStore((s) => s.hatId);

  const heroTurntableRef = useRef<Group>(null);
  const haloRingRef = useRef<Mesh>(null);
  const phaseRef = useRef(0);

  const visible = lobbyOpen || status !== "connected";

  useFrame((_, delta) => {
    if (!visible) {
      return;
    }
    const dt = Math.min(delta, 0.1);
    phaseRef.current += dt;

    if (heroTurntableRef.current) {
      heroTurntableRef.current.rotation.y += dt * 0.48;
    }
    if (haloRingRef.current) {
      const pulse = 1 + Math.sin(phaseRef.current * 2.4) * 0.025;
      haloRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  if (!visible) {
    return null;
  }

  return (
    <group name="lobby_hero_pedestal" position={[0, 0, 0]}>
      {/* Wide sunlit travertine lower step */}
      <mesh position={[0, 0.11, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.42, 2.66, 0.22, 8]} />
        <meshStandardMaterial color={STONE_BASE} roughness={0.78} metalness={0.05} />
      </mesh>

      {/* Lower brushed-gold bevel ring */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[2.16, 2.26, 0.06, 8]} />
        <meshStandardMaterial color={GOLD_TRIM} roughness={0.28} metalness={0.82} />
      </mesh>

      {/* Sculpted octagonal marble plinth */}
      <mesh position={[0, 0.47, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.68, 1.94, 0.42, 8]} />
        <meshStandardMaterial color={STONE_PLINTH} roughness={0.62} metalness={0.06} />
      </mesh>

      {/* Recessed carved stone band */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <cylinderGeometry args={[1.86, 1.86, 0.12, 8]} />
        <meshStandardMaterial color={STONE_CARVED} roughness={0.75} metalness={0.08} />
      </mesh>

      {/* Upper gold medallion crown plate (top surface at y = 0.72) */}
      <mesh position={[0, 0.7, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.54, 1.64, 0.05, 32]} />
        <meshStandardMaterial color={GOLD_BRIGHT} roughness={0.22} metalness={0.88} />
      </mesh>

      {/* Inset stone standing pad */}
      <mesh position={[0, 0.722, 0]} receiveShadow>
        <cylinderGeometry args={[1.34, 1.38, 0.02, 32]} />
        <meshStandardMaterial color={STONE_PLINTH} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Luminous energy accent ring */}
      <mesh
        ref={haloRingRef}
        position={[0, 0.735, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.36, 1.44, 48]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive={ACCENT_GLOW}
          emissiveIntensity={1.25}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* Four sunlit stone-and-gold corner bollards */}
      {FINIAL_ANGLES.map((angle, idx) => {
        const radius = 2.18;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <group key={idx} position={[x, 0.22, z]}>
            <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.14, 0.18, 0.36, 6]} />
              <meshStandardMaterial color={STONE_PLINTH} roughness={0.7} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.39, 0]} castShadow>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color={GOLD_BRIGHT} roughness={0.22} metalness={0.88} />
            </mesh>
          </group>
        );
      })}

      {/* Warm sunlit rim light to showcase chassis finish & hat */}
      <pointLight
        position={[1.8, 3.2, 2.2]}
        color="#fef3c7"
        intensity={6.5}
        distance={9}
        decay={2}
      />

      {/* Heroic rotating customized player robot */}
      <group
        ref={heroTurntableRef}
        position={[0, HERO_POS_Y, 0]}
        scale={[HERO_SCALE, HERO_SCALE, HERO_SCALE]}
      >
        <RobotAvatar
          bodyColor={bodyColor}
          hatId={hatId}
          isAlive
          isMoving={false}
          pose="hero"
        />
      </group>
    </group>
  );
}
