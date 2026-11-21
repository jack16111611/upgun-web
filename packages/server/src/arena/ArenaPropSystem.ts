import type { World } from "@dimforge/rapier3d-compat";
import {
  computeSplashDamage,
  type OrbPickupEvent,
  type TeleportEvent,
  type Vec3,
} from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";
import {
  getMapPropsConfig,
  type MapPropsConfig,
  type TeleporterPairDef,
} from "./mapPropsData";
import {
  BARREL_EXPLOSION_MAX_DAMAGE,
  BARREL_EXPLOSION_RADIUS,
  BARREL_HEIGHT,
  BARREL_MAX_HP,
  BARREL_RADIUS,
  BARREL_RESPAWN_SEC,
  intersectRayCylinder,
  ORB_BUFF_DURATION_SEC,
  ORB_FIRE_RATE_MULTIPLIER,
  ORB_OVERSHIELD_AMOUNT,
  ORB_PICKUP_RADIUS,
  ORB_RESPAWN_SEC,
  stepTeleportersRuntime,
  type ArenaPropsSnapshot,
  type BarrelExplosionCallbacks,
  type BarrelRaycastHit,
  type BarrelSnapshot,
  type OrbSnapshot,
  type TeleportableGrenade,
  type TeleporterSnapshot,
} from "./propTypes";

export * from "./propTypes";

interface LiveBarrel {
  id: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  isIntact: boolean;
  respawnTimer: number;
}

interface LiveOrb {
  id: string;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  respawnTimer: number;
}

interface OverchargeBuff {
  overshield: number;
  timeLeftSec: number;
}

export class ArenaPropSystem {
  private mapId = "neon_foundry";
  private readonly barrels = new Map<string, LiveBarrel>();
  private teleporters: readonly TeleporterPairDef[] = [];
  private readonly orbs = new Map<string, LiveOrb>();
  private readonly teleportCooldowns = new Map<string, number>();
  private readonly overcharges = new Map<string, OverchargeBuff>();

  constructor(initialMapId = "neon_foundry") {
    this.loadForMap(initialMapId);
  }

  loadForMap(mapId: string): void {
    const config: MapPropsConfig = getMapPropsConfig(mapId);
    this.mapId = config.mapId;
    this.barrels.clear();
    this.orbs.clear();
    this.teleportCooldowns.clear();
    this.overcharges.clear();

    for (const def of config.barrels) {
      this.barrels.set(def.id, {
        id: def.id,
        x: def.position[0],
        y: def.position[1],
        z: def.position[2],
        hp: BARREL_MAX_HP,
        isIntact: true,
        respawnTimer: 0,
      });
    }

    this.teleporters = config.teleporters;

    for (const def of config.orbs) {
      this.orbs.set(def.id, {
        id: def.id,
        x: def.position[0],
        y: def.position[1],
        z: def.position[2],
        isActive: true,
        respawnTimer: 0,
      });
    }
  }

  resetForRound(): void {
    this.teleportCooldowns.clear();
    this.overcharges.clear();
    for (const barrel of this.barrels.values()) {
      barrel.hp = BARREL_MAX_HP;
      barrel.isIntact = true;
      barrel.respawnTimer = 0;
    }
    for (const orb of this.orbs.values()) {
      orb.isActive = true;
      orb.respawnTimer = 0;
    }
  }

  stepBarrels(dt: number): void {
    for (const barrel of this.barrels.values()) {
      if (barrel.isIntact) continue;
      barrel.respawnTimer -= dt;
      if (barrel.respawnTimer <= 0) {
        barrel.isIntact = true;
        barrel.hp = BARREL_MAX_HP;
        barrel.respawnTimer = 0;
      }
    }
  }

