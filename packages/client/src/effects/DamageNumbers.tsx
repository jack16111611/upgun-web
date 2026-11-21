import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace, type Sprite, type SpriteMaterial } from "three";
import { juiceBus, type DamageNumberEvent } from "./juiceBus";

const MAX_DAMAGE_NUMBERS = 32;
const LIFETIME_MS = 850;
const MAX_CACHED_TEXTURES = 96;

type DamageVariant = "normal" | "crit" | "kill";

interface ActiveDamageNumber {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  createdAt: number;
  variant: DamageVariant;
  texture: CanvasTexture;
  baseScale: number;
}

function getVariant(ev: DamageNumberEvent): DamageVariant {
  if (ev.isKill) {
    return "kill";
  }
  if (ev.isCrit) {
    return "crit";
  }
  return "normal";
}

function createDamageTexture(label: string, variant: DamageVariant): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fontSize = variant === "kill" ? 78 : variant === "crit" ? 72 : 64;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 2;

    // Soft neon drop shadow for legibility
    ctx.shadowColor =
      variant === "kill"
        ? "rgba(244, 63, 94, 0.85)"
        : variant === "crit"
          ? "rgba(250, 204, 21, 0.8)"
          : "rgba(15, 23, 42, 0.75)";
    ctx.shadowBlur = variant === "normal" ? 8 : 14;

    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = variant === "kill" ? 15 : 13;
    ctx.strokeText(label, cx, cy);

    const grad = ctx.createLinearGradient(0, cy - 36, 0, cy + 36);
    if (variant === "kill") {
      grad.addColorStop(0, "#fef08a");
      grad.addColorStop(0.55, "#fb7185");
      grad.addColorStop(1, "#e11d48");
    } else if (variant === "crit") {
      grad.addColorStop(0, "#fef9c3");
      grad.addColorStop(0.6, "#facc15");
      grad.addColorStop(1, "#f97316");
    } else {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.75, "#fef3c7");
      grad.addColorStop(1, "#fcd34d");
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = grad;
    ctx.fillText(label, cx, cy);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function DamageNumbers() {
  const spriteRefs = useRef<(Sprite | null)[]>([]);
  const matRefs = useRef<(SpriteMaterial | null)[]>([]);
  const activeRef = useRef<ActiveDamageNumber[]>([]);
  const incomingRef = useRef<DamageNumberEvent[]>([]);

  const textureCache = useMemo(() => new Map<string, CanvasTexture>(), []);

  useEffect(() => {
    return () => {
      for (const tex of textureCache.values()) {
        tex.dispose();
      }
      textureCache.clear();
    };
  }, [textureCache]);

  const getCachedTexture = (amount: number, variant: DamageVariant): CanvasTexture => {
    const label = variant === "kill" || variant === "crit" ? `${amount}!` : `${amount}`;
    const key = `${label}|${variant}`;
    const existing = textureCache.get(key);
    if (existing) {
      return existing;
    }

    if (textureCache.size >= MAX_CACHED_TEXTURES) {
      const oldestKey = textureCache.keys().next().value;
      if (oldestKey !== undefined) {
        textureCache.get(oldestKey)?.dispose();
        textureCache.delete(oldestKey);
      }
    }

    const created = createDamageTexture(label, variant);
    textureCache.set(key, created);
    return created;
  };

  useFrame(({ camera }) => {
    const now = performance.now();
    const active = activeRef.current;
    const incoming = incomingRef.current;

    incoming.length = 0;
    if (juiceBus.drainDamageNumbers(incoming) > 0) {
      for (let i = 0; i < incoming.length; i++) {
        const ev = incoming[i];
        if (!ev) {
          continue;
        }
        const variant = getVariant(ev);
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.45 + Math.random() * 0.55;
        if (active.length >= MAX_DAMAGE_NUMBERS) {
          active.shift();
        }
        active.push({
          x: ev.x + (Math.random() - 0.5) * 0.25,
          y: ev.y + 0.35 + Math.random() * 0.15,
          z: ev.z + (Math.random() - 0.5) * 0.25,
          vx: Math.cos(angle) * speed,
          vz: Math.sin(angle) * speed,
          createdAt: ev.createdAt,
          variant,
          texture: getCachedTexture(ev.amount, variant),
          baseScale: variant === "kill" ? 1.25 : variant === "crit" ? 1.12 : 0.92,
        });
      }
    }

    for (let i = active.length - 1; i >= 0; i--) {
      const item = active[i];
      if (!item || now - item.createdAt >= LIFETIME_MS) {
        active.splice(i, 1);
      }
    }

    for (let i = 0; i < MAX_DAMAGE_NUMBERS; i++) {
      const sprite = spriteRefs.current[i];
      const mat = matRefs.current[i];
      if (!sprite || !mat) {
        continue;
      }

      const item = active[i];
      if (!item) {
        sprite.visible = false;
        continue;
      }

      const t = Math.min(1, Math.max(0, (now - item.createdAt) / LIFETIME_MS));
      const easeOut = 1 - Math.pow(1 - t, 3);
      const px = item.x + item.vx * easeOut * 0.65;
      const py = item.y + easeOut * 1.45;
      const pz = item.z + item.vz * easeOut * 0.65;

      sprite.visible = true;
      sprite.position.set(px, py, pz);

      // Punchy overshoot scale-pop in first 18%, then settle and gently shrink
      let pop: number;
      if (t < 0.14) {
        pop = 0.45 + (t / 0.14) * 0.9;
      } else if (t < 0.28) {
        pop = 1.35 - ((t - 0.14) / 0.14) * 0.35;
      } else {
        pop = 1 - Math.max(0, t - 0.68) * 0.45;
      }

      const dist = camera.position.distanceTo(sprite.position);
      const distFactor = Math.max(0.65, Math.min(2.15, dist * 0.065));
      const height = item.baseScale * pop * distFactor;
      sprite.scale.set(height * 2, height, 1);

      if (mat.map !== item.texture) {
        mat.map = item.texture;
        mat.needsUpdate = true;
      }

      const fade = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.35) : 1;
      mat.opacity = fade;
    }
  });

  return (
    <group name="damage_numbers">
      {Array.from({ length: MAX_DAMAGE_NUMBERS }, (_, idx) => (
        <sprite
          key={`dmg_${idx}`}
          ref={(el) => {
            spriteRefs.current[idx] = el;
          }}
          visible={false}
          renderOrder={20}
          frustumCulled={false}
        >
          <spriteMaterial
            ref={(el) => {
              matRefs.current[idx] = el;
            }}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
