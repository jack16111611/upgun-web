import { WEAPON_MELEE, type Vec3 } from "../constants";

const MIN_VECTOR_LEN = 1e-6;
const MIN_DEFLECT_BASE_SPEED = 14;
const DEFLECT_UPWARD_LIFT = 2.4;

export interface MeleeTargetCandidate {
  id: string;
  position: Vec3;
  radius?: number;
}

export interface MeleeHitTarget {
  id: string;
  distance: number;
  alignment: number;
  knockback: Vec3;
}

export interface MeleeGrenadeCandidate {
  id: string;
  position: Vec3;
  velocity: Vec3;
}

export interface DeflectedGrenadeResult {
  id: string;
  distance: number;
  newVelocity: Vec3;
}

function normalizeVec3(v: Vec3): Vec3 | null {
  const len = Math.hypot(v.x, v.y, v.z);
  if (!Number.isFinite(len) || len <= MIN_VECTOR_LEN) {
    return null;
  }
  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len,
  };
}

/**
 * Computes a horizontal melee knockback impulse vector along `aimDir` with a
 * slight upward lift so grounded targets reliably launch clear of floor friction.
 */
export function computeMeleeKnockback(
  aimDir: Vec3,
  force: number = WEAPON_MELEE.knockbackForce,
): Vec3 {
  const safeForce = Number.isFinite(force) && force > 0 ? force : 0;
  if (safeForce <= 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const horizLen = Math.hypot(aimDir.x, aimDir.z);
  const upwardLift = Math.min(5.0, Math.max(2.6, safeForce * 0.24));

  if (!Number.isFinite(horizLen) || horizLen <= MIN_VECTOR_LEN) {
    return { x: 0, y: upwardLift, z: 0 };
  }

  const invLen = safeForce / horizLen;
  return {
    x: aimDir.x * invLen,
    y: upwardLift,
    z: aimDir.z * invLen,
  };
}

/**
 * Pure cone cleave query returning all candidates within `range` inside the
 * forward cone (`dot(toTarget, aimDir) >= coneCos`), sorted nearest-first.
 */
export function findMeleeConeTargets(
  origin: Vec3,
  aimDir: Vec3,
  range: number,
  coneCos: number,
  candidates: readonly MeleeTargetCandidate[],
): MeleeHitTarget[] {
  if (!Number.isFinite(range) || range <= 0 || candidates.length === 0) {
    return [];
  }

  const normAim = normalizeVec3(aimDir);
  if (!normAim) {
    return [];
  }

  const baseKnockback = computeMeleeKnockback(normAim);
  const hits: MeleeHitTarget[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate) {
      continue;
    }

    const dx = candidate.position.x - origin.x;
    const dy = candidate.position.y - origin.y;
    const dz = candidate.position.z - origin.z;
    const centerDist = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(centerDist)) {
      continue;
    }

    const targetRadius =
      candidate.radius !== undefined && Number.isFinite(candidate.radius) && candidate.radius > 0
        ? candidate.radius
        : 0;
    const surfaceDist = Math.max(0, centerDist - targetRadius);
    if (surfaceDist > range) {
      continue;
    }

    let alignment: number;
    if (centerDist <= MIN_VECTOR_LEN) {
      alignment = 1;
    } else {
      alignment = (dx * normAim.x + dy * normAim.y + dz * normAim.z) / centerDist;
      if (centerDist > targetRadius && alignment < coneCos) {
        continue;
      }
    }

    hits.push({
      id: candidate.id,
      distance: surfaceDist,
      alignment,
      knockback: {
        x: baseKnockback.x,
        y: baseKnockback.y,
        z: baseKnockback.z,
      },
    });
  }

  hits.sort((a, b) => {
    const distDiff = a.distance - b.distance;
    if (Math.abs(distDiff) > 1e-4) {
      return distDiff;
    }
    return b.alignment - a.alignment;
  });

  return hits;
}

/**
 * Pure grenade parry/deflection test returning all grenades within `radius`
 * along with their deflected velocity along `aimDir` at
 * `WEAPON_MELEE.deflectSpeedScale` plus slight upward lift.
 */
export function findDeflectableGrenades(
  origin: Vec3,
  aimDir: Vec3,
  radius: number,
  grenades: readonly MeleeGrenadeCandidate[],
): DeflectedGrenadeResult[] {
  if (!Number.isFinite(radius) || radius <= 0 || grenades.length === 0) {
    return [];
  }

  const normAim = normalizeVec3(aimDir);
  if (!normAim) {
    return [];
  }

  const deflected: DeflectedGrenadeResult[] = [];

  for (let i = 0; i < grenades.length; i++) {
    const grenade = grenades[i];
    if (!grenade) {
      continue;
    }

    const dx = grenade.position.x - origin.x;
    const dy = grenade.position.y - origin.y;
    const dz = grenade.position.z - origin.z;
    const dist = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(dist) || dist > radius) {
      continue;
    }

    const incomingSpeed = Math.hypot(
      grenade.velocity.x,
      grenade.velocity.y,
      grenade.velocity.z,
    );
    const safeSpeed = Number.isFinite(incomingSpeed) ? incomingSpeed : 0;
    const deflectedSpeed =
      Math.max(safeSpeed, MIN_DEFLECT_BASE_SPEED) * WEAPON_MELEE.deflectSpeedScale;

    deflected.push({
      id: grenade.id,
      distance: dist,
      newVelocity: {
        x: normAim.x * deflectedSpeed,
        y: normAim.y * deflectedSpeed + DEFLECT_UPWARD_LIFT,
        z: normAim.z * deflectedSpeed,
      },
    });
  }

  deflected.sort((a, b) => a.distance - b.distance);
  return deflected;
}
