import { getAimDirection, MAX_PITCH_RAD, type Vec3 } from "@upgun/shared";

export type AimAssistPreset = "off" | "standard" | "strong";

export interface AimAssistCandidate {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface AimAssistInput {
  eyePos: Vec3;
  yaw: number;
  pitch: number;
  dt: number;
  targets: readonly AimAssistCandidate[];
  preset: AimAssistPreset;
  isAiming?: boolean;
  moveX?: number;
  autoFireEnabled?: boolean;
  nowMs?: number;
  hasLineOfSight?: (from: Vec3, to: Vec3) => boolean;
}

export interface AimAssistOutput {
  yaw: number;
  pitch: number;
  lookSensitivityScale: number;
  autoFire: boolean;
  lockedTargetId: string | null;
}

const DEG_TO_RAD = Math.PI / 180;
const AIM_ASSIST_MAX_RANGE = 48;
const AIM_ASSIST_MIN_RANGE = 0.65;
const AUTO_FIRE_MAX_RANGE = 44;
const AUTO_FIRE_LOCK_RAD = 3.8 * DEG_TO_RAD;
const AUTO_FIRE_BURST_SEC = 0.45;
const AUTO_FIRE_PAUSE_SEC = 0.14;
const AUTO_FIRE_CYCLE_SEC = AUTO_FIRE_BURST_SEC + AUTO_FIRE_PAUSE_SEC;

const CHEST_OFFSET_Y = 0.28;
const HEAD_OFFSET_Y = 0.56;
const HITBOX_RADIUS_M = 0.78;
const MIN_SLOWDOWN_BUBBLE_RAD = 4.4 * DEG_TO_RAD;

interface PresetTuning {
  coneRad: number;
  pullStrength: number;
  passivePullFactor: number;
  maxBlendPerStep: number;
  slowdownScale: number;
  strafeTrackStrength: number;
}

const PRESET_TUNING: Record<Exclude<AimAssistPreset, "off">, PresetTuning> = {
  standard: {
    coneRad: 10.0 * DEG_TO_RAD,
    pullStrength: 6.2,
    passivePullFactor: 0.45,
    maxBlendPerStep: 0.28,
    slowdownScale: 0.65,
    strafeTrackStrength: 3.4,
  },
  strong: {
    coneRad: 12.0 * DEG_TO_RAD,
    pullStrength: 9.6,
    passivePullFactor: 0.6,
    maxBlendPerStep: 0.38,
    slowdownScale: 0.55,
    strafeTrackStrength: 5.2,
  },
};

let lastAutoFireTargetId: string | null = null;
let autoFireLockOriginMs = 0;

export function resetAimAssistState(): void {
  lastAutoFireTargetId = null;
  autoFireLockOriginMs = 0;
}

function shortestAngleDiff(current: number, target: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function clampPitch(pitch: number): number {
  return Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, pitch));
}

function resolveAimPoint(
  eyePos: Vec3,
  candidate: AimAssistCandidate,
  hasLineOfSight?: (from: Vec3, to: Vec3) => boolean,
): Vec3 | null {
  const chestPoint: Vec3 = {
    x: candidate.x,
    y: candidate.y + CHEST_OFFSET_Y,
    z: candidate.z,
  };
  if (!hasLineOfSight) {
    return chestPoint;
  }
  if (hasLineOfSight(eyePos, chestPoint)) {
    return chestPoint;
  }
  const headPoint: Vec3 = {
    x: candidate.x,
    y: candidate.y + HEAD_OFFSET_Y,
    z: candidate.z,
  };
  if (hasLineOfSight(eyePos, headPoint)) {
    return headPoint;
  }
  return null;
}

interface BestTargetMatch {
  id: string;
  angle: number;
  dist: number;
  targetYaw: number;
  targetPitch: number;
}

function findBestTarget(
  eyePos: Vec3,
  yaw: number,
  pitch: number,
  targets: readonly AimAssistCandidate[],
  maxConeRad: number,
  maxRange: number,
  hasLineOfSight?: (from: Vec3, to: Vec3) => boolean,
): BestTargetMatch | null {
  if (targets.length === 0) {
    return null;
  }

  const aimDir = getAimDirection(yaw, pitch);
  let best: BestTargetMatch | null = null;
  let bestScore = Infinity;

  for (const candidate of targets) {
    const rawDx = candidate.x - eyePos.x;
    const rawDy = candidate.y + CHEST_OFFSET_Y - eyePos.y;
    const rawDz = candidate.z - eyePos.z;
    const rawDist = Math.hypot(rawDx, rawDy, rawDz);
    if (rawDist < AIM_ASSIST_MIN_RANGE || rawDist > maxRange) {
      continue;
    }

    // Coarse angular reject before expensive raycast LOS checks
    const coarseDot = (rawDx * aimDir.x + rawDy * aimDir.y + rawDz * aimDir.z) / rawDist;
    const coarseAngle = Math.acos(Math.max(-1, Math.min(1, coarseDot)));
    if (coarseAngle > maxConeRad + 0.04) {
      continue;
    }

    const aimPoint = resolveAimPoint(eyePos, candidate, hasLineOfSight);
    if (!aimPoint) {
      continue;
    }

    const dx = aimPoint.x - eyePos.x;
    const dy = aimPoint.y - eyePos.y;
    const dz = aimPoint.z - eyePos.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < AIM_ASSIST_MIN_RANGE || dist > maxRange) {
      continue;
    }

    const dot = (dx * aimDir.x + dy * aimDir.y + dz * aimDir.z) / dist;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle > maxConeRad) {
      continue;
    }

    // Prefer closest angular alignment with gentle distance weighting
    const score = angle + (dist / maxRange) * 0.035;
    if (score < bestScore) {
      bestScore = score;
      best = {
        id: candidate.id,
        angle,
        dist,
        targetYaw: Math.atan2(-dx, -dz),
        targetPitch: Math.atan2(dy, Math.hypot(dx, dz)),
      };
    }
  }

  return best;
}

