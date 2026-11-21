import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, World } from "@dimforge/rapier3d-compat";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_PITCH_RAD,
  PLAYER_EYE_OFFSET_Y,
  ROOM_CODE_LENGTH,
  type DeviceType,
  type Vec3,
} from "./constants";
import type { InputFrame } from "./input";

export interface MoveAxes {
  forwardX: number;
  forwardZ: number;
  rightX: number;
  rightZ: number;
}

export function getMoveAxes(yaw: number): MoveAxes {
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);
  return {
    forwardX: -sinY,
    forwardZ: -cosY,
    rightX: cosY,
    rightZ: -sinY,
  };
}

export function getAimDirection(yaw: number, pitch: number): Vec3 {
  const clampedPitch = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, pitch));
  const cosP = Math.cos(clampedPitch);
  return {
    x: -Math.sin(yaw) * cosP,
    y: Math.sin(clampedPitch),
    z: -Math.cos(yaw) * cosP,
  };
}

export function getEyePosition(pos: Vec3): Vec3 {
  return {
    x: pos.x,
    y: pos.y + PLAYER_EYE_OFFSET_Y,
    z: pos.z,
  };
}

function clampFinite(value: unknown, min: number, max: number, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

export function sanitizeDisplayName(raw: unknown, fallback = "Player"): string {
  if (typeof raw !== "string") {
    return fallback.slice(0, MAX_DISPLAY_NAME_LENGTH);
  }
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : fallback.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function sanitizeDeviceType(raw: unknown): DeviceType {
  if (raw === "mobile" || raw === "gamepad" || raw === "desktop") {
    return raw;
  }
  return "desktop";
}

export function sanitizeRoomCode(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

export function sanitizeInputFrame(raw: unknown): InputFrame {
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawYaw = typeof data.yaw === "number" && Number.isFinite(data.yaw) ? data.yaw : 0;

  return {
    moveX: clampFinite(data.moveX, -1, 1, 0),
    moveZ: clampFinite(data.moveZ, -1, 1, 0),
    yaw: Math.atan2(Math.sin(rawYaw), Math.cos(rawYaw)),
    pitch: clampFinite(data.pitch, -MAX_PITCH_RAD, MAX_PITCH_RAD, 0),
    jump: Boolean(data.jump),
    dash: Boolean(data.dash),
    fire: Boolean(data.fire),
    grenade: Boolean(data.grenade),
    reload: Boolean(data.reload),
    melee: Boolean(data.melee),
  };
}

export interface HitscanResult {
  collider: Collider;
  distance: number;
  point: Vec3;
}

export function isFiniteVec3(v: unknown): v is Vec3 {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Vec3;
  return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
}

export function castHitscanRay(
  rapier: typeof RAPIER,
  world: World,
  origin: Vec3,
  direction: Vec3,
  maxRange: number,
  excludeCollider?: Collider,
  filterPredicate?: (collider: Collider) => boolean,
): HitscanResult | null {
  if (
    !isFiniteVec3(origin) ||
    !isFiniteVec3(direction) ||
    !Number.isFinite(maxRange) ||
    maxRange <= 0
  ) {
    return null;
  }
  const dirLen = Math.hypot(direction.x, direction.y, direction.z);
  if (!Number.isFinite(dirLen) || dirLen < 1e-6) {
    return null;
  }
  const unitDir: Vec3 = {
    x: direction.x / dirLen,
    y: direction.y / dirLen,
    z: direction.z / dirLen,
  };

  const ray = new rapier.Ray(origin, unitDir);
  const hit = world.castRay(
    ray,
    maxRange,
    true,
    undefined,
    undefined,
    excludeCollider,
    undefined,
    filterPredicate,
  );

  if (!hit) {
    return null;
  }

  const toi = hit.timeOfImpact;
  return {
    collider: hit.collider,
    distance: toi,
    point: {
      x: origin.x + unitDir.x * toi,
      y: origin.y + unitDir.y * toi,
      z: origin.z + unitDir.z * toi,
    },
  };
}

export function computeSplashDamage(
  distance: number,
  splashRadius: number,
  maxDamage: number,
): number {
  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(splashRadius) ||
    !Number.isFinite(maxDamage) ||
    distance >= splashRadius ||
    splashRadius <= 0 ||
    maxDamage <= 0
  ) {
    return 0;
  }
  const falloff = Math.max(0, 1 - distance / splashRadius);
  return Math.round(maxDamage * falloff);
}

export function hasLineOfSight(
  rapier: typeof RAPIER,
  world: World,
  from: Vec3,
  to: Vec3,
  targetCollider: Collider,
  filterPredicate?: (collider: Collider) => boolean,
): boolean {
  if (!isFiniteVec3(from) || !isFiniteVec3(to)) {
    return false;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(dist) || dist < 0.05) {
    return true;
  }

  const dir: Vec3 = { x: dx / dist, y: dy / dist, z: dz / dist };
  const ray = new rapier.Ray(from, dir);
  const hit = world.castRay(
    ray,
    dist,
    true,
    undefined,
    undefined,
    undefined,
    undefined,
    filterPredicate,
  );

  if (!hit) {
    return true;
  }
  return hit.collider.handle === targetCollider.handle || hit.timeOfImpact >= dist - 0.1;
}
