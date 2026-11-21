import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  getEyePosition,
  hasLineOfSight,
  MAX_PITCH_RAD,
  WEAPON_MELEE,
  type HatId,
  type Vec3,
} from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import type { PlayerEntity } from "../systems/PlayerEntity";

export const BOT_NAMES: readonly string[] = [
  "Bolt-9",
  "Vex-MK2",
  "Scrap-7",
  "Nova-X",
  "Kilo-4",
] as const;

export const BOT_HATS: readonly HatId[] = [
  "antenna",
  "viking",
  "tophat",
  "crown",
  "antenna",
] as const;

export const BOT_COLORS: readonly string[] = [
  "#f43f5e",
  "#f59e0b",
  "#a855f7",
  "#10b981",
  "#ec4899",
] as const;

export interface BotProfile {
  name: string;
  hatId: HatId;
  bodyColor: string;
}

export function getBotProfile(index: number): BotProfile {
  const safe = Math.abs(index);
  return {
    name: BOT_NAMES[safe % BOT_NAMES.length] ?? "Bolt-9",
    hatId: BOT_HATS[safe % BOT_HATS.length] ?? "antenna",
    bodyColor: BOT_COLORS[safe % BOT_COLORS.length] ?? "#f43f5e",
  };
}

interface BotBrain {
  targetId: string | null;
  hasLos: boolean;
  losTimerSec: number;
  strafeDir: number;
  strafeFlipTimerSec: number;
  burstActive: boolean;
  burstTimerSec: number;
  aimNoiseYaw: number;
  aimNoisePitch: number;
  aimNoiseTimerSec: number;
  grenadeDecisionSec: number;
  dashDecisionSec: number;
  meleeDecisionSec: number;
  jumpCooldownSec: number;
  stuckCheckTimerSec: number;
  lastCheckX: number;
  lastCheckZ: number;
  seed: number;
}

const botBrains = new WeakMap<PlayerEntity, BotBrain>();

