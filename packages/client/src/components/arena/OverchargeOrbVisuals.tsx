import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";
import { arenaPropsRuntime, type SyncedOrb } from "./arenaPropsRuntime";

const MAX_ORBS = 4;

export interface OverchargeOrbVisualsProps {
  orbsRef: RefObject<readonly SyncedOrb[] | undefined>;
}

export function OverchargeOrbVisuals({ orbsRef }: OverchargeOrbVisualsProps) {
  const slotRefs = useRef<(Group | null)[]>([]);
  const activeGroupRefs = useRef<(Group | null)[]>([]);
  const coreRefs = useRef<(Mesh | null)[]>([]);
  const ringARefs = useRef<(Mesh | null)[]>([]);
  const ringBRefs = useRef<(Mesh | null)[]>([]);
  const beaconMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const padRingMatRefs = useRef<(MeshStandardMaterial | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const propOrbs = orbsRef.current;
    const iter: Iterable<SyncedOrb> = propOrbs ?? arenaPropsRuntime.orbs.values();

    let i = 0;
    for (const orb of iter) {
      if (i >= MAX_ORBS) break;
      const slot = slotRefs.current[i];
      const activeGroup = activeGroupRefs.current[i];
      const core = coreRefs.current[i];
      const ringA = ringARefs.current[i];
      const ringB = ringBRefs.current[i];
      const beaconMat = beaconMatRefs.current[i];
      const padMat = padRingMatRefs.current[i];
      i += 1;

      if (!slot || !activeGroup || !core || !ringA || !ringB || !beaconMat || !padMat) {
        continue;
      }

      slot.visible = true;
      slot.position.set(orb.x, orb.y, orb.z);

      if (orb.isActive) {
        activeGroup.visible = true;
        const bob = Math.sin(t * 2.6 + i) * 0.16;
        core.position.y = bob;
        core.rotation.y = t * 1.45;
        core.rotation.x = t * 0.75;

        ringA.position.y = bob;
        ringA.rotation.x = Math.PI * 0.35 + t * 1.7;
        ringA.rotation.y = t * 1.1;

        ringB.position.y = bob;
        ringB.rotation.x = -Math.PI * 0.35 - t * 1.25;
        ringB.rotation.z = t * 1.6;

        beaconMat.opacity = 0.14 + Math.sin(t * 3.8 + i) * 0.05;
        padMat.emissive.set("#38bdf8");
        padMat.emissiveIntensity = 1.6 + Math.sin(t * 4.5) * 0.35;
      } else {
        activeGroup.visible = false;
        padMat.emissive.set("#1e3a8a");
        padMat.emissiveIntensity = 0.35 + Math.sin(t * 2.2) * 0.18;
      }
    }

    for (; i < MAX_ORBS; i++) {
      const slot = slotRefs.current[i];
      if (slot) slot.visible = false;
    }
  });

  return (
    <group name="arena_overcharge_orbs">
      {Array.from({ length: MAX_ORBS }, (_, idx) => (
        <group
          key={`orb_${idx}`}
          ref={(el) => {
            slotRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Pedestal Holo-Ring at floor/surface below the floating orb */}
          <mesh position={[0, -1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.045, 8, 28]} />
            <meshStandardMaterial
              ref={(el) => {
                padRingMatRefs.current[idx] = el;
              }}
              color="#7dd3fc"
              emissive="#38bdf8"
              emissiveIntensity={1.5}
              roughness={0.2}
            />
          </mesh>

          {/* Active Floating Core, Orbiting Energy Rings & Skyward Beacon */}
          <group
            ref={(el) => {
              activeGroupRefs.current[idx] = el;
            }}
          >
            <mesh
              ref={(el) => {
                coreRefs.current[idx] = el;
              }}
              castShadow
            >
              <icosahedronGeometry args={[0.38, 1]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#38bdf8"
                emissiveIntensity={2.1}
                metalness={0.35}
                roughness={0.12}
              />
            </mesh>

            <mesh
              ref={(el) => {
                ringARefs.current[idx] = el;
              }}
            >
              <torusGeometry args={[0.64, 0.036, 8, 28]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#f59e0b"
                emissiveIntensity={1.9}
                roughness={0.15}
              />
            </mesh>

            <mesh
              ref={(el) => {
                ringBRefs.current[idx] = el;
              }}
            >
              <torusGeometry args={[0.78, 0.026, 8, 28]} />
              <meshStandardMaterial
                color="#67e8f9"
                emissive="#22d3ee"
                emissiveIntensity={1.85}
                roughness={0.15}
              />
            </mesh>

            {/* Vertical Beacon Column visible across the arena */}
            <mesh position={[0, 4.2, 0]}>
              <cylinderGeometry args={[0.24, 0.56, 10.5, 16, 1, true]} />
              <meshBasicMaterial
                ref={(el) => {
                  beaconMatRefs.current[idx] = el;
                }}
                color="#38bdf8"
                transparent
                opacity={0.16}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
