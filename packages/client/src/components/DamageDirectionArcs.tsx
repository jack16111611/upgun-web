import { useEffect, useState } from "react";
import { worldRuntime } from "../game/worldRuntime";

interface ActiveDamageArc {
  id: number;
  attackerX: number;
  attackerZ: number;
  fallbackLocalX: number;
  fallbackLocalZ: number;
  fallbackYaw: number;
  createdAt: number;
  durationMs: number;
}

interface RenderedDamageArc {
  id: number;
  angleDeg: number;
  opacity: number;
  scale: number;
}

const MAX_ACTIVE_ARCS = 6;
const ARC_DURATION_MS = 1150;

let nextArcId = 1;
const activeArcs: ActiveDamageArc[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readLocalPose(): { x: number; z: number; yaw: number } {
  const localId = worldRuntime.localSessionId;
  const localSnap = localId ? worldRuntime.players.get(localId) : undefined;
  if (localSnap) {
    return { x: localSnap.x, z: localSnap.z, yaw: localSnap.yaw };
  }
  return { x: 0, z: 0, yaw: worldRuntime.pendingSpawnYaw };
}

function computeRelativeBearingDeg(
  attackerX: number,
  attackerZ: number,
  localX: number,
  localZ: number,
  localYaw: number,
): number {
  const dx = attackerX - localX;
  const dz = attackerZ - localZ;
  if (dx * dx + dz * dz < 1e-6) {
    return 0;
  }

  // Matches Three.js YXZ yaw convention: forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw)
  const sinYaw = Math.sin(localYaw);
  const cosYaw = Math.cos(localYaw);
  const forwardDot = dx * -sinYaw + dz * -cosYaw;
  const rightDot = dx * cosYaw + dz * -sinYaw;

  return (Math.atan2(rightDot, forwardDot) * 180) / Math.PI;
}

export function pushDamageDirection(attackerPos: { x: number; z: number }): void {
  const now = performance.now();
  const pose = readLocalPose();

  // Coalesce rapid ticks from virtually the same attacker position
  const existing = activeArcs.find(
    (arc) =>
      Math.hypot(arc.attackerX - attackerPos.x, arc.attackerZ - attackerPos.z) < 0.85 &&
      now - arc.createdAt < 280,
  );
  if (existing) {
    existing.attackerX = attackerPos.x;
    existing.attackerZ = attackerPos.z;
    existing.createdAt = now;
    notifyListeners();
    return;
  }

  if (activeArcs.length >= MAX_ACTIVE_ARCS) {
    activeArcs.shift();
  }

  activeArcs.push({
    id: nextArcId++,
    attackerX: attackerPos.x,
    attackerZ: attackerPos.z,
    fallbackLocalX: pose.x,
    fallbackLocalZ: pose.z,
    fallbackYaw: pose.yaw,
    createdAt: now,
    durationMs: ARC_DURATION_MS,
  });
  notifyListeners();
}

export function clearDamageDirections(): void {
  if (activeArcs.length === 0) {
    return;
  }
  activeArcs.length = 0;
  notifyListeners();
}

function sampleRenderedArcs(now: number): RenderedDamageArc[] {
  let writeIdx = 0;
  for (let i = 0; i < activeArcs.length; i += 1) {
    const arc = activeArcs[i]!;
    if (now - arc.createdAt < arc.durationMs) {
      activeArcs[writeIdx++] = arc;
    }
  }
  activeArcs.length = writeIdx;

  if (activeArcs.length === 0) {
    return [];
  }

  const localId = worldRuntime.localSessionId;
  const localSnap = localId ? worldRuntime.players.get(localId) : undefined;

  return activeArcs.map((arc) => {
    const progress = Math.max(0, Math.min(1, (now - arc.createdAt) / arc.durationMs));
    const fadeOut = progress < 0.14 ? progress / 0.14 : Math.pow(1 - (progress - 0.14) / 0.86, 1.35);
    const scale = 1 + (1 - Math.min(1, progress * 5)) * 0.14;

    const localX = localSnap ? localSnap.x : arc.fallbackLocalX;
    const localZ = localSnap ? localSnap.z : arc.fallbackLocalZ;
    const localYaw = localSnap ? localSnap.yaw : arc.fallbackYaw;

    return {
      id: arc.id,
      angleDeg: computeRelativeBearingDeg(
        arc.attackerX,
        arc.attackerZ,
        localX,
        localZ,
        localYaw,
      ),
      opacity: Math.max(0, Math.min(1, fadeOut)),
      scale,
    };
  });
}

export function DamageDirectionArcs() {
  const [renderedArcs, setRenderedArcs] = useState<RenderedDamageArc[]>([]);

  useEffect(() => {
    let rafId: number | null = null;

    const tick = () => {
      rafId = null;
      const next = sampleRenderedArcs(performance.now());
      setRenderedArcs(next);
      if (next.length > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    };

    listeners.add(scheduleTick);
    if (activeArcs.length > 0) {
      scheduleTick();
    }

    return () => {
      listeners.delete(scheduleTick);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  if (renderedArcs.length === 0) {
    return null;
  }

  return (
    <div className="damage-arcs-layer" aria-hidden="true">
      {renderedArcs.map((arc) => (
        <svg
          key={arc.id}
          className="damage-arc-svg"
          viewBox="0 0 220 220"
          style={{
            opacity: arc.opacity,
            transform: `translate(-50%, -50%) rotate(${arc.angleDeg.toFixed(1)}deg) scale(${arc.scale.toFixed(3)})`,
          }}
        >
          <defs>
            <linearGradient id={`dmgArcGrad-${arc.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
              <stop offset="28%" stopColor="#ef4444" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#fca5a5" stopOpacity="1" />
              <stop offset="72%" stopColor="#ef4444" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Curved crimson directional arc */}
          <path
            d="M 62 34 A 88 88 0 0 1 158 34"
            fill="none"
            stroke={`url(#dmgArcGrad-${arc.id})`}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          {/* Crisp directional chevron peak pointing toward attacker */}
          <path
            d="M 99 24 L 110 11 L 121 24"
            fill="none"
            stroke="#fecaca"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}
