import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { WEAPON_GRENADE } from "@upgun/shared";
import { Quaternion, Vector3, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from "three";
import { worldRuntime } from "../game/worldRuntime";

const MAX_TRACERS = 24;
const MAX_GRENADES = 16;
const MAX_EXPLOSIONS = 12;

const UP_AXIS = new Vector3(0, 1, 0);

export function CombatEffects() {
  const tracerRefs = useRef<(Mesh | null)[]>([]);
  const tracerMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);

  const grenadeRefs = useRef<(Mesh | null)[]>([]);
  const grenadeMatRefs = useRef<(MeshStandardMaterial | null)[]>([]);

  const explosionRefs = useRef<(Mesh | null)[]>([]);
  const explosionMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);

  const scratch = useMemo(
    () => ({
      start: new Vector3(),
      end: new Vector3(),
      dir: new Vector3(),
      mid: new Vector3(),
      quat: new Quaternion(),
    }),
    [],
  );

  useFrame(() => {
    const now = performance.now();

    // Prune expired tracers and update pooled beams
    const tracers = worldRuntime.tracers;
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i]!;
      if (now - t.createdAt >= t.durationMs) {
        tracers.splice(i, 1);
      }
    }

    for (let i = 0; i < MAX_TRACERS; i++) {
      const mesh = tracerRefs.current[i];
      const mat = tracerMatRefs.current[i];
      if (!mesh || !mat) {
        continue;
      }
      const tracer = tracers[i];
      if (!tracer) {
        mesh.visible = false;
        continue;
      }

      scratch.start.set(tracer.origin.x, tracer.origin.y, tracer.origin.z);
      scratch.end.set(tracer.end.x, tracer.end.y, tracer.end.z);
      scratch.dir.subVectors(scratch.end, scratch.start);
      const len = scratch.dir.length();
      if (len < 0.01) {
        mesh.visible = false;
        continue;
      }

      scratch.mid.addVectors(scratch.start, scratch.end).multiplyScalar(0.5);
      scratch.dir.divideScalar(len);
      scratch.quat.setFromUnitVectors(UP_AXIS, scratch.dir);

      mesh.visible = true;
      mesh.position.copy(scratch.mid);
      mesh.quaternion.copy(scratch.quat);
      mesh.scale.set(1, len, 1);

      const alpha = Math.max(0, 1 - (now - tracer.createdAt) / tracer.durationMs);
      mat.opacity = alpha * 0.95;
      mat.color.set(tracer.hit ? "#fb7185" : "#fde047");
    }

    // Update pooled bouncing grenade meshes
    const grenadeList = [...worldRuntime.grenades.values()];
    for (let i = 0; i < MAX_GRENADES; i++) {
      const mesh = grenadeRefs.current[i];
      const mat = grenadeMatRefs.current[i];
      if (!mesh || !mat) {
        continue;
      }
      const grenade = grenadeList[i];
      if (!grenade) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;
      mesh.position.set(grenade.x, grenade.y, grenade.z);

      // Flash faster as fuse approaches detonation
      const flashHz = grenade.fuseLeft < 0.65 ? 14 : 5;
      const pulse = Math.sin(now * 0.001 * Math.PI * 2 * flashHz) > 0;
      mat.emissive.set(pulse ? "#ef4444" : "#450a0a");
      mat.emissiveIntensity = pulse ? 1.8 : 0.35;
    }

    // Prune expired explosions and update expanding flash spheres
    const explosions = worldRuntime.explosions;
    for (let i = explosions.length - 1; i >= 0; i--) {
      const e = explosions[i]!;
      if (now - e.createdAt >= e.durationMs) {
        explosions.splice(i, 1);
      }
    }

    for (let i = 0; i < MAX_EXPLOSIONS; i++) {
      const mesh = explosionRefs.current[i];
      const mat = explosionMatRefs.current[i];
      if (!mesh || !mat) {
        continue;
      }
      const explosion = explosions[i];
      if (!explosion) {
        mesh.visible = false;
        continue;
      }

      const t = Math.min(1, (now - explosion.createdAt) / explosion.durationMs);
      const scale = 0.4 + Math.pow(t, 0.45) * explosion.radius;
      mesh.visible = true;
      mesh.position.set(explosion.position.x, explosion.position.y, explosion.position.z);
      mesh.scale.setScalar(scale);

      mat.opacity = Math.max(0, (1 - t) * 0.65);
      mat.color.set(t < 0.3 ? "#fef08a" : "#f97316");
    }
  });

  return (
    <group name="combat_effects">
      {Array.from({ length: MAX_TRACERS }, (_, idx) => (
        <mesh
          key={`tracer_${idx}`}
          ref={(el) => {
            tracerRefs.current[idx] = el;
          }}
          visible={false}
        >
          <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
          <meshBasicMaterial
            ref={(el) => {
              tracerMatRefs.current[idx] = el;
            }}
            color="#fde047"
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}

      {Array.from({ length: MAX_GRENADES }, (_, idx) => (
        <mesh
          key={`grenade_${idx}`}
          ref={(el) => {
            grenadeRefs.current[idx] = el;
          }}
          visible={false}
          castShadow
        >
          <sphereGeometry args={[WEAPON_GRENADE.radius, 14, 14]} />
          <meshStandardMaterial
            ref={(el) => {
              grenadeMatRefs.current[idx] = el;
            }}
            color="#1e293b"
            roughness={0.3}
            metalness={0.6}
            emissive="#ef4444"
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {Array.from({ length: MAX_EXPLOSIONS }, (_, idx) => (
        <mesh
          key={`explosion_${idx}`}
          ref={(el) => {
            explosionRefs.current[idx] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 20, 20]} />
          <meshBasicMaterial
            ref={(el) => {
              explosionMatRefs.current[idx] = el;
            }}
            color="#f97316"
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
