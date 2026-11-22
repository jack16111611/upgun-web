import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { juiceBus, type ImpactSparkEvent } from "./juiceBus";

const MAX_SPARKS = 112;
const SPARK_GRAVITY = 15.5;
const UP_AXIS = new Vector3(0, 1, 0);

interface SparkParticle {
  active: boolean;
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  lifetime: number;
  size: number;
  color: Color;
}

/**
 * Pooled zero-allocation instanced metallic impact sparks & shrapnel shards.
 * Driven by juiceBus.pushImpactSparks() (automatically triggered on shot hits & explosions).
 */
export function ImpactParticles() {
  const meshRef = useRef<InstancedMesh | null>(null);
  const cursorRef = useRef(0);
  const incomingRef = useRef<ImpactSparkEvent[]>([]);

  const pool = useMemo<SparkParticle[]>(
    () =>
      Array.from({ length: MAX_SPARKS }, () => ({
        active: false,
        px: 0,
        py: -100,
        pz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        lifetime: 0.3,
        size: 1,
        color: new Color("#fbbf24"),
      })),
    [],
  );

  const scratch = useMemo(
    () => ({
      dummy: new Object3D(),
      velDir: new Vector3(),
      quat: new Quaternion(),
      color: new Color(),
      hotColor: new Color("#fef9c3"),
    }),
    [],
  );

  useFrame((_, delta) => {
    const instanced = meshRef.current;
    if (!instanced) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const incoming = incomingRef.current;
    incoming.length = 0;

    if (juiceBus.drainImpactSparks(incoming) > 0) {
      for (let e = 0; e < incoming.length; e++) {
        const evt = incoming[e];
        if (!evt) continue;

        for (let k = 0; k < evt.count; k++) {
          const idx = cursorRef.current;
          cursorRef.current = (idx + 1) % MAX_SPARKS;
          const p = pool[idx];
          if (!p) continue;

          const speed = 3.2 + Math.random() * 7.8;
          const spreadX = (Math.random() - 0.5) * 1.45;
          const spreadY = (Math.random() - 0.25) * 1.35;
          const spreadZ = (Math.random() - 0.5) * 1.45;

          const dirX = evt.dir.x * 0.65 + spreadX;
          const dirY = evt.dir.y * 0.55 + spreadY + 0.35;
          const dirZ = evt.dir.z * 0.65 + spreadZ;
          const norm = Math.hypot(dirX, dirY, dirZ) || 1;

          p.active = true;
          p.px = evt.origin.x;
          p.py = evt.origin.y;
          p.pz = evt.origin.z;
          p.vx = (dirX / norm) * speed;
          p.vy = (dirY / norm) * speed;
          p.vz = (dirZ / norm) * speed;
          p.age = 0;
          p.lifetime = 0.22 + Math.random() * 0.24;
          p.size = 0.75 + Math.random() * 0.75;
          p.color.set(k % 3 === 0 ? "#fef08a" : evt.color);
        }
      }
    }

    let anyUpdated = false;
    for (let i = 0; i < MAX_SPARKS; i++) {
      const p = pool[i];
      if (!p) continue;

      if (!p.active) {
        scratch.dummy.position.set(0, -500, 0);
        scratch.dummy.scale.set(0.0001, 0.0001, 0.0001);
        scratch.dummy.updateMatrix();
        instanced.setMatrixAt(i, scratch.dummy.matrix);
        continue;
      }

      anyUpdated = true;
      p.age += dt;
      if (p.age >= p.lifetime) {
        p.active = false;
        scratch.dummy.position.set(0, -500, 0);
        scratch.dummy.scale.set(0.0001, 0.0001, 0.0001);
        scratch.dummy.updateMatrix();
        instanced.setMatrixAt(i, scratch.dummy.matrix);
        continue;
      }

      // Physics integration with crisp drag & bounce
      p.vy -= SPARK_GRAVITY * dt;
      const drag = Math.exp(-3.2 * dt);
      p.vx *= drag;
      p.vz *= drag;
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;

      if (p.py < 0.03 && p.vy < 0) {
        p.py = 0.03;
        p.vy = -p.vy * 0.42;
        p.vx *= 0.72;
        p.vz *= 0.72;
      }

      const lifeRatio = 1 - p.age / p.lifetime;
      const speed = Math.hypot(p.vx, p.vy, p.vz);
      scratch.velDir.set(p.vx, p.vy, p.vz);
      if (speed > 0.01) {
        scratch.velDir.divideScalar(speed);
        scratch.quat.setFromUnitVectors(UP_AXIS, scratch.velDir);
      } else {
        scratch.quat.identity();
      }

      const thickness = 0.022 * p.size * lifeRatio;
      const length = Math.max(0.05, Math.min(0.32, speed * 0.032)) * p.size * lifeRatio;

      scratch.dummy.position.set(p.px, p.py, p.pz);
      scratch.dummy.quaternion.copy(scratch.quat);
      scratch.dummy.scale.set(thickness, length, thickness);
      scratch.dummy.updateMatrix();
      instanced.setMatrixAt(i, scratch.dummy.matrix);

      // Flash hot white-gold on birth then cool into spark hue
      scratch.color.copy(p.color).lerp(scratch.hotColor, Math.max(0, lifeRatio - 0.55) * 1.4);
      instanced.setColorAt(i, scratch.color);
    }

    instanced.instanceMatrix.needsUpdate = true;
    if (anyUpdated && instanced.instanceColor) {
      instanced.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_SPARKS]}
      name="impact_spark_particles"
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.92}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