function evaluateAutoFirePulse(targetId: string | null, nowMs: number): boolean {
  if (!targetId) {
    lastAutoFireTargetId = null;
    return false;
  }
  if (lastAutoFireTargetId !== targetId || nowMs < autoFireLockOriginMs) {
    lastAutoFireTargetId = targetId;
    autoFireLockOriginMs = nowMs;
  }
  const elapsedSec = Math.max(0, (nowMs - autoFireLockOriginMs) / 1000);
  const phaseSec = elapsedSec % AUTO_FIRE_CYCLE_SEC;
  return phaseSec < AUTO_FIRE_BURST_SEC;
}

export function computeMagneticAimAssist(input: AimAssistInput): AimAssistOutput {
  const {
    eyePos,
    yaw,
    pitch,
    dt,
    targets,
    preset,
    isAiming = true,
    moveX = 0,
    autoFireEnabled = false,
    nowMs = typeof performance !== "undefined" ? performance.now() : Date.now(),
    hasLineOfSight,
  } = input;

  const clampedDt = Math.max(0, Math.min(dt, 0.1));

  if (preset === "off") {
    if (!autoFireEnabled) {
      lastAutoFireTargetId = null;
      return {
        yaw,
        pitch,
        lookSensitivityScale: 1,
        autoFire: false,
        lockedTargetId: null,
      };
    }
    const autoTarget = findBestTarget(
      eyePos,
      yaw,
      pitch,
      targets,
      AUTO_FIRE_LOCK_RAD,
      AUTO_FIRE_MAX_RANGE,
      hasLineOfSight,
    );
    const lockedId = autoTarget ? autoTarget.id : null;
    return {
      yaw,
      pitch,
      lookSensitivityScale: 1,
      autoFire: evaluateAutoFirePulse(lockedId, nowMs),
      lockedTargetId: lockedId,
    };
  }

  const tuning = PRESET_TUNING[preset];
  const match = findBestTarget(
    eyePos,
    yaw,
    pitch,
    targets,
    tuning.coneRad,
    AIM_ASSIST_MAX_RANGE,
    hasLineOfSight,
  );

  if (!match) {
    lastAutoFireTargetId = null;
    return {
      yaw,
      pitch,
      lookSensitivityScale: 1,
      autoFire: false,
      lockedTargetId: null,
    };
  }

  const closeness = Math.max(0, 1 - match.angle / tuning.coneRad);

  // 1. Magnetic Target Pull toward upper chest / head
  const activeFactor = isAiming ? 1 : tuning.passivePullFactor;
  const pullBlend = Math.min(
    tuning.maxBlendPerStep,
    clampedDt * tuning.pullStrength * activeFactor * (0.42 + closeness * 0.58),
  );

  let nextYaw = yaw + shortestAngleDiff(yaw, match.targetYaw) * pullBlend;
  const nextPitch = clampPitch(pitch + (match.targetPitch - pitch) * pullBlend);

  // 2. Rotational Strafe Tracking proportional to lateral moveX
  const strafeIntensity = Math.min(1, Math.abs(moveX));
  if (strafeIntensity > 0.05) {
    const strafeBlend = Math.min(
      0.24,
      clampedDt * tuning.strafeTrackStrength * strafeIntensity * (0.5 + closeness * 0.5),
    );
    nextYaw += shortestAngleDiff(nextYaw, match.targetYaw) * strafeBlend;
  }

  // 3. Aim Slowdown Bubble when crosshair is over/near enemy hitbox
  const bubbleRad = Math.min(
    tuning.coneRad,
    Math.max(MIN_SLOWDOWN_BUBBLE_RAD, Math.atan2(HITBOX_RADIUS_M, match.dist)),
  );
  const lookSensitivityScale = match.angle <= bubbleRad ? tuning.slowdownScale : 1;

  // 4. Pulsed Auto-Fire on tight LOS crosshair lock
  const canAutoFire =
    autoFireEnabled &&
    match.dist <= AUTO_FIRE_MAX_RANGE &&
    match.angle <= AUTO_FIRE_LOCK_RAD;
  const autoFire = evaluateAutoFirePulse(canAutoFire ? match.id : null, nowMs);

  return {
    yaw: nextYaw,
    pitch: nextPitch,
    lookSensitivityScale,
    autoFire,
    lockedTargetId: match.id,
  };
}
