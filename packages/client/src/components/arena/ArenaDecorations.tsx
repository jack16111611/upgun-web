import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { ArenaTheme } from "@upgun/shared";
import {
  CypressTree,
  FoliageCluster,
  HangingBanner,
  PergolaCanopy,
  PitchedRoofPavilion,
  RecessedArchway,
  type Vec3Tuple,
} from "./ArchitecturalProps";

export interface ArenaDecorationsProps {
  preset: ArenaTheme["decorPreset"];
  halfSize: number;
}

function CourtyardDecorations({ halfSize }: { halfSize: number }) {
  const rippleRef = useRef<Mesh>(null);
  const o = halfSize + 2.4;
  const w = halfSize + 0.05;

  useFrame((state) => {
    if (rippleRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.04;
      rippleRef.current.scale.set(s, s, 1);
    }
  });

  const trees: readonly [Vec3Tuple, number][] = [
    [[-o, 0, -o], 1.22], [[o, 0, -o], 1.15], [[o, 0, o], 1.26], [[-o, 0, o], 1.12],
    [[-o - 1.4, 0, -7.2], 1.05], [[-o - 1.4, 0, 7.2], 1.18],
    [[o + 1.4, 0, -7.2], 1.16], [[o + 1.4, 0, 7.2], 1.04],
    [[-7.5, 0, -o - 1.3], 1.1], [[7.5, 0, -o - 1.3], 1.2],
    [[-7.5, 0, o + 1.3], 1.16], [[7.5, 0, o + 1.3], 1.08],
  ];
  const lanterns: readonly Vec3Tuple[] = [
    [-10, 6.75, -w - 0.45], [10, 6.75, -w - 0.45], [-10, 6.75, w + 0.45], [10, 6.75, w + 0.45],
    [-w - 0.45, 6.75, -10], [-w - 0.45, 6.75, 10], [w + 0.45, 6.75, -10], [w + 0.45, 6.75, 10],
  ];

  return (
    <group name="decor_courtyard">
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.8, 5.8]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.22} roughness={0.14} metalness={0.14} transparent opacity={0.78} />
      </mesh>
      <mesh ref={rippleRef} position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 2.05, 28]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.45} transparent opacity={0.62} roughness={0.1} />
      </mesh>

      <RecessedArchway position={[0, 0, -w]} rotationY={0} />
      <RecessedArchway position={[0, 0, w]} rotationY={Math.PI} />
      <RecessedArchway position={[-w, 0, 0]} rotationY={Math.PI / 2} />
      <RecessedArchway position={[w, 0, 0]} rotationY={-Math.PI / 2} />

      <HangingBanner position={[-6.8, 5.6, -w + 0.18]} color="#dc5c3b" phase={0} />
      <HangingBanner position={[6.8, 5.6, -w + 0.18]} color="#0284c7" phase={1.2} />
      <HangingBanner position={[-6.8, 5.6, w - 0.18]} rotationY={Math.PI} color="#0284c7" phase={2.1} />
      <HangingBanner position={[6.8, 5.6, w - 0.18]} rotationY={Math.PI} color="#dc5c3b" phase={3.3} />

      <PergolaCanopy position={[0, 6.2, -12.0]} width={10.2} depth={2.8} poleHeight={2.45} />
      <PergolaCanopy position={[0, 6.2, 12.0]} width={10.2} depth={2.8} poleHeight={2.45} />

      {trees.map(([pos, scale], idx) => (
        <CypressTree key={idx} position={pos} scale={scale} />
      ))}

      <FoliageCluster position={[-16.8, 0.45, -7.2]} radius={0.72} />
      <FoliageCluster position={[16.8, 0.45, 7.2]} radius={0.72} />
      <FoliageCluster position={[-16.8, 0.45, 7.2]} radius={0.66} />
      <FoliageCluster position={[16.8, 0.45, -7.2]} radius={0.66} />

      {lanterns.map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 1.1, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.55} />
          </mesh>
          <mesh position={[0, 1.24, 0]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.25} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TempleDecorations({ halfSize }: { halfSize: number }) {
  const cloudsRef = useRef<Group>(null);
  const ribbonsRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.018;
      cloudsRef.current.position.y = Math.sin(t * 0.55) * 0.45;
    }
    if (ribbonsRef.current) {
      ribbonsRef.current.rotation.y = -t * 0.12;
      ribbonsRef.current.position.y = Math.sin(t * 1.4) * 0.3;
    }
  });

  const clouds: readonly [Vec3Tuple, number][] = [
    [[-28, 4, -22], 1.5], [[30, 7, -18], 1.8], [[26, 2, 26], 1.6],
    [[-30, 6, 24], 1.7], [[0, 9, -34], 2.0], [[4, 3, 33], 1.9],
  ];
  const c = halfSize + 0.5;
  const w = halfSize + 0.05;
  const finials: readonly Vec3Tuple[] = [
    [-c, 6.75, -c], [c, 6.75, -c], [c, 6.75, c], [-c, 6.75, c],
  ];

  return (
    <group name="decor_temple">
      <PitchedRoofPavilion position={[0, 4.08, 0]} span={7.2} height={2.25} />
      <RecessedArchway position={[0, 0, -w]} stoneColor="#ece9df" recessColor="#64748b" />
      <RecessedArchway position={[0, 0, w]} rotationY={Math.PI} stoneColor="#ece9df" recessColor="#64748b" />

      <HangingBanner position={[-6.4, 5.7, -w + 0.18]} color="#0ea5e9" trimColor="#fef08a" phase={0.4} />
      <HangingBanner position={[6.4, 5.7, -w + 0.18]} color="#0ea5e9" trimColor="#fef08a" phase={1.7} />
      <HangingBanner position={[-6.4, 5.7, w - 0.18]} rotationY={Math.PI} color="#14b8a6" trimColor="#fef08a" phase={2.5} />
      <HangingBanner position={[6.4, 5.7, w - 0.18]} rotationY={Math.PI} color="#14b8a6" trimColor="#fef08a" phase={3.6} />

      <CypressTree position={[-c - 2.2, 0, -9]} scale={1.15} />
      <CypressTree position={[c + 2.2, 0, 9]} scale={1.15} />
      <CypressTree position={[-c - 2.2, 0, 9]} scale={1.08} />
      <CypressTree position={[c + 2.2, 0, -9]} scale={1.08} />

      <group ref={cloudsRef}>
        {clouds.map(([pos, s], idx) => (
          <group key={idx} position={pos} scale={s}>
            <mesh><icosahedronGeometry args={[2.2, 1]} /><meshStandardMaterial color="#ffffff" roughness={0.95} /></mesh>
            <mesh position={[-1.9, -0.35, 0.3]}><icosahedronGeometry args={[1.6, 1]} /><meshStandardMaterial color="#f0f9ff" roughness={0.95} /></mesh>
            <mesh position={[2.0, -0.25, -0.2]}><icosahedronGeometry args={[1.7, 1]} /><meshStandardMaterial color="#f8fafc" roughness={0.95} /></mesh>
          </group>
        ))}
      </group>

      {finials.map(([fx, fy, fz], idx) => (
        <PitchedRoofPavilion key={idx} position={[fx, fy, fz]} span={2.4} height={1.2} />
      ))}

      <group ref={ribbonsRef} position={[0, 9.8, 0]}>
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx * Math.PI) / 2;
          return (
            <mesh key={idx} position={[Math.cos(angle) * 23, (idx % 2) * 1.6, Math.sin(angle) * 23]} rotation={[0, -angle, 0.1]}>
              <boxGeometry args={[0.14, 0.42, 9.5]} />
              <meshStandardMaterial color="#bae6fd" emissive="#7dd3fc" emissiveIntensity={0.35} transparent opacity={0.55} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function CanyonDecorations({ halfSize }: { halfSize: number }) {
  const w = halfSize + 0.05;
  const mesas: readonly [Vec3Tuple, Vec3Tuple, string][] = [
    [[-38, 7, -34], [18, 16, 14], "#d1804f"], [[36, 9, -38], [22, 20, 16], "#c46d41"],
    [[42, 6, 32], [16, 14, 18], "#d98f5c"], [[-40, 8, 36], [20, 18, 16], "#c97648"],
    [[0, 10, -48], [28, 22, 12], "#be663e"], [[-48, 6, 2], [14, 14, 22], "#d68754"],
    [[48, 7, -4], [14, 16, 20], "#cb784a"],
  ];
  const bridgePosts = [-6.2, -2.2, 2.2, 6.2];

  return (
    <group name="decor_canyon">
      {mesas.map(([pos, size, color], idx) => (
        <group key={idx} position={pos}>
          <mesh><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.94} /></mesh>
          <mesh position={[0, size[1] * 0.5 + 1.2, 0]}>
            <boxGeometry args={[size[0] * 0.72, 2.4, size[2] * 0.72]} />
            <meshStandardMaterial color="#e09a68" roughness={0.92} />
          </mesh>
        </group>
      ))}

      <PergolaCanopy position={[6.0, 3.65, -9.6]} width={5.6} depth={4.4} poleHeight={3.65} clothColor="#dc2626" />
      <PergolaCanopy position={[-6.0, 3.65, 9.6]} width={5.6} depth={4.4} poleHeight={3.65} clothColor="#0d9488" />
      <PergolaCanopy position={[-10.8, 5.2, -5.2]} width={4.2} depth={4.2} poleHeight={2.6} clothColor="#f59e0b" />
      <PergolaCanopy position={[10.8, 5.2, 5.2]} width={4.2} depth={4.2} poleHeight={2.6} clothColor="#f59e0b" />

      {[-1.62, 1.62].map((zSide) => (
        <group key={zSide}>
          <mesh position={[0, 3.35, zSide]}>
            <boxGeometry args={[15.6, 0.06, 0.06]} />
            <meshStandardMaterial color="#b4834b" roughness={0.88} />
          </mesh>
          {bridgePosts.map((px, idx) => (
            <mesh key={idx} position={[px, 3.05, zSide]}>
              <cylinderGeometry args={[0.06, 0.07, 0.9, 6]} />
              <meshStandardMaterial color="#7a4c28" roughness={0.86} />
            </mesh>
          ))}
        </group>
      ))}

      <HangingBanner position={[-6.5, 5.6, -w + 0.18]} color="#ea580c" trimColor="#fde68a" phase={0.2} />
      <HangingBanner position={[6.5, 5.6, -w + 0.18]} color="#0d9488" trimColor="#fde68a" phase={1.5} />
      <HangingBanner position={[-6.5, 5.6, w - 0.18]} rotationY={Math.PI} color="#0d9488" trimColor="#fde68a" phase={2.4} />
      <HangingBanner position={[6.5, 5.6, w - 0.18]} rotationY={Math.PI} color="#ea580c" trimColor="#fde68a" phase={3.7} />

      <FoliageCluster position={[-16.2, 0.45, -1.2]} radius={0.62} />
      <FoliageCluster position={[16.2, 0.45, 1.2]} radius={0.62} />
    </group>
  );
}

