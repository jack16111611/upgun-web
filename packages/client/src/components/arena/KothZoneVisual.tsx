import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { useGameStore } from "../../store/gameStore";

/**
 * Renders the active King of the Hill (KOTH) capture cylinder and pulsing perimeter rings
 * on the sunlit arena floor/platform.
 */
export function KothZoneVisual() {
  const kothZone = useGameStore((s) => s.kothZone);
  const gameMode = useGameStore((s) => s.gameMode);
  const phase = useGameStore((s) => s.phase);

  const ringGroupRef = useRef<Group>(null);
  const beamMatRef = useRef<MeshBasicMaterial>(null);
  const fillMeshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!kothZone.active || gameMode !== "koth") {
      return;
    }
    const t = state.clock.elapsedTime;
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += delta * (kothZone.contested ? 1.8 : 0.65);
    }
    if (beamMatRef.current) {
      const base = kothZone.overtime ? 0.24 : kothZone.contested ? 0.2 : 0.14;
      const pulse = Math.sin(t * (kothZone.contested ? 7.5 : 3.2)) * 0.05;
      beamMatRef.current.opacity = Math.max(0.06, base + pulse);
    }
    if (fillMeshRef.current) {
      const frac = Math.max(0.02, Math.min(1, kothZone.progress / 100));
      fillMeshRef.current.scale.set(frac, frac, 1);
    }
  });

  if (gameMode !== "koth" || !kothZone.active || phase === "lobby" || phase === "match_over") {
    return null;
  }

  const color = kothZone.overtime
    ? "#ef4444"
    : kothZone.contested
      ? "#f97316"
      : kothZone.ownerId
        ? "#0ea5e9"
        : "#eab308";

  const radius = Math.max(1.5, kothZone.radius);

  return (
    <group position={[kothZone.x, kothZone.y + 0.04, kothZone.z]} name="koth_zone">
      {/* Ground perimeter ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.18, radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} side={DoubleSide} />
      </mesh>

      {/* Capture progress inner fill disc */}
      <mesh ref={fillMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[radius - 0.2, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={DoubleSide} />
      </mesh>

      {/* Translucent vertical beacon wall */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[radius, radius, 3.6, 40, 1, true]} />
        <meshBasicMaterial
          ref={beamMatRef}
          color={color}
          transparent
          opacity={0.14}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* Rotating elevated halo ring */}
      <group ref={ringGroupRef} position={[0, 3.55, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.07, 8, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
}