  raycastBarrel(origin: Vec3, dir: Vec3, maxDist: number): BarrelRaycastHit | null {
    const len = Math.hypot(dir.x, dir.y, dir.z);
    if (len < 1e-6 || maxDist <= 0) return null;
    const ndir: Vec3 = { x: dir.x / len, y: dir.y / len, z: dir.z / len };

    let closest: BarrelRaycastHit | null = null;
    let bestDist = maxDist;
    for (const barrel of this.barrels.values()) {
      if (!barrel.isIntact) continue;
      const dist = intersectRayCylinder(
        origin, ndir, bestDist, barrel.x, barrel.y, barrel.z, BARREL_RADIUS, BARREL_HEIGHT,
      );
      if (dist !== null && dist < bestDist) {
        bestDist = dist;
        closest = {
          barrelId: barrel.id,
          distance: dist,
          point: {
            x: origin.x + ndir.x * dist,
            y: origin.y + ndir.y * dist,
            z: origin.z + ndir.z * dist,
          },
        };
      }
    }
    return closest;
  }

  damageBarrel(
    barrelId: string,
    dmg: number,
    attackerId: string | null,
    callbacks: BarrelExplosionCallbacks = {},
  ): boolean {
    const barrel = this.barrels.get(barrelId);
    if (!barrel || !barrel.isIntact || dmg <= 0) return false;
    barrel.hp = Math.max(0, barrel.hp - dmg);
    if (barrel.hp > 0) return true;
    this.detonateBarrel(barrel, attackerId, callbacks);
    return true;
  }

  damageBarrelsInRadius(
    origin: Vec3,
    radius: number,
    maxDamage: number,
    attackerId: string | null,
    callbacks: BarrelExplosionCallbacks = {},
  ): number {
    if (radius <= 0 || maxDamage <= 0) return 0;
    const affected: { id: string; dmg: number }[] = [];
    for (const barrel of this.barrels.values()) {
      if (!barrel.isIntact) continue;
      const dist = Math.hypot(
        barrel.x - origin.x,
        barrel.y + BARREL_HEIGHT * 0.5 - origin.y,
        barrel.z - origin.z,
      );
      if (dist >= radius) continue;
      const dmg = computeSplashDamage(dist, radius, maxDamage);
      if (dmg > 0) affected.push({ id: barrel.id, dmg });
    }
    let hitCount = 0;
    for (const entry of affected) {
      if (this.damageBarrel(entry.id, entry.dmg, attackerId, callbacks)) hitCount += 1;
    }
    return hitCount;
  }

  private detonateBarrel(
    barrel: LiveBarrel,
    attackerId: string | null,
    callbacks: BarrelExplosionCallbacks,
  ): void {
    barrel.isIntact = false;
    barrel.hp = 0;
    barrel.respawnTimer = BARREL_RESPAWN_SEC;

    const center: Vec3 = { x: barrel.x, y: barrel.y + BARREL_HEIGHT * 0.5, z: barrel.z };
    callbacks.onExplosion?.({
      grenadeId: barrel.id,
      ownerId: attackerId ?? "",
      position: center,
      radius: BARREL_EXPLOSION_RADIUS,
    });
    callbacks.onSplashDamage?.(
      center, BARREL_EXPLOSION_RADIUS, BARREL_EXPLOSION_MAX_DAMAGE, attackerId, barrel.id,
    );

    const chainIds: string[] = [];
    for (const other of this.barrels.values()) {
      if (!other.isIntact || other.id === barrel.id) continue;
      const dist = Math.hypot(
        other.x - center.x,
        other.y + BARREL_HEIGHT * 0.5 - center.y,
        other.z - center.z,
      );
      if (dist <= BARREL_EXPLOSION_RADIUS) chainIds.push(other.id);
    }
    for (const nextId of chainIds) {
      this.damageBarrel(nextId, BARREL_MAX_HP, attackerId, callbacks);
    }
  }

