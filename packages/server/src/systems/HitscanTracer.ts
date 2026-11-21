import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import { castHitscanRay, WEAPON_RIFLE, type Vec3 } from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import type { CombatBroadcastCallbacks, DamageSystem } from "./DamageSystem";
import type { GrenadeSystem } from "./GrenadeSystem";
import type { PlayerEntity } from "./PlayerEntity";

export interface TraceShotParams {
  rapier: typeof RAPIER;
  world: World;
  state: ArenaState;
  player: PlayerEntity;
  players: Map<string, PlayerEntity>;
  colliderToSession: Map<number, string>;
  grenadeSystem: GrenadeSystem;
  damageSystem: DamageSystem;
  startOrigin: Vec3;
  startDir: Vec3;
  baseDamage?: number;
  dmgMult: number;
  maxBounces: number;
  maxPierces: number;
  bonusSplashRadius: number;
  bonusSplashDamage: number;
  callbacks: CombatBroadcastCallbacks;
}

export function traceHitscanShot(p: TraceShotParams): void {
  let curOrigin = p.startOrigin;
  let curDir = p.startDir;
  let remainingRange = WEAPON_RIFLE.maxRange;
  let bouncesLeft = Math.min(5, Math.max(0, p.maxBounces));
  let piercesLeft = Math.min(5, Math.max(0, p.maxPierces));
  const piercedHandles = new Set<number>();

  const rayFilter = (col: { handle: number }) => {
    if (piercedHandles.has(col.handle) || p.grenadeSystem.isGrenadeCollider(col.handle)) {
      return false;
    }
    const hitSession = p.colliderToSession.get(col.handle);
    if (hitSession) {
      return Boolean(p.players.get(hitSession)?.schema.isAlive);
    }
    return true;
  };

  for (let seg = 0; seg < 7 && remainingRange > 1; seg++) {
    const hit = castHitscanRay(
      p.rapier,
      p.world,
      curOrigin,
      curDir,
      remainingRange,
      p.player.collider,
      rayFilter,
    );

    const barrelHit = p.callbacks.raycastBarrel?.(
      curOrigin,
      curDir,
      hit ? hit.distance : remainingRange,
    );
    if (barrelHit && (!hit || barrelHit.distance < hit.distance)) {
      p.callbacks.onShot({
        shooterId: p.player.sessionId,
        origin: curOrigin,
        end: barrelHit.point,
        hit: true,
      });
      p.callbacks.damageBarrel?.(
        barrelHit.barrelId,
        Math.round(WEAPON_RIFLE.damage * p.dmgMult),
        p.player.sessionId,
      );
      break;
    }

    const endPoint: Vec3 = hit
      ? hit.point
      : {
          x: curOrigin.x + curDir.x * remainingRange,
          y: curOrigin.y + curDir.y * remainingRange,
          z: curOrigin.z + curDir.z * remainingRange,
        };

    let hitTarget: PlayerEntity | undefined;
    if (hit) {
      const targetId = p.colliderToSession.get(hit.collider.handle);
      if (targetId) hitTarget = p.players.get(targetId);
    }

    p.callbacks.onShot({
      shooterId: p.player.sessionId,
      origin: curOrigin,
      end: endPoint,
      hit: Boolean(hitTarget),
    });

    if (!hit) break;

    if (p.bonusSplashRadius > 0 && p.bonusSplashDamage > 0 && seg === 0) {
      p.damageSystem.dealRadialSplash(
        hit.point,
        p.bonusSplashRadius,
        p.bonusSplashDamage,
        1,
        p.player,
        p.rapier,
        p.world,
        p.state,
        p.players,
        p.grenadeSystem,
        p.callbacks,
      );
    }

    if (hitTarget) {
      const headshotThreshold = p.state.bigHead ? 0.1 : 0.35;
      const isHeadshot = hit.point.y >= hitTarget.movement.y + headshotThreshold;
      const critScale = isHeadshot ? p.player.stats.critMultiplier : 1;
      const baseWeaponDmg = p.baseDamage ?? WEAPON_RIFLE.damage;
      const shotDmg = Math.round(baseWeaponDmg * p.dmgMult * critScale);
      p.damageSystem.applyDamage(
        hitTarget,
        p.player,
        shotDmg,
        hit.point,
        "rifle",
        0,
        p.rapier,
        p.world,
        p.state,
        p.players,
        p.grenadeSystem,
        p.callbacks,
        curDir,
        isHeadshot,
      );
      if (piercesLeft > 0) {
        piercesLeft -= 1;
        piercedHandles.add(hit.collider.handle);
        remainingRange -= hit.distance;
        curOrigin = {
          x: hit.point.x + curDir.x * 0.08,
          y: hit.point.y + curDir.y * 0.08,
          z: hit.point.z + curDir.z * 0.08,
        };
        continue;
      }
      break;
    }

    if (bouncesLeft > 0) {
      bouncesLeft -= 1;
      const rayObj = new p.rapier.Ray(curOrigin, curDir);
      const hitNormal = p.world.castRayAndGetNormal(
        rayObj,
        remainingRange,
        true,
        undefined,
        undefined,
        p.player.collider,
        undefined,
        rayFilter,
      );
      if (!hitNormal) break;
      const n = hitNormal.normal;
      const dot = curDir.x * n.x + curDir.y * n.y + curDir.z * n.z;
      curDir = {
        x: curDir.x - 2 * dot * n.x,
        y: curDir.y - 2 * dot * n.y,
        z: curDir.z - 2 * dot * n.z,
      };
      curOrigin = {
        x: hit.point.x + n.x * 0.08,
        y: hit.point.y + n.y * 0.08,
        z: hit.point.z + n.z * 0.08,
      };
      remainingRange -= hit.distance;
      continue;
    }

    const isInteriorCover =
      hit.point.y > 0.12 && Math.abs(hit.point.x) < 16.5 && Math.abs(hit.point.z) < 16.5;
    if (piercesLeft > 0 && isInteriorCover) {
      piercesLeft -= 1;
      piercedHandles.add(hit.collider.handle);
      remainingRange -= hit.distance;
      curOrigin = {
        x: hit.point.x + curDir.x * 0.15,
        y: hit.point.y + curDir.y * 0.15,
        z: hit.point.z + curDir.z * 0.15,
      };
      continue;
    }

    break;
  }
}