function hashSession(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

function getOrCreateBrain(bot: PlayerEntity): BotBrain {
  let brain = botBrains.get(bot);
  if (!brain) {
    const seed = hashSession(bot.sessionId);
    brain = {
      targetId: null,
      hasLos: false,
      losTimerSec: 0,
      strafeDir: seed % 2 === 0 ? 1 : -1,
      strafeFlipTimerSec: 1.2 + (seed % 10) * 0.12,
      burstActive: false,
      burstTimerSec: 0.35,
      aimNoiseYaw: 0,
      aimNoisePitch: 0,
      aimNoiseTimerSec: 0.25,
      grenadeDecisionSec: 2.5 + (seed % 7) * 0.45,
      dashDecisionSec: 1.8 + (seed % 5) * 0.4,
      meleeDecisionSec: 0,
      jumpCooldownSec: 0,
      stuckCheckTimerSec: 0.35,
      lastCheckX: bot.movement.x,
      lastCheckZ: bot.movement.z,
      seed,
    };
    botBrains.set(bot, brain);
  }
  return brain;
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function moveAngleToward(current: number, target: number, maxStep: number): number {
  const diff = wrapAngle(target - current);
  if (Math.abs(diff) <= maxStep) return wrapAngle(target);
  return wrapAngle(current + Math.sign(diff) * maxStep);
}

function pickNearestEnemy(
  bot: PlayerEntity,
  players: Map<string, PlayerEntity>,
  currentTargetId: string | null,
): PlayerEntity | null {
  let nearest: PlayerEntity | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;
  let currentTarget: PlayerEntity | null = null;
  let currentDistSq = Number.POSITIVE_INFINITY;

  for (const candidate of players.values()) {
    if (candidate.sessionId === bot.sessionId || !candidate.schema.isAlive) {
      continue;
    }
    const dx = candidate.movement.x - bot.movement.x;
    const dy = candidate.movement.y - bot.movement.y;
    const dz = candidate.movement.z - bot.movement.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (candidate.sessionId === currentTargetId) {
      currentTarget = candidate;
      currentDistSq = distSq;
    }
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = candidate;
    }
  }

  // Hysteresis: stick to current target unless another enemy is noticeably closer
  if (currentTarget && currentDistSq <= nearestDistSq * 1.45) {
    return currentTarget;
  }
  return nearest;
}

export function stepSmartBotInput(
  bot: PlayerEntity,
  players: Map<string, PlayerEntity>,
  rapier: typeof RAPIER,
  world: World,
  state: ArenaState,
  dt: number,
): void {
  bot.botElapsedSec += dt;
  const brain = getOrCreateBrain(bot);
  const input = bot.latestInput;

  input.jump = false;
  input.dash = false;
  input.fire = false;
  input.grenade = false;
  input.reload = false;
  input.melee = false;

  if (!bot.schema.isAlive) {
    input.moveX = 0;
    input.moveZ = 0;
    return;
  }

  const target = pickNearestEnemy(bot, players, brain.targetId);
  brain.targetId = target?.sessionId ?? null;

  if (!target) {
    input.moveX = 0;
    input.moveZ = 0;
    input.pitch = 0;
    return;
  }

  const botEye = getEyePosition(bot.movement);
  const targetCenter: Vec3 = {
    x: target.movement.x,
    y: target.movement.y + 0.35,
    z: target.movement.z,
  };
  const dx = targetCenter.x - botEye.x;
  const dy = targetCenter.y - botEye.y;
  const dz = targetCenter.z - botEye.z;
  const horizDist = Math.hypot(dx, dz);
  const totalDist = Math.hypot(dx, dy, dz);

  // Update organic slight inaccuracy so duels feel fun and fair
  brain.aimNoiseTimerSec -= dt;
  if (brain.aimNoiseTimerSec <= 0) {
    brain.aimNoiseTimerSec = 0.28 + Math.random() * 0.26;
    const distScale = Math.min(1.4, 0.75 + totalDist * 0.025);
    brain.aimNoiseYaw = (Math.random() - 0.5) * 0.13 * distScale;
    brain.aimNoisePitch = (Math.random() - 0.5) * 0.08 * distScale;
  }

  const wobble = Math.sin(bot.botElapsedSec * 3.1 + brain.seed) * 0.025;
  const desiredYaw = Math.atan2(-dx, -dz) + brain.aimNoiseYaw + wobble;
  const desiredPitch = Math.max(
    -MAX_PITCH_RAD * 0.85,
    Math.min(MAX_PITCH_RAD * 0.85, Math.atan2(dy, Math.max(0.25, horizDist)) + brain.aimNoisePitch),
  );

  input.yaw = moveAngleToward(input.yaw, desiredYaw, 5.6 * dt);
  const pitchDiff = desiredPitch - input.pitch;
  input.pitch += Math.sign(pitchDiff) * Math.min(Math.abs(pitchDiff), 4.2 * dt);

  if (state.phase !== "combat") {
    input.moveX = 0;
    input.moveZ = 0;
    return;
  }

  // Periodic line-of-sight query ignoring self and dead players
  brain.losTimerSec -= dt;
  if (brain.losTimerSec <= 0) {
    brain.losTimerSec = 0.08;
    brain.hasLos = hasLineOfSight(rapier, world, botEye, targetCenter, target.collider, (col) => {
      if (col.handle === bot.collider.handle) return false;
      for (const p of players.values()) {
        if (p.collider.handle === col.handle && !p.schema.isAlive) return false;
      }
      return true;
    });
  }

  // Tactical strafing & distance management
  brain.strafeFlipTimerSec -= dt;
  if (brain.strafeFlipTimerSec <= 0) {
    brain.strafeDir = -brain.strafeDir;
    brain.strafeFlipTimerSec = 1.1 + Math.random() * 1.4;
  }

  input.moveX = brain.strafeDir * (totalDist < 4.5 ? 0.95 : 0.72);
  if (!brain.hasLos || totalDist > 12.5) {
    input.moveZ = 0.95;
  } else if (totalDist < 5.0 && brain.meleeDecisionSec > 0.2) {
    input.moveZ = -0.6;
  } else if (totalDist < 3.6) {
    input.moveZ = 0.85;
  } else {
    input.moveZ = 0.15;
  }

  // Jump over low obstacles when blocked or occasionally while strafing
  brain.jumpCooldownSec = Math.max(0, brain.jumpCooldownSec - dt);
  brain.stuckCheckTimerSec -= dt;
  if (brain.stuckCheckTimerSec <= 0) {
    brain.stuckCheckTimerSec = 0.34;
    const moved = Math.hypot(
      bot.movement.x - brain.lastCheckX,
      bot.movement.z - brain.lastCheckZ,
    );
    brain.lastCheckX = bot.movement.x;
    brain.lastCheckZ = bot.movement.z;

    if (moved < 0.55 && brain.jumpCooldownSec <= 0) {
      input.jump = true;
      brain.jumpCooldownSec = 0.75;
      brain.strafeDir = -brain.strafeDir;
    } else if (brain.hasLos && bot.movement.isGrounded && brain.jumpCooldownSec <= 0 && Math.random() < 0.14) {
      input.jump = true;
      brain.jumpCooldownSec = 1.6;
    }
  }

  // Reload proactively
  if (!bot.schema.isReloading) {
    if (bot.schema.ammo <= 0) {
      input.reload = true;
    } else if (!brain.hasLos && bot.schema.ammo <= Math.floor(bot.stats.magSize * 0.35)) {
      input.reload = true;
    }
  }

  // Burst rifle fire when aimed with clear line of sight
  brain.burstTimerSec -= dt;
  if (brain.burstTimerSec <= 0) {
    brain.burstActive = !brain.burstActive;
    brain.burstTimerSec = brain.burstActive
      ? 0.36 + Math.random() * 0.32
      : 0.24 + Math.random() * 0.28;
  }

  const yawError = Math.abs(wrapAngle(Math.atan2(-dx, -dz) - input.yaw));
  if (brain.hasLos && brain.burstActive && totalDist <= 42 && yawError < 0.24 && bot.schema.ammo > 0) {
    input.fire = true;
  }

  // Occasional grenades at mid range
  brain.grenadeDecisionSec -= dt;
  if (
    brain.grenadeDecisionSec <= 0 &&
    bot.grenadeCooldownSec <= 0 &&
    brain.hasLos &&
    totalDist >= 6.5 &&
    totalDist <= 22 &&
    yawError < 0.32
  ) {
    input.grenade = true;
    brain.grenadeDecisionSec = 4.2 + Math.random() * 3.5;
  }

  // Close-range melee & tactical dashes
  brain.meleeDecisionSec = Math.max(0, brain.meleeDecisionSec - dt);
  if (totalDist <= WEAPON_MELEE.range + 0.25 && yawError < 0.65 && brain.meleeDecisionSec <= 0) {
    input.melee = true;
    brain.meleeDecisionSec = WEAPON_MELEE.cooldownSec + 0.15;
  }

  brain.dashDecisionSec -= dt;
  if (
    brain.dashDecisionSec <= 0 &&
    bot.movement.dashCooldown <= 0 &&
    brain.hasLos &&
    totalDist >= 3.2 &&
    totalDist <= 10.5
  ) {
    input.dash = true;
    brain.dashDecisionSec = 2.6 + Math.random() * 2.4;
  }
}
