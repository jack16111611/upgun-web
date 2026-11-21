import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { ArenaTheme } from "@upgun/shared";

export interface ArenaDecorationsProps {
  preset: ArenaTheme["decorPreset"];
  halfSize: number;
}

type Vec3Tuple = [number, number, number];

function CypressTree({ position, scale = 1 }: { position: Vec3Tuple; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.36, 2.6, 7]} />
        <meshStandardMaterial color="#8c5e3c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <coneGeometry args={[1.35, 4.6, 8]} />
        <meshStandardMaterial color="#3c8241" roughness={0.88} />
      </mesh>
      <mesh position={[0, 6.2, 0]} castShadow>
        <coneGeometry args={[0.92, 3.2, 8]} />
        <meshStandardMaterial color="#4b994c" roughness={0.86} />
      </mesh>
      <mesh position={[0, 7.6, 0]} castShadow>
        <coneGeometry args={[0.45, 1.8, 7]} />
        <meshStandardMaterial color="#5eb058" roughness={0.84} />
      </mesh>
    </group>
  );
}

function CourtyardDecorations({ halfSize }: { halfSize: number }) {
  const rippleRef = useRef<Mesh>(null);
  const o = halfSize + 2.4;
  const w = halfSize + 0.5;

  useFrame((state) => {
    if (rippleRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.04;
      rippleRef.current.scale.set(s, s, 1);
    }
  });

  const trees: readonly [Vec3Tuple, number][] = [
    [[-o, 0, -o], 1.25], [[o, 0, -o], 1.15], [[o, 0, o], 1.28], [[-o, 0, o], 1.12],
    [[-o - 1.5, 0, -6.5], 1.05], [[-o - 1.5, 0, 7.5], 1.2],
    [[o + 1.5, 0, -7.5], 1.18], [[o + 1.5, 0, 6.5], 1.02],
    [[-7.5, 0, -o - 1.4], 1.1], [[7.5, 0, -o - 1.4], 1.22],
    [[-7.5, 0, o + 1.4], 1.18], [[7.5, 0, o + 1.4], 1.06],
  ];

  const lanterns: readonly Vec3Tuple[] = [
    [-10, 6.4, -w], [10, 6.4, -w], [-10, 6.4, w], [10, 6.4, w],
    [-w, 6.4, -10], [-w, 6.4, 10], [w, 6.4, -10], [w, 6.4, 10],
  ];

  return (
    <group name="decor_courtyard">
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.4, 5.4]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.22}
          roughness={0.14}
          metalness={0.12}
          transparent
          opacity={0.78}
        />
      </mesh>
      <mesh ref={rippleRef} position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 2.05, 32]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#bae6fd"
          emissiveIntensity={0.45}
          transparent
          opacity={0.62}
          roughness={0.1}
        />
      </mesh>

      {trees.map(([pos, scale], idx) => (
        <CypressTree key={idx} position={pos} scale={scale} />
      ))}

      {lanterns.map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 1.2, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.32, 0]}>
            <octahedronGeometry args={[0.28, 0]} />
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
  const finials: readonly Vec3Tuple[] = [
    [-c, 6.6, -c], [c, 6.6, -c], [c, 6.6, c], [-c, 6.6, c],
  ];

  return (
    <group name="decor_temple">
      <group ref={cloudsRef}>
        {clouds.map(([pos, s], idx) => (
          <group key={idx} position={pos} scale={s}>
            <mesh>
              <icosahedronGeometry args={[2.2, 1]} />
              <meshStandardMaterial color="#ffffff" roughness={0.95} />
            </mesh>
            <mesh position={[-1.9, -0.35, 0.3]}>
              <icosahedronGeometry args={[1.6, 1]} />
              <meshStandardMaterial color="#f0f9ff" roughness={0.95} />
            </mesh>
            <mesh position={[2.0, -0.25, -0.2]}>
              <icosahedronGeometry args={[1.7, 1]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>

      {finials.map(([fx, fy, fz], idx) => (
        <group key={idx} position={[fx, fy, fz]}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[1.05, 0.9, 4]} />
            <meshStandardMaterial color="#cf5136" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.2, 1.2, 6]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.6} />
          </mesh>
        </group>
      ))}

      <group ref={ribbonsRef} position={[0, 9.5, 0]}>
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx * Math.PI) / 2;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * 23, (idx % 2) * 1.6, Math.sin(angle) * 23]}
              rotation={[0, -angle, 0.1]}
            >
              <boxGeometry args={[0.14, 0.42, 9.5]} />
              <meshStandardMaterial
                color="#bae6fd"
                emissive="#7dd3fc"
                emissiveIntensity={0.35}
                transparent
                opacity={0.55}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function CanyonDecorations() {
  const mesas: readonly [Vec3Tuple, Vec3Tuple, string][] = [
    [[-38, 7, -34], [18, 16, 14], "#d1804f"],
    [[36, 9, -38], [22, 20, 16], "#c46d41"],
    [[42, 6, 32], [16, 14, 18], "#d98f5c"],
    [[-40, 8, 36], [20, 18, 16], "#c97648"],
    [[0, 10, -48], [28, 22, 12], "#be663e"],
    [[-48, 6, 2], [14, 14, 22], "#d68754"],
    [[48, 7, -4], [14, 16, 20], "#cb784a"],
  ];

  const canopies: readonly [Vec3Tuple, [number, number], string][] = [
    [[6.0, 3.25, -9.4], [5.4, 4.4], "#dc2626"],
    [[-6.0, 3.25, 9.4], [5.4, 4.4], "#0d9488"],
    [[-11.0, 4.95, -5.5], [4.2, 4.2], "#f59e0b"],
    [[11.0, 4.95, 5.5], [4.2, 4.2], "#f59e0b"],
  ];

  return (
    <group name="decor_canyon">
      {mesas.map(([pos, size, color], idx) => (
        <group key={idx} position={pos}>
          <mesh>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} roughness={0.94} />
          </mesh>
          <mesh position={[0, size[1] * 0.5 + 1.2, 0]}>
            <boxGeometry args={[size[0] * 0.72, 2.4, size[2] * 0.72]} />
            <meshStandardMaterial color="#e09a68" roughness={0.92} />
          </mesh>
        </group>
      ))}

      {canopies.map(([pos, [w, d], color], idx) => {
        const [cx, cy, cz] = pos;
        const poleH = cy > 4 ? 2.15 : cy;
        const poleY = cy - poleH / 2;
        const corners: readonly [number, number][] = [
          [-w * 0.45, -d * 0.45], [w * 0.45, -d * 0.45],
          [-w * 0.45, d * 0.45], [w * 0.45, d * 0.45],
        ];
        return (
          <group key={idx}>
            <mesh position={[cx, cy, cz]} rotation={[0.06, 0, 0]} castShadow>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            {corners.map(([ox, oz], pIdx) => (
              <mesh key={pIdx} position={[cx + ox, poleY, cz + oz]}>
                <cylinderGeometry args={[0.05, 0.05, poleH, 6]} />
                <meshStandardMaterial color="#7c4d2b" roughness={0.85} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function ConstructionDecorations({ halfSize }: { halfSize: number }) {
  const edge = halfSize + 0.5;
  const outer = halfSize + 2.6;
  const rails: readonly [Vec3Tuple, Vec3Tuple][] = [
    [[0, 6.75, -edge], [36, 0.12, 0.12]],
    [[0, 6.75, edge], [36, 0.12, 0.12]],
    [[-edge, 6.75, 0], [0.12, 0.12, 36]],
    [[edge, 6.75, 0], [0.12, 0.12, 36]],
  ];
  const stacks: readonly [Vec3Tuple, number][] = [
    [[outer, 0.7, -8], 0], [[outer, 0.7, 8], 0],
    [[-8, 0.7, outer], Math.PI / 2], [[8, 0.7, -outer], Math.PI / 2],
  ];

  return (
    <group name="decor_construction">
      <group position={[-23, 0, -22]} rotation={[0, Math.PI * 0.22, 0]}>
        <mesh position={[0, 9.5, 0]} castShadow>
          <boxGeometry args={[1.6, 19, 1.6]} />
          <meshStandardMaterial color="#eab308" roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[8.5, 18.2, 0]} castShadow>
          <boxGeometry args={[28, 1.2, 1.2]} />
          <meshStandardMaterial color="#facc15" roughness={0.45} metalness={0.38} />
        </mesh>
        <mesh position={[-5.2, 17.6, 0]}>
          <boxGeometry args={[3.4, 2.0, 1.8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
        <mesh position={[16.5, 14.0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 8.0, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[16.5, 9.8, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {rails.map(([pos, size], idx) => (
        <mesh key={idx} position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#facc15" roughness={0.45} metalness={0.35} />
        </mesh>
      ))}

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
    case "courtyard":
      return <CourtyardDecorations halfSize={halfSize} />;
    case "temple":
      return <TempleDecorations halfSize={halfSize} />;
    case "canyon":
      return <CanyonDecorations />;
    case "construction":
      return <ConstructionDecorations halfSize={halfSize} />;
  }
}
