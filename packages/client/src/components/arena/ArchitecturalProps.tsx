import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export type Vec3Tuple = [number, number, number];

export function RecessedArchway({
  position,
  rotationY = 0,
  stoneColor = "#e2c89f",
  recessColor = "#7c5e42",
  width = 4.4,
  height = 4.6,
}: {
  position: Vec3Tuple;
  rotationY?: number;
  stoneColor?: string;
  recessColor?: string;
  width?: number;
  height?: number;
}) {
  const halfW = width * 0.5;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, height * 0.48, -0.06]}>
        <boxGeometry args={[width - 0.6, height - 0.5, 0.14]} />
        <meshStandardMaterial color={recessColor} roughness={0.92} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (halfW - 0.22), height * 0.45, 0.14]}>
          <mesh>
            <boxGeometry args={[0.52, height * 0.9, 0.42]} />
            <meshStandardMaterial color={stoneColor} roughness={0.82} />
          </mesh>
          <mesh position={[0, -height * 0.45 + 0.18, 0.04]}>
            <boxGeometry args={[0.68, 0.36, 0.52]} />
            <meshStandardMaterial color={stoneColor} roughness={0.86} />
          </mesh>
        </group>
      ))}
      {[-0.55, -0.22, 0.22, 0.55].map((ang, idx) => (
        <mesh
          key={idx}
          position={[Math.sin(ang) * (halfW - 0.25), height * 0.72 + Math.cos(ang) * 0.62, 0.18]}
          rotation={[0, 0, -ang]}
        >
          <boxGeometry args={[0.72, 0.36, 0.46]} />
          <meshStandardMaterial color={stoneColor} roughness={0.78} />
        </mesh>
      ))}
      <mesh position={[0, height * 0.72 + 0.76, 0.22]}>
        <boxGeometry args={[0.46, 0.52, 0.54]} />
        <meshStandardMaterial color="#f5ede0" roughness={0.68} />
      </mesh>
      <mesh position={[0, height + 0.12, 0.16]}>
        <boxGeometry args={[width + 0.6, 0.3, 0.58]} />
        <meshStandardMaterial color={stoneColor} roughness={0.76} />
      </mesh>
    </group>
  );
}

export function HangingBanner({
  position,
  rotationY = 0,
  color,
  trimColor = "#facc15",
  width = 1.15,
  height = 2.4,
  phase = 0,
}: {
  position: Vec3Tuple;
  rotationY?: number;
  color: string;
  trimColor?: string;
  width?: number;
  height?: number;
  phase?: number;
}) {
  const clothRef = useRef<Mesh>(null);
  useFrame((state) => {
    if (clothRef.current) {
      clothRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.9 + phase) * 0.055;
    }
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, width + 0.36, 6]} />
        <meshStandardMaterial color="#b48a4e" roughness={0.38} metalness={0.62} />
      </mesh>
      <mesh ref={clothRef} position={[0, -height * 0.5, 0.02]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, -height + 0.18, 0.05]}>
        <boxGeometry args={[width * 0.88, 0.14, 0.04]} />
        <meshStandardMaterial color={trimColor} roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

export function PitchedRoofPavilion({
  position,
  span = 7.4,
  height = 2.1,
  roofColor = "#cf5136",
  finialColor = "#facc15",
}: {
  position: Vec3Tuple;
  span?: number;
  height?: number;
  roofColor?: string;
  finialColor?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[span * 0.72, height * 0.62, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.72} />
      </mesh>
      <mesh position={[0, height * 0.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[span * 0.44, height * 0.72, 4]} />
        <meshStandardMaterial color="#de5f42" roughness={0.68} />
      </mesh>
      <mesh position={[0, height * 1.18, 0]}>
        <coneGeometry args={[0.16, 0.95, 6]} />
        <meshStandardMaterial color={finialColor} roughness={0.32} metalness={0.65} />
      </mesh>
    </group>
  );
}

export function FoliageCluster({
  position,
  radius = 0.65,
}: {
  position: Vec3Tuple;
  radius?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, radius * 0.25, 0]}>
        <icosahedronGeometry args={[radius, 0]} />
        <meshStandardMaterial color="#4ca643" roughness={0.9} />
      </mesh>
      <mesh position={[-radius * 0.55, 0, radius * 0.28]}>
        <icosahedronGeometry args={[radius * 0.72, 0]} />
        <meshStandardMaterial color="#3f9138" roughness={0.92} />
      </mesh>
      <mesh position={[radius * 0.52, 0.05, -radius * 0.25]}>
        <icosahedronGeometry args={[radius * 0.68, 0]} />
        <meshStandardMaterial color="#62bd54" roughness={0.88} />
      </mesh>
    </group>
  );
}

export function CypressTree({ position, scale = 1 }: { position: Vec3Tuple; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 2.6, 7]} />
        <meshStandardMaterial color="#875a38" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <coneGeometry args={[1.32, 4.5, 8]} />
        <meshStandardMaterial color="#3c8241" roughness={0.88} />
      </mesh>
      <mesh position={[0, 6.1, 0]} castShadow>
        <coneGeometry args={[0.9, 3.1, 8]} />
        <meshStandardMaterial color="#4b994c" roughness={0.86} />
      </mesh>
      <mesh position={[0, 7.5, 0]}>
        <coneGeometry args={[0.44, 1.7, 7]} />
        <meshStandardMaterial color="#5eb058" roughness={0.84} />
      </mesh>
    </group>
  );
}

export function PergolaCanopy({
  position,
  width,
  depth,
  poleHeight,
  clothColor,
}: {
  position: Vec3Tuple;
  width: number;
  depth: number;
  poleHeight: number;
  clothColor?: string;
}) {
  const [cx, cy, cz] = position;
  const poleY = cy - poleHeight * 0.5;
  const corners: readonly [number, number][] = [
    [-width * 0.45, -depth * 0.45],
    [width * 0.45, -depth * 0.45],
    [-width * 0.45, depth * 0.45],
    [width * 0.45, depth * 0.45],
  ];
  const slats = [-0.36, -0.18, 0, 0.18, 0.36];
  return (
    <group>
      {[-width * 0.45, width * 0.45].map((ox, idx) => (
        <mesh key={idx} position={[cx + ox, cy - 0.08, cz]}>
          <boxGeometry args={[0.14, 0.16, depth + 0.35]} />
          <meshStandardMaterial color="#7a4c2a" roughness={0.84} />
        </mesh>
      ))}
      {slats.map((f, idx) => (
        <mesh key={idx} position={[cx, cy + 0.03, cz + f * depth]}>
          <boxGeometry args={[width + 0.35, 0.1, 0.12]} />
          <meshStandardMaterial color="#915d36" roughness={0.82} />
        </mesh>
      ))}
      {clothColor && (
        <mesh position={[cx, cy + 0.11, cz]} rotation={[0.04, 0, 0]} castShadow>
          <boxGeometry args={[width * 0.94, 0.07, depth * 0.92]} />
          <meshStandardMaterial color={clothColor} roughness={0.88} />
        </mesh>
      )}
      {corners.map(([ox, oz], idx) => (
        <mesh key={idx} position={[cx + ox, poleY, cz + oz]}>
          <cylinderGeometry args={[0.065, 0.075, poleHeight, 6]} />
          <meshStandardMaterial color="#6e4324" roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}