  stepTeleporters(
    players: Map<string, PlayerEntity>,
    grenades: Iterable<TeleportableGrenade> | Map<string, TeleportableGrenade>,
    world: World,
    dt: number,
    onTeleport?: (event: TeleportEvent) => void,
  ): void {
    stepTeleportersRuntime(
      this.teleporters, this.teleportCooldowns, players, grenades, world, dt, onTeleport,
    );
  }

  stepOrbs(
    players: Map<string, PlayerEntity>,
    dt: number,
    onPickup?: (event: OrbPickupEvent) => void,
  ): void {
    for (const [sessionId, buff] of this.overcharges.entries()) {
      const player = players.get(sessionId);
      buff.timeLeftSec -= dt;
      if (!player || !player.schema.isAlive || buff.timeLeftSec <= 0) {
        this.overcharges.delete(sessionId);
      }
    }

    for (const orb of this.orbs.values()) {
      if (!orb.isActive) {
        orb.respawnTimer -= dt;
        if (orb.respawnTimer <= 0) {
          orb.isActive = true;
          orb.respawnTimer = 0;
        }
        continue;
      }

      for (const player of players.values()) {
        if (!player.schema.isAlive) continue;
        const dx = player.movement.x - orb.x;
        const dz = player.movement.z - orb.z;
        const dy = Math.abs(player.movement.y - orb.y);
        if (dx * dx + dz * dz <= ORB_PICKUP_RADIUS * ORB_PICKUP_RADIUS && dy <= 1.6) {
          orb.isActive = false;
          orb.respawnTimer = ORB_RESPAWN_SEC;
          this.overcharges.set(player.sessionId, {
            overshield: ORB_OVERSHIELD_AMOUNT,
            timeLeftSec: ORB_BUFF_DURATION_SEC,
          });
          onPickup?.({ playerId: player.sessionId, position: { x: orb.x, y: orb.y, z: orb.z } });
          break;
        }
      }
    }
  }

  getOvershield(sessionId: string): number {
    return this.overcharges.get(sessionId)?.overshield ?? 0;
  }

  consumeOvershield(sessionId: string, dmg: number): number {
    if (dmg <= 0) return 0;
    const buff = this.overcharges.get(sessionId);
    if (!buff || buff.overshield <= 0) return dmg;
    const absorbed = Math.min(buff.overshield, dmg);
    buff.overshield -= absorbed;
    return dmg - absorbed;
  }

  getFireRateBoost(sessionId: string): number {
    const buff = this.overcharges.get(sessionId);
    return buff && buff.timeLeftSec > 0 ? ORB_FIRE_RATE_MULTIPLIER : 1.0;
  }

  getOverchargeTimeLeft(sessionId: string): number {
    return Math.max(0, this.overcharges.get(sessionId)?.timeLeftSec ?? 0);
  }

  clearPlayerState(sessionId: string): void {
    this.overcharges.delete(sessionId);
    this.teleportCooldowns.delete(sessionId);
  }

  getSnapshots(): ArenaPropsSnapshot {
    const barrels: BarrelSnapshot[] = [];
    for (const b of this.barrels.values()) {
      barrels.push({
        id: b.id, x: b.x, y: b.y, z: b.z, hp: b.hp, maxHp: BARREL_MAX_HP,
        isIntact: b.isIntact, respawnTimer: Math.max(0, b.respawnTimer),
      });
    }
    const orbs: OrbSnapshot[] = [];
    for (const o of this.orbs.values()) {
      orbs.push({
        id: o.id, x: o.x, y: o.y, z: o.z, isActive: o.isActive,
        respawnTimer: Math.max(0, o.respawnTimer),
      });
    }
    const teleporters: TeleporterSnapshot[] = this.teleporters.map((tp) => ({
      id: tp.id, a: [tp.a[0], tp.a[1], tp.a[2]], b: [tp.b[0], tp.b[1], tp.b[2]],
      radius: tp.radius, colorA: tp.colorA, colorB: tp.colorB,
    }));
    return { mapId: this.mapId, barrels, teleporters, orbs };
  }
}
