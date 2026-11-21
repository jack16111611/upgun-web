import type RAPIER from "@dimforge/rapier3d-compat";
import type { RigidBody } from "@dimforge/rapier3d-compat";
import type { GrenadeSpawnParams, Vec3 } from "@upgun/shared";
import type { PlayerEntity } from "./PlayerEntity";

export interface SanitizedGrenadeSpec {
  fuseSec: number;
  maxDamage: number;
  splashRadius: number;
  radius: number;
  restitution: number;
}

export function sanitizeGrenadeParams(params: GrenadeSpawnParams): SanitizedGrenadeSpec | null {
  if (
    !Number.isFinite(params.origin.x) ||
    !Number.isFinite(params.origin.y) ||
    !Number.isFinite(params.origin.z) ||
    !Number.isFinite(params.velocity.x) ||
    !Number.isFinite(params.velocity.y) ||
    !Number.isFinite(params.velocity.z)
  ) {
    return null;
  }
  return {
    fuseSec: Number.isFinite(params.fuseSec) ? Math.max(0.1, Math.min(10, params.fuseSec)) : 2.0,
    maxDamage: Number.isFinite(params.maxDamage) ? Math.max(1, Math.round(params.maxDamage)) : 1,
    splashRadius: Number.isFinite(params.splashRadius)
      ? Math.max(1, Math.min(25, params.splashRadius))
      : 4,
    radius: Number.isFinite(params.radius) ? Math.max(0.08, Math.min(1.5, params.radius)) : 0.18,
    restitution: Number.isFinite(params.restitution)
      ? Math.max(0, Math.min(1, params.restitution))
      : 0.5,
  };
}

export interface StickyGrenadeState {
  ownerId: string;
  body: RigidBody;
  sticky: boolean;
  stuck: boolean;
  stuckTargetId: string | null;
  stuckOffset: Vec3;
  prevSpeed: number;
}

export function stepStickyGrenade(
  rapier: typeof RAPIER,
  grenade: StickyGrenadeState,
  players: Map<string, PlayerEntity>,
): void {
  if (!grenade.sticky) return;

  if (!grenade.stuck) {
    const gPos = grenade.body.translation();
    for (const target of players.values()) {
      if (!target.schema.isAlive || target.sessionId === grenade.ownerId) continue;
      const dx = gPos.x - target.movement.x;
      const dy = gPos.y - target.movement.y;
      const dz = gPos.z - target.movement.z;
      if (Math.hypot(dx, dz) < 0.72 && Math.abs(dy) < 1.05) {
        grenade.stuck = true;
        grenade.stuckTargetId = target.sessionId;
        grenade.stuckOffset = { x: dx, y: dy, z: dz };
        grenade.body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
        return;
      }
    }

    const vel = grenade.body.linvel();
    const speed = Math.hypot(vel.x, vel.y, vel.z);
    if (speed < grenade.prevSpeed * 0.68 || speed < 1.2) {
      grenade.stuck = true;
      grenade.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      grenade.body.setBodyType(rapier.RigidBodyType.Fixed, true);
    } else {
      grenade.prevSpeed = speed;
    }
    return;
  }

  if (grenade.stuckTargetId) {
    const host = players.get(grenade.stuckTargetId);
    if (host?.schema.isAlive) {
      grenade.body.setTranslation(
        {
          x: host.movement.x + grenade.stuckOffset.x,
          y: host.movement.y + grenade.stuckOffset.y,
          z: host.movement.z + grenade.stuckOffset.z,
        },
        true,
      );
    }
  }
}

export function pullPlayersTowardBlast(
  origin: Vec3,
  pullRadius: number,
  force: number,
  players: Map<string, PlayerEntity>,
): void {
  for (const target of players.values()) {
    if (!target.schema.isAlive) continue;
    const dx = origin.x - target.movement.x;
    const dy = origin.y - target.movement.y;
    const dz = origin.z - target.movement.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist >= pullRadius || dist < 0.2) continue;
    const pull = (1 - dist / pullRadius) * force;
    target.applyExternalImpulse({
      x: (dx / dist) * pull,
      y: Math.max(2.5, (dy / dist) * pull * 0.6),
      z: (dz / dist) * pull,
    });
  }
}

export function launchOwnerTowardBlast(
  owner: PlayerEntity,
  origin: Vec3,
  force: number,
  onlyIfAirborne: boolean,
): void {
  if (!owner.schema.isAlive) return;
  if (onlyIfAirborne && owner.movement.isGrounded) return;
  const dx = origin.x - owner.movement.x;
  const dy = origin.y - owner.movement.y;
  const dz = origin.z - owner.movement.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.25) return;
  owner.applyExternalImpulse({
    x: (dx / dist) * force,
    y: Math.max(5.5, (dy / dist) * force + 3.5),
    z: (dz / dist) * force,
  });
}
