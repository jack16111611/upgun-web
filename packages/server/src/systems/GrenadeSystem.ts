import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import {
  computeSplashDamage,
  hasLineOfSight,
  MAX_RECURSION_DEPTH,
  runCardHook,
  WEAPON_GRENADE,
  type DamageSource,
  type ExplosionEvent,
  type GrenadeSpawnParams,
  type MeleeGrenadeCandidate,
  type Vec3,
} from "@upgun/shared";
import type { TeleportableGrenade } from "../arena";
import { ArenaState, GrenadeState } from "../schema/ArenaState";
import {
  launchOwnerTowardBlast,
  pullPlayersTowardBlast,
  sanitizeGrenadeParams,
  stepStickyGrenade,
} from "./GrenadeEffects";
import type { PlayerEntity } from "./PlayerEntity";

const MAX_ACTIVE_GRENADES = 64;

interface ActiveGrenade {
  id: string;
  ownerId: string;
  body: RigidBody;
  collider: Collider;
  fuseLeft: number;
  maxDamage: number;
  splashRadius: number;
  sticky: boolean;
  stuck: boolean;
  stuckTargetId: string | null;
  stuckOffset: Vec3;
  prevSpeed: number;
  recursionDepth: number;
}

export interface GrenadeDetonateCallbacks {
  onDamage: (
    target: PlayerEntity,
    attacker: PlayerEntity | null,
    damage: number,
    point: Vec3,
    source: DamageSource,
    recursionDepth: number,
  ) => void;
  onExplosion: (event: ExplosionEvent) => void;
  onSplashBarrels?: (origin: Vec3, radius: number, maxDamage: number, attackerId: string) => void;
}

export class GrenadeSystem {
  private readonly grenades = new Map<string, ActiveGrenade>();
  private readonly grenadeColliderHandles = new Set<number>();
  private nextId = 1;

  isGrenadeCollider(handle: number): boolean {
    return this.grenadeColliderHandles.has(handle);
  }

  getDeflectCandidates(): MeleeGrenadeCandidate[] {
    const list: MeleeGrenadeCandidate[] = [];
    for (const g of this.grenades.values()) {
      const p = g.body.translation();
      const v = g.body.linvel();
      list.push({ id: g.id, position: { x: p.x, y: p.y, z: p.z }, velocity: { x: v.x, y: v.y, z: v.z } });
    }
    return list;
  }

  deflectGrenade(rapier: typeof RAPIER, id: string, newOwnerId: string, velocity: Vec3): Vec3 | null {
    const g = this.grenades.get(id);
    if (!g || !Number.isFinite(velocity.x) || !Number.isFinite(velocity.y) || !Number.isFinite(velocity.z)) {
      return null;
    }
    g.ownerId = newOwnerId;
    g.stuck = false;
    g.stuckTargetId = null;
    g.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
    g.body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    g.prevSpeed = Math.hypot(velocity.x, velocity.y, velocity.z);
    g.fuseLeft = Math.max(g.fuseLeft, 0.9);
    const p = g.body.translation();
    return { x: p.x, y: p.y, z: p.z };
  }

  getTeleportableGrenades(): TeleportableGrenade[] {
    const out: TeleportableGrenade[] = [];
    for (const g of this.grenades.values()) {
      if (!g.stuck) out.push({ id: g.id, body: g.body });
    }
    return out;
  }

