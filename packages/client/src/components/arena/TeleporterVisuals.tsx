import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { arenaPropsRuntime, type SyncedTeleporter } from "./arenaPropsRuntime";

const MAX_TELEPORT_FLASHES = 12;

interface PortalPadProps {
  position: [number, number, number];
  radius: number;
  color: string;
  phaseOffset: number;
}

function TeleporterPad({ position, radius, color, phaseOffset }: PortalPadProps) {
  const outerRingRef = useRef<Mesh>(null);
  const innerRingRef = useRef<Mesh>(null);
  const beamMatRef = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phaseOffset;
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 1.45;
      outerRingRef.current.position.y = 0.34 + Math.sin(t * 2.5) * 0.08;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 2.15;
      innerRingRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t * 1.8) * 0.24;
      innerRingRef.current.position.y = 0.72 + Math.cos(t * 2.8) * 0.1;
    }
    if (beamMatRef.current) {
      beamMatRef.current.opacity = 0.16 + Math.sin(t * 3.4) * 0.055;
    }
  });

  return (
    <group position={position}>
      {/* Metallic Base Housing */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 1.04, radius * 1.12, 0.09, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.42} metalness={0.72} />
      </mesh>

      {/* Glowing Portal Energy Floor Pad */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.06, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.65}
          roughness={0.18}
        />
      </mesh>

      {/* Rotating Twin Torus Rings */}
      <mesh ref={outerRingRef} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.9, 0.05, 8, 28]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={1.9}
          roughness={0.15}
        />
      </mesh>

      <mesh ref={innerRingRef} position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.68, 0.036, 8, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.85}
          roughness={0.15}
        />
      </mesh>

      {/* Translucent Vertical Warp Beam Column */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[radius * 0.72, radius * 0.82, 3.8, 20, 1, true]} />
        <meshBasicMaterial
          ref={beamMatRef}
          color={color}
          transparent
          opacity={0.18}
          blending={AdditiveBlending}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function TeleportFlashBursts() {
  const groupRefs = useRef<(Group | null)[]>([]);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const columnRefs = useRef<(Mesh | null)[]>([]);
  const ringMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const colMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);

  useFrame(() => {
    const now = performance.now();
    const flashes = arenaPropsRuntime.teleportFlashes;
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]!;
      if (now - f.createdAt >= f.durationMs) {
        flashes.splice(i, 1);
      }
    }

    for (let i = 0; i < MAX_TELEPORT_FLASHES; i++) {
      const group = groupRefs.current[i];
      const ring = ringRefs.current[i];
      const col = columnRefs.current[i];
      const ringMat = ringMatRefs.current[i];
      const colMat = colMatRefs.current[i];
      if (!group || !ring || !col || !ringMat || !colMat) continue;

      const flash = flashes[i];
      if (!flash) {
        group.visible = false;
        continue;
      }

      const progress = Math.min(1, Math.max(0, (now - flash.createdAt) / flash.durationMs));
      const inv = 1 - progress;
      group.visible = true;
      group.position.set(flash.position.x, flash.position.y, flash.position.z);

      const ringScale = 0.7 + progress * 2.1;
      ring.scale.set(ringScale, ringScale, 1);
      ring.position.y = progress * 1.4;
      ringMat.color.set(flash.color);
      ringMat.opacity = inv * 0.92;

      const colScale = 0.55 + (1 - progress) * 0.75;
      col.scale.set(colScale, 1 + progress * 0.65, colScale);
      colMat.color.set(flash.color);
      colMat.opacity = inv * inv * 0.72;
    }
  });

  return (
    <group name="arena_teleport_flashes">
      {Array.from({ length: MAX_TELEPORT_FLASHES }, (_, idx) => (
        <group
          key={`tp_flash_${idx}`}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh
            ref={(el) => {
              ringRefs.current[idx] = el;
            }}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[1.0, 0.08, 8, 24]} />
            <meshBasicMaterial
              ref={(el) => {
                ringMatRefs.current[idx] = el;
              }}
              color="#22d3ee"
              transparent
              opacity={0.8}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh
            ref={(el) => {
              columnRefs.current[idx] = el;
            }}
            position={[0, 1.5, 0]}
          >
            <cylinderGeometry args={[0.7, 0.95, 3.2, 16, 1, true]} />
            <meshBasicMaterial
              ref={(el) => {
                colMatRefs.current[idx] = el;
              }}
              color="#22d3ee"
              transparent
              opacity={0.65}
              blending={AdditiveBlending}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export interface TeleporterVisualsProps {
  teleporters: readonly SyncedTeleporter[];
}

export function TeleporterVisuals({ teleporters }: TeleporterVisualsProps) {
  return (
    <group name="arena_warp_teleporters">
      {teleporters.map((pair, idx) => (
        <group key={pair.id}>
          <TeleporterPad
            position={pair.a}
            radius={pair.radius}
            color={pair.colorA}
            phaseOffset={idx * 1.3}
          />
          <TeleporterPad
            position={pair.b}
            radius={pair.radius}
            color={pair.colorB}
            phaseOffset={idx * 1.3 + Math.PI * 0.5}
          />
        </group>
      ))}
      <TeleportFlashBursts />
    </group>
  );
}
