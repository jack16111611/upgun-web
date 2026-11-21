import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
  type MeshStandardMaterial,
} from "three";
import { arenaPropsRuntime, type SyncedBarrel } from "./arenaPropsRuntime";

const MAX_BARRELS = 12;
const BARREL_HEIGHT = 1.15;
const BARREL_RADIUS = 0.42;

function createHazardStripeTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#111827";
    const stripeWidth = 22;
    for (let x = -size; x < size * 2; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - size, size);
      ctx.lineTo(x - size, size);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface BarrelVisualsProps {
  barrelsRef: RefObject<readonly SyncedBarrel[] | undefined>;
}

export function BarrelVisuals({ barrelsRef }: BarrelVisualsProps) {
  const groupRefs = useRef<(Group | null)[]>([]);
  const bodyMatRefs = useRef<(MeshStandardMaterial | null)[]>([]);
  const ringMatRefs = useRef<(MeshStandardMaterial | null)[]>([]);

  const hazardTexture = useMemo(() => createHazardStripeTexture(), []);
  useEffect(() => {
    return () => {
      hazardTexture.dispose();
    };
  }, [hazardTexture]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const propBarrels = barrelsRef.current;
    const iter: Iterable<SyncedBarrel> = propBarrels ?? arenaPropsRuntime.barrels.values();

    let i = 0;
    for (const barrel of iter) {
      if (i >= MAX_BARRELS) break;
      const group = groupRefs.current[i];
      const bodyMat = bodyMatRefs.current[i];
      const ringMat = ringMatRefs.current[i];
      i += 1;
      if (!group || !bodyMat || !ringMat) continue;

      if (!barrel.isIntact) {
        group.visible = false;
        continue;
      }

      group.visible = true;
      const damaged = barrel.hp < barrel.maxHp;

      if (damaged) {
        const damageRatio = 1 - Math.max(0, barrel.hp) / Math.max(1, barrel.maxHp);
        const flickerHz = 10 + damageRatio * 14;
        const pulse = Math.sin(t * Math.PI * 2 * flickerHz) * 0.5 + 0.5;
        const jitter = (0.012 + damageRatio * 0.018) * Math.sin(t * 58 + i * 3.1);

        group.position.set(barrel.x + jitter, barrel.y, barrel.z - jitter * 0.7);
        bodyMat.emissive.set(pulse > 0.55 ? "#fef08a" : "#ef4444");
        bodyMat.emissiveIntensity = 0.55 + pulse * 1.45;
        ringMat.emissive.set(pulse > 0.5 ? "#ffffff" : "#fb923c");
        ringMat.emissiveIntensity = 1.8 + pulse * 1.6;
      } else {
        const idleGlow = 1.25 + Math.sin(t * 3.2 + i) * 0.25;
        group.position.set(barrel.x, barrel.y, barrel.z);
        bodyMat.emissive.set("#9a3412");
        bodyMat.emissiveIntensity = 0.28;
        ringMat.emissive.set("#fb923c");
        ringMat.emissiveIntensity = idleGlow;
      }
    }

    for (; i < MAX_BARRELS; i++) {
      const group = groupRefs.current[i];
      if (group) group.visible = false;
    }
  });

  return (
    <group name="arena_explosive_barrels">
      {Array.from({ length: MAX_BARRELS }, (_, idx) => (
        <group
          key={`barrel_${idx}`}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Main Red/Orange Metallic Plasma Cylinder */}
          <mesh position={[0, BARREL_HEIGHT * 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[BARREL_RADIUS, BARREL_RADIUS, BARREL_HEIGHT, 16]} />
            <meshStandardMaterial
              ref={(el) => {
                bodyMatRefs.current[idx] = el;
              }}
              color="#dc2626"
              metalness={0.58}
              roughness={0.34}
              emissive="#9a3412"
              emissiveIntensity={0.28}
            />
          </mesh>

          {/* Diagonal Hazard Stripe Mid-Band */}
          <mesh position={[0, BARREL_HEIGHT * 0.5, 0]}>
            <cylinderGeometry
              args={[BARREL_RADIUS + 0.012, BARREL_RADIUS + 0.012, 0.24, 16, 1, true]}
            />
            <meshStandardMaterial map={hazardTexture} roughness={0.45} metalness={0.25} />
          </mesh>

          {/* Bottom & Top Reinforced Steel Rims */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[BARREL_RADIUS + 0.03, BARREL_RADIUS + 0.03, 0.12, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.32} />
          </mesh>
          <mesh position={[0, BARREL_HEIGHT - 0.06, 0]}>
            <cylinderGeometry args={[BARREL_RADIUS + 0.03, BARREL_RADIUS + 0.03, 0.12, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.32} />
          </mesh>

          {/* Glowing Plasma Top Ring & Energy Core Cap */}
          <mesh position={[0, BARREL_HEIGHT + 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[BARREL_RADIUS * 0.72, 0.045, 8, 22]} />
            <meshStandardMaterial
              ref={(el) => {
                ringMatRefs.current[idx] = el;
              }}
              color="#fed7aa"
              emissive="#fb923c"
              emissiveIntensity={1.4}
              roughness={0.18}
            />
          </mesh>
          <mesh position={[0, BARREL_HEIGHT + 0.01, 0]}>
            <cylinderGeometry args={[BARREL_RADIUS * 0.45, BARREL_RADIUS * 0.45, 0.04, 14]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f97316"
              emissiveIntensity={1.6}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
