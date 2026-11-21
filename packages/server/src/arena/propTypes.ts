import type { RigidBody, World } from "@dimforge/rapier3d-compat";
import {
  PLAYER_CAPSULE_CENTER_Y,
  PLAYER_SPAWN_Y,
  type ExplosionEvent,
  type TeleportEvent,
  type Vec3,
} from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";
import type { TeleporterPairDef } from "./mapPropsData";

export const BARREL_MAX_HP = 40;
export const BARREL_RESPAWN_SEC = 15;
export const BARREL_RADIUS = 0.44;
export const BARREL_HEIGHT = 1.15;
export const BARREL_EXPLOSION_RADIUS = 6.0;
export const BARREL_EXPLOSION_MAX_DAMAGE = 75;

export const TELEPORTER_COOLDOWN_SEC = 1.5;

export const ORB_RESPAWN_SEC = 20;
export const ORB_PICKUP_RADIUS = 1.35;
export const ORB_OVERSHIELD_AMOUNT = 50;
export const ORB_FIRE_RATE_MULTIPLIER = 1.35;
export const ORB_BUFF_DURATION_SEC = 8;

export interface BarrelExplosionCallbacks {
  onExplosion?: (event: ExplosionEvent) => void;
  onSplashDamage?: (
    origin: Vec3,
    radius: number,
    maxDamage: number,
    attackerId: string | null,
    barrelId: string,
  ) => void;
}

export interface BarrelRaycastHit {
  barrelId: string;
  distance: number;
  point: Vec3;
}

export interface TeleportableGrenade {
  id: string;
  body: RigidBody;
}

export interface BarrelSnapshot {
  id: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  isIntact: boolean;
  respawnTimer: number;
}

export interface OrbSnapshot {
  id: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  respawnTimer: number;
}

export interface TeleporterSnapshot {
  id: string;
  a: [number, number, number];
  b: [number, number, number];
  radius: number;
  colorA: string;
  colorB: string;
}

export interface ArenaPropsSnapshot {
  mapId: string;
  barrels: BarrelSnapshot[];
  teleporters: TeleporterSnapshot[];
  orbs: OrbSnapshot[];
}

export function intersectRayCylinder(
  origin: Vec3,
  dir: Vec3,
  maxDist: number,
  cx: number,
  baseY: number,
  cz: number,
  radius: number,
  height: number,
): number | null {
  const ox = origin.x - cx;
  const oz = origin.z - cz;
  const rSq = radius * radius;
  let bestT = Number.POSITIVE_INFINITY;

  const a = dir.x * dir.x + dir.z * dir.z;
  if (a > 1e-8) {
    const b = 2 * (ox * dir.x + oz * dir.z);
    const c = ox * ox + oz * oz - rSq;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sqrtDisc = Math.sqrt(disc);
      const t0 = (-b - sqrtDisc) / (2 * a);
      const t1 = (-b + sqrtDisc) / (2 * a);
      for (const t of [t0, t1]) {
        if (t >= 0 && t <= maxDist && t < bestT) {
          const hitY = origin.y + dir.y * t;
          if (hitY >= baseY && hitY <= baseY + height) {
            bestT = t;
          }
        }
      }
    }
  }

  if (Math.abs(dir.y) > 1e-6) {
    for (const capY of [baseY, baseY + height]) {
      const t = (capY - origin.y) / dir.y;
      if (t >= 0 && t <= maxDist && t < bestT) {
        const hx = ox + dir.x * t;
        const hz = oz + dir.z * t;
        if (hx * hx + hz * hz <= rSq) {
          bestT = t;
        }
      }
    }
  }

  return bestT <= maxDist ? bestT : null;
}

export function findTeleporterDest(
  teleporters: readonly TeleporterPairDef[],
  x: number,
  y: number,
  z: number,
): { dest: [number, number, number]; color: string } | null {
  for (const pair of teleporters) {
    const rSq = pair.radius * pair.radius;
    const dyA = y - pair.a[1];
    if (dyA >= -0.45 && dyA <= 1.15) {
      const dx = x - pair.a[0];
      const dz = z - pair.a[2];
      if (dx * dx + dz * dz <= rSq) {
        return { dest: pair.b, color: pair.colorB };
      }
    }
    const dyB = y - pair.b[1];
    if (dyB >= -0.45 && dyB <= 1.15) {
      const dx = x - pair.b[0];
      const dz = z - pair.b[2];
      if (dx * dx + dz * dz <= rSq) {
        return { dest: pair.a, color: pair.colorA };
      }
    }
  }
  return null;
}

export function stepTeleportersRuntime(
  teleporters: readonly TeleporterPairDef[],
  cooldowns: Map<string, number>,
  players: Map<string, PlayerEntity>,
  grenades: Iterable<TeleportableGrenade> | Map<string, TeleportableGrenade>,
  world: World,
  dt: number,
  onTeleport?: (event: TeleportEvent) => void,
): void {
  for (const [id, remaining] of cooldowns.entries()) {
    const next = remaining - dt;
    if (next <= 0) cooldowns.delete(id);
    else cooldowns.set(id, next);
  }

  for (const player of players.values()) {
    if (!player.schema.isAlive || cooldowns.has(player.sessionId)) continue;
    const feetY = player.movement.y - PLAYER_CAPSULE_CENTER_Y;
    const hit = findTeleporterDest(teleporters, player.movement.x, feetY, player.movement.z);
    if (!hit) continue;

    const from: Vec3 = { x: player.movement.x, y: player.movement.y, z: player.movement.z };
    const to: Vec3 = { x: hit.dest[0], y: hit.dest[1] + PLAYER_SPAWN_Y, z: hit.dest[2] };
    player.teleportTo(to.x, to.y, to.z, world);
    cooldowns.set(player.sessionId, TELEPORTER_COOLDOWN_SEC);
    onTeleport?.({ entityId: player.sessionId, from, to, color: hit.color });
  }

  const grenadeIter = grenades instanceof Map ? grenades.values() : grenades;
  let movedGrenade = false;
  for (const grenade of grenadeIter) {
    if (cooldowns.has(grenade.id)) continue;
    const pos = grenade.body.translation();
    const hit = findTeleporterDest(teleporters, pos.x, pos.y, pos.z);
    if (!hit) continue;

    const from: Vec3 = { x: pos.x, y: pos.y, z: pos.z };
    const to: Vec3 = { x: hit.dest[0], y: hit.dest[1] + 0.65, z: hit.dest[2] };
    grenade.body.setTranslation(to, true);
    movedGrenade = true;
    cooldowns.set(grenade.id, TELEPORTER_COOLDOWN_SEC);
    onTeleport?.({ entityId: grenade.id, from, to, color: hit.color });
  }
  if (movedGrenade) {
    world.propagateModifiedBodyPositionsToColliders();
  }
}
