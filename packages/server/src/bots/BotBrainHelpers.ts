import { getMoveAxes, type Vec3 } from "@upgun/shared";
import type { BotDifficultyProfile } from "../../../shared/src/modes";
import type { PlayerEntity } from "../systems/PlayerEntity";
import { TargetHistoryBuffer } from "./TargetHistoryBuffer";

export interface HumanizedBotBrain {
  clockSec: number;
  targetId: string | null;
  targetHistories: Map<string, TargetHistoryBuffer>;
  hasLos: boolean;
  losTimerSec: number;
  strafeDir: number;
  strafeFlipTimerSec: number;
  aimDriftYaw: number;
  aimDriftPitch: number;
  aimDriftTargetYaw: number;
  aimDriftTargetPitch: number;
  aimDriftTimerSec: number;
  burstShotsLeft: number;
  burstPauseTimerSec: number;
  burstFallbackTimerSec: number;
  wasFiringLastTick: boolean;
  lastObservedAmmo: number;
  grenadeDecisionSec: number;
  dashDecisionSec: number;
  meleeDecisionSec: number;
  jumpCooldownSec: number;
  stuckCheckTimerSec: number;
  lastCheckX: number;
  lastCheckZ: number;
  seed: number;
}

const botBrains = new WeakMap<PlayerEntity, HumanizedBotBrain>();

function hashSession(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

export function rollBurstShots(profile: BotDifficultyProfile): number {
  const min = Math.max(1, Math.round(profile.burstShotsMin));
  const max = Math.max(min, Math.round(profile.burstShotsMax));
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function getOrCreateBrain(
  bot: PlayerEntity,
  profile: BotDifficultyProfile,
): HumanizedBotBrain {
  let brain = botBrains.get(bot);
  if (!brain) {
    const seed = hashSession(bot.sessionId);
    brain = {
      clockSec: 0,
      targetId: null,
      targetHistories: new Map(),
      hasLos: false,
      losTimerSec: 0,
      strafeDir: seed % 2 === 0 ? 1 : -1,
      strafeFlipTimerSec: 1.0 + (seed % 10) * 0.12,
      aimDriftYaw: 0,
      aimDriftPitch: 0,
      aimDriftTargetYaw: 0,
      aimDriftTargetPitch: 0,
      aimDriftTimerSec: 0.2,
      burstShotsLeft: rollBurstShots(profile),
      burstPauseTimerSec: 0,
      burstFallbackTimerSec: 0,
      wasFiringLastTick: false,
      lastObservedAmmo: bot.schema.ammo,
      grenadeDecisionSec: 2.0 + (seed % 7) * 0.4,
      dashDecisionSec: 1.4 + (seed % 5) * 0.35,
      meleeDecisionSec: 0,
      jumpCooldownSec: 0,
      stuckCheckTimerSec: 0.34,
      lastCheckX: bot.movement.x,
      lastCheckZ: bot.movement.z,
      seed,
    };
    botBrains.set(bot, brain);
  }
  return brain;
}

export function resetHumanizedBotBrain(bot: PlayerEntity): void {
  botBrains.delete(bot);
}

export function recordEnemyPositions(
  bot: PlayerEntity,
  players: Map<string, PlayerEntity>,
  brain: HumanizedBotBrain,
): void {
  for (const candidate of players.values()) {
    if (candidate.sessionId === bot.sessionId) {
      continue;
    }
    let history = brain.targetHistories.get(candidate.sessionId);
    if (!candidate.schema.isAlive) {
      history?.clear();
      continue;
    }
    if (!history) {
      history = new TargetHistoryBuffer();
      brain.targetHistories.set(candidate.sessionId, history);
    }
    history.push(brain.clockSec, {
      x: candidate.movement.x,
      y: candidate.movement.y + 0.35,
      z: candidate.movement.z,
    });
  }
}

export function pickNearestEnemy(
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

  if (currentTarget && currentDistSq <= nearestDistSq * 1.45) {
    return currentTarget;
  }
  return nearest;
}

export function steerTowardWorldPoint(
  bot: PlayerEntity,
  targetPoint: Vec3,
  yaw: number,
  strafeWeight: number,
  strafeDir: number,
): { moveX: number; moveZ: number } {
  const wx = targetPoint.x - bot.movement.x;
  const wz = targetPoint.z - bot.movement.z;
  const dist = Math.hypot(wx, wz);
  if (dist < 0.05) {
    return { moveX: strafeDir * strafeWeight, moveZ: 0 };
  }
  const dirX = wx / dist;
  const dirZ = wz / dist;
  const { forwardX, forwardZ, rightX, rightZ } = getMoveAxes(yaw);
  const localForward = dirX * forwardX + dirZ * forwardZ;
  const localRight = dirX * rightX + dirZ * rightZ;
  return {
    moveX: Math.max(-1, Math.min(1, localRight + strafeDir * strafeWeight)),
    moveZ: Math.max(-1, Math.min(1, localForward)),
  };
}
