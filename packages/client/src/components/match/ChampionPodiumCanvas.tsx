import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { HatId } from "@upgun/shared";
import { RobotAvatar } from "../cosmetics/RobotAvatar";

export interface ChampionPodiumCanvasProps {
  bodyColor: string;
  hatId: HatId;
  isBot?: boolean;
}

function PodiumTurntable({ bodyColor, hatId, isBot = false }: ChampionPodiumCanvasProps) {
  const turntableRef = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (turntableRef.current) {
      turntableRef.current.rotation.y += dt * 0.55;
    }
    if (haloRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.6) * 0.04;
      haloRef.current.scale.set(pulse, pulse, 1);
      haloRef.current.position.y = -0.75 + Math.sin(state.clock.elapsedTime * 2.0) * 0.025;
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Slowly rotating champion avatar facing +Z toward camera */}
      <group ref={turntableRef}>
        <group position={[0, 0.14, 0]} rotation={[0, Math.PI, 0]}>
          <RobotAvatar
            bodyColor={bodyColor}
            hatId={hatId}
            isAlive
            isMoving={false}
            isBot={isBot}
          />
        </group>

        {/* Subtle rotating pedestal accent studs */}
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx * Math.PI) / 2;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 0.78, -0.83, Math.sin(angle) * 0.78]}
            >
              <boxGeometry args={[0.07, 0.06, 0.07]} />
              <meshStandardMaterial
                color="#fde68a"
                emissive="#fbbf24"
                emissiveIntensity={1.4}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* Upper Trophy Pedestal Platform (top surface flush at y = -0.76) */}
      <mesh position={[0, -0.83, 0]}>
        <cylinderGeometry args={[0.74, 0.84, 0.14, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.32} metalness={0.72} />
      </mesh>

      {/* Lower Pedestal Tier */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.96, 1.12, 0.2, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.65} />
      </mesh>

      {/* Glowing Gold Crown Ring on Top Rim */}
      <mesh position={[0, -0.762, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.74, 0.024, 12, 48]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fbbf24"
          emissiveIntensity={1.8}
          roughness={0.15}
        />
      </mesh>

      {/* Pulsing Neon Energy Ring */}
      <mesh ref={haloRef} position={[0, -0.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.018, 12, 48]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={1.6}
          roughness={0.2}
        />
      </mesh>

      {/* Base Rim Glow */}
      <mesh position={[0, -1.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.02, 12, 48]} />
        <meshStandardMaterial
          color="#7dd3fc"
          emissive="#38bdf8"
          emissiveIntensity={1.35}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export function ChampionPodiumCanvas({
  bodyColor,
  hatId,
  isBot = false,
}: ChampionPodiumCanvasProps) {
  return (
    <div className="match-podium-stage" aria-label="3D Champion Trophy Podium">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.42, 3.35], fov: 38, near: 0.1, far: 30 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.35} color="#f8fafc" />
        <pointLight position={[-2.6, 2.0, 2.4]} intensity={1.45} color={bodyColor} distance={9} />
        <pointLight position={[2.4, 1.8, -2.2]} intensity={1.35} color="#fbbf24" distance={9} />
        <pointLight position={[0, -0.5, 1.1]} intensity={1.1} color="#38bdf8" distance={5} />

        <PodiumTurntable bodyColor={bodyColor} hatId={hatId} isBot={isBot} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
      <span className="match-podium-hint">Drag to inspect</span>
    </div>
  );
}