  spawnThrownGrenade(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    owner: PlayerEntity,
    origin: Vec3,
    aimDir: Vec3,
  ): void {
    const spawnOffset = 0.65;
    const params: GrenadeSpawnParams = {
      origin: {
        x: origin.x + aimDir.x * spawnOffset,
        y: origin.y + aimDir.y * spawnOffset,
        z: origin.z + aimDir.z * spawnOffset,
      },
      velocity: {
        x: aimDir.x * WEAPON_GRENADE.throwSpeed,
        y: aimDir.y * WEAPON_GRENADE.throwSpeed + WEAPON_GRENADE.throwUpwardBoost,
        z: aimDir.z * WEAPON_GRENADE.throwSpeed,
      },
      fuseSec: WEAPON_GRENADE.fuseSec,
      maxDamage: Math.round(WEAPON_GRENADE.maxDamage * owner.stats.damageMultiplier),
      splashRadius: WEAPON_GRENADE.splashRadius,
      radius: WEAPON_GRENADE.radius,
      restitution: WEAPON_GRENADE.restitution,
      sticky: false,
      recursionDepth: 0,
    };

    this.spawnGrenadeFromParams(rapier, world, state, owner, params);
  }

  spawnGrenadeFromParams(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    owner: PlayerEntity | null,
    rawParams: GrenadeSpawnParams,
  ): void {
    if (
      rawParams.recursionDepth >= MAX_RECURSION_DEPTH ||
      this.grenades.size >= MAX_ACTIVE_GRENADES
    ) {
      return;
    }

    const params: GrenadeSpawnParams = {
      origin: { ...rawParams.origin },
      velocity: { ...rawParams.velocity },
      fuseSec: rawParams.fuseSec,
      maxDamage: rawParams.maxDamage,
      splashRadius: rawParams.splashRadius,
      radius: rawParams.radius,
      restitution: rawParams.restitution,
      sticky: rawParams.sticky,
      recursionDepth: rawParams.recursionDepth,
    };

    if (owner) {
      runCardHook(owner.effectiveCards, "onGrenadeSpawn", {
        ownerId: owner.sessionId,
        params,
        stats: owner.stats,
      });
    }
    const spec = sanitizeGrenadeParams(params);
    if (!spec) return;

    const id = `g_${this.nextId++}`;
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(params.origin.x, params.origin.y, params.origin.z)
      .setLinvel(params.velocity.x, params.velocity.y, params.velocity.z)
      .setLinearDamping(params.sticky ? 1.2 : 0.25)
      .setAngularDamping(0.5)
      .setCcdEnabled(true);

    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = rapier.ColliderDesc.ball(spec.radius)
      .setRestitution(params.sticky ? 0.05 : spec.restitution)
      .setFriction(params.sticky ? 1.5 : WEAPON_GRENADE.friction)
      .setDensity(1.5);
    const collider = world.createCollider(colliderDesc, body);

    const ownerId = owner?.sessionId ?? "";
    this.grenadeColliderHandles.add(collider.handle);
    const initSpeed = Math.hypot(params.velocity.x, params.velocity.y, params.velocity.z);
    this.grenades.set(id, {
      id,
      ownerId,
      body,
      collider,
      fuseLeft: spec.fuseSec,
      maxDamage: spec.maxDamage,
      splashRadius: spec.splashRadius,
      sticky: Boolean(params.sticky),
      stuck: false,
      stuckTargetId: null,
      stuckOffset: { x: 0, y: 0, z: 0 },
      prevSpeed: initSpeed,
      recursionDepth: params.recursionDepth,
    });

    const schema = new GrenadeState();
    schema.id = id;
    schema.ownerId = ownerId;
    schema.x = params.origin.x;
    schema.y = params.origin.y;
    schema.z = params.origin.z;
    schema.fuseLeft = spec.fuseSec;
    state.grenades.set(id, schema);
  }

  step(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    dt: number,
    callbacks: GrenadeDetonateCallbacks,
  ): void {
    const toDetonate: ActiveGrenade[] = [];

    for (const grenade of this.grenades.values()) {
      grenade.fuseLeft -= dt;
      stepStickyGrenade(rapier, grenade, players);

      const pos = grenade.body.translation();
      const schema = state.grenades.get(grenade.id);
      if (schema) {
        schema.x = pos.x;
        schema.y = pos.y;
        schema.z = pos.z;
        schema.fuseLeft = Math.max(0, grenade.fuseLeft);
      }

      if (grenade.fuseLeft <= 0) {
        toDetonate.push(grenade);
      }
    }

    for (const grenade of toDetonate) {
      this.detonate(rapier, world, state, players, grenade, callbacks);
    }
  }