function ConstructionDecorations({ halfSize }: { halfSize: number }) {
  const edge = halfSize + 0.5;
  const w = halfSize + 0.05;
  const outer = halfSize + 2.6;
  const rails: readonly [Vec3Tuple, Vec3Tuple][] = [
    [[0, 7.25, -edge], [36, 0.1, 0.1]], [[0, 7.25, edge], [36, 0.1, 0.1]],
    [[-edge, 7.25, 0], [0.1, 0.1, 36]], [[edge, 7.25, 0], [0.1, 0.1, 36]],
  ];
  const stacks: readonly [Vec3Tuple, number][] = [
    [[outer, 0.7, -8], 0], [[outer, 0.7, 8], 0],
    [[-8, 0.7, outer], Math.PI / 2], [[8, 0.7, -outer], Math.PI / 2],
  ];
  const stanchions = [-14, -7, 0, 7, 14];

  return (
    <group name="decor_construction">
      <group position={[-23, 0, -22]} rotation={[0, Math.PI * 0.22, 0]}>
        <mesh position={[0, 10, 0]} castShadow><boxGeometry args={[1.6, 20, 1.6]} /><meshStandardMaterial color="#eab308" roughness={0.48} metalness={0.38} /></mesh>
        <mesh position={[8.5, 19.2, 0]} castShadow><boxGeometry args={[28, 1.2, 1.2]} /><meshStandardMaterial color="#facc15" roughness={0.44} metalness={0.4} /></mesh>
        <mesh position={[-5.2, 18.6, 0]}><boxGeometry args={[3.4, 2.0, 1.8]} /><meshStandardMaterial color="#94a3b8" roughness={0.8} /></mesh>
        <mesh position={[16.5, 14.8, 0]}><cylinderGeometry args={[0.06, 0.06, 8.2, 6]} /><meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} /></mesh>
        <mesh position={[16.5, 10.5, 0]}><boxGeometry args={[0.85, 0.85, 0.85]} /><meshStandardMaterial color="#f97316" roughness={0.4} metalness={0.3} /></mesh>
      </group>

      {rails.map(([pos, size], idx) => (
        <mesh key={idx} position={pos}><boxGeometry args={size} /><meshStandardMaterial color="#facc15" roughness={0.44} metalness={0.4} /></mesh>
      ))}
      {stanchions.map((s) => (
        <group key={s}>
          <mesh position={[s, 7.0, -edge]}><boxGeometry args={[0.09, 0.6, 0.09]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.45} /></mesh>
          <mesh position={[s, 7.0, edge]}><boxGeometry args={[0.09, 0.6, 0.09]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.45} /></mesh>
          <mesh position={[-edge, 7.0, s]}><boxGeometry args={[0.09, 0.6, 0.09]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.45} /></mesh>
          <mesh position={[edge, 7.0, s]}><boxGeometry args={[0.09, 0.6, 0.09]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.45} /></mesh>
        </group>
      ))}

      <HangingBanner position={[-6.8, 5.7, -w + 0.18]} color="#eab308" trimColor="#1e293b" phase={0.3} />
      <HangingBanner position={[6.8, 5.7, -w + 0.18]} color="#0284c7" trimColor="#facc15" phase={1.4} />
      <HangingBanner position={[-6.8, 5.7, w - 0.18]} rotationY={Math.PI} color="#0284c7" trimColor="#facc15" phase={2.2} />
      <HangingBanner position={[6.8, 5.7, w - 0.18]} rotationY={Math.PI} color="#eab308" trimColor="#1e293b" phase={3.1} />

      {stacks.map(([pos, rot], idx) => (
        <group key={idx} position={pos} rotation={[0, rot, 0]}>
          {[-0.45, 0, 0.45].map((ox, bIdx) => (
            <mesh key={bIdx} position={[ox, 0, 0]}>
              <boxGeometry args={[0.32, 0.42, 7.2]} />
              <meshStandardMaterial color={bIdx === 1 ? "#eab308" : "#cbd5e1"} roughness={0.45} metalness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function ArenaDecorations({ preset, halfSize }: ArenaDecorationsProps) {
  switch (preset) {
    case "courtyard": return <CourtyardDecorations halfSize={halfSize} />;
    case "temple": return <TempleDecorations halfSize={halfSize} />;
    case "canyon": return <CanyonDecorations halfSize={halfSize} />;
    case "construction": return <ConstructionDecorations halfSize={halfSize} />;
  }
}