  private detonate(
    rapier: typeof RAPIER,
    world: World,
    state: ArenaState,
    players: Map<string, PlayerEntity>,
    grenade: ActiveGrenade,
    callbacks: GrenadeDetonateCallbacks,
  ): void {
    const pos = grenade.body.translation();
    const blastPos: Vec3 = { x: pos.x, y: pos.y, z: pos.z };
    const blastOrigin: Vec3 = { x: pos.x, y: pos.y + 0.15, z: pos.z };

    this.removeGrenade(world, state, grenade);

    const owner = players.get(grenade.ownerId) ?? null;

    for (const target of players.values()) {
      if (!target.schema.isAlive) {
        continue;
      }

      const targetCenter: Vec3 = {
        x: target.movement.x,
        y: target.movement.y + 0.2,
        z: target.movement.z,
      };
      const dist = Math.hypot(
        targetCenter.x - blastOrigin.x,
        targetCenter.y - blastOrigin.y,
        targetCenter.z - blastOrigin.z,
      );

      if (dist >= grenade.splashRadius) {
        continue;
      }

      const hasLos = hasLineOfSight(rapier, world, blastOrigin, targetCenter, target.collider, (col) => {
        if (this.grenadeColliderHandles.has(col.handle)) return false;
        for (const other of players.values()) {
          if (other.collider.handle === col.handle && other !== target) return false;
        }
        return true;
      });
      if (!hasLos) continue;

      const dmg = computeSplashDamage(dist, grenade.splashRadius, grenade.maxDamage);
      if (dmg > 0) {
        callbacks.onDamage(target, owner, dmg, targetCenter, "grenade", grenade.recursionDepth);
      }
    }

    callbacks.onExplosion({
      grenadeId: grenade.id,
      ownerId: grenade.ownerId,
      position: blastPos,
      radius: grenade.splashRadius,
    });
    callbacks.onSplashBarrels?.(blastPos, grenade.splashRadius, grenade.maxDamage, grenade.ownerId);

    if (owner && grenade.recursionDepth < MAX_RECURSION_DEPTH) {
      let childrenSpawned = 0;
      runCardHook(owner.effectiveCards, "onGrenadeExplode", {
        grenadeId: grenade.id,
        ownerId: owner.sessionId,
        position: blastPos,
        radius: grenade.splashRadius,
        maxDamage: grenade.maxDamage,
        recursionDepth: grenade.recursionDepth,
        stats: owner.stats,
        spawnChildGrenade: (childParams) => {
          if (childrenSpawned >= 8 || grenade.recursionDepth + 1 >= MAX_RECURSION_DEPTH) return;
          childrenSpawned += 1;
          this.spawnGrenadeFromParams(rapier, world, state, owner, {
            ...childParams,
            recursionDepth: grenade.recursionDepth + 1,
          });
        },
        pullNearbyPlayers: (origin, pullRadius, force) => {
          pullPlayersTowardBlast(origin, pullRadius, force, players);
        },
        launchOwnerToward: (origin, force, onlyIfAirborne = true) => {
          launchOwnerTowardBlast(owner, origin, force, onlyIfAirborne);
        },
      });
    }
  }

  private removeGrenade(world: World, state: ArenaState, grenade: ActiveGrenade): void {
    this.grenadeColliderHandles.delete(grenade.collider.handle);
    this.grenades.delete(grenade.id);
    state.grenades.delete(grenade.id);
    world.removeRigidBody(grenade.body);
  }

  clearAll(world: World, state: ArenaState): void {
    for (const grenade of [...this.grenades.values()]) {
      this.removeGrenade(world, state, grenade);
    }
  }
}
