import type RAPIER from "@dimforge/rapier3d-compat";
import type { World } from "@dimforge/rapier3d-compat";
import {
  getEyePosition,
  hasLineOfSight,
  MAX_PITCH_RAD,
  WEAPON_MELEE,
  type BotDifficulty,
  type Vec3,
} from "@upgun/shared";
import { getBotDifficultyProfile } from "../../../shared/src/modes";
import type { ArenaState } from "../schema/ArenaState";
import type { PlayerEntity } from "../systems/PlayerEntity";
import {
  getOrCreateBrain,
  pickNearestEnemy,
  recordEnemyPositions,
  resetHumanizedBotBrain,
  rollBurstShots,
  steerTowardWorldPoint,
} from "./BotBrainHelpers";
import { moveAngleToward, randomRange, wrapAngle } from "./TargetHistoryBuffer";

export { resetHumanizedBotBrain };

export interface HumanizedBotOptions {
  kothZonePos?: Vec3;
  meleeOnly?: boolean;
  allowGrenades?: boolean;
}

export function stepHumanizedBotInput(
  bot: PlayerEntity,
  players: Map<string, PlayerEntity>,
  rapier: typeof RAPIER,
  world: World,
  state: ArenaState,
  dt: number,
  difficulty: BotDifficulty,
  options?: HumanizedBotOptions,
): void {
  const profile = getBotDifficultyProfile(difficulty);
  const brain = getOrCreateBrain(bot, profile);
  const input = bot.latestInput;

  bot.botElapsedSec += dt;
  brain.clockSec += dt;

  input.jump = false;
  input.dash = false;
  input.fire = false;
  input.grenade = false;
  input.reload = false;
  input.melee = false;

  if (!bot.schema.isAlive) {
    input.moveX = 0;
    input.moveZ = 0;
    brain.wasFiringLastTick = false;
    return;
  }

  recordEnemyPositions(bot, players, brain);

  const meleeOnly = options?.meleeOnly === true;
  const allowGrenades = (options?.allowGrenades ?? true) && !meleeOnly;
  const kothZonePos = options?.kothZonePos;

  const target = pickNearestEnemy(bot, players, brain.targetId);
  brain.targetId = target?.sessionId ?? null;

  const botEye = getEyePosition(bot.movement);
  if (!target) {
    brain.wasFiringLastTick = false;
    if (kothZonePos && state.phase === "combat") {
      const zx = kothZonePos.x - bot.movement.x;
      const zz = kothZonePos.z - bot.movement.z;
      const desiredYaw = Math.atan2(-zx, -zz);
      input.yaw = moveAngleToward(input.yaw, desiredYaw, profile.turnRateRadPerSec * dt);
      input.pitch = moveAngleToward(input.pitch, 0, profile.turnRateRadPerSec * 0.8 * dt);
      const steer = steerTowardWorldPoint(bot, kothZonePos, input.yaw, 0.15, brain.strafeDir);
      input.moveX = steer.moveX;
      input.moveZ = steer.moveZ;
    } else {
      input.moveX = 0;
      input.moveZ = 0;
      input.pitch = 0;
    }
    return;
  }

  // Sample delayed target position from per-enemy ring buffer
  const liveCenter: Vec3 = {
    x: target.movement.x,
    y: target.movement.y + 0.35,
    z: target.movement.z,
  };
  const history = brain.targetHistories.get(target.sessionId);
  const perceivedTarget = history
    ? history.sampleDelayed(brain.clockSec, profile.reactionLagMs / 1000, liveCenter)
    : liveCenter;

  const dx = perceivedTarget.x - botEye.x;
  const dy = perceivedTarget.y - botEye.y;
  const dz = perceivedTarget.z - botEye.z;
  const horizDist = Math.hypot(dx, dz);
  const perceivedDist = Math.hypot(dx, dy, dz);
  const actualDist = Math.hypot(
    liveCenter.x - botEye.x,
    liveCenter.y - botEye.y,
    liveCenter.z - botEye.z,
  );

  // Persistent drifting angular aim jitter scaled by profile.aimSpreadDeg
  const spreadRad = (profile.aimSpreadDeg * Math.PI) / 180;
  brain.aimDriftTimerSec -= dt;
  if (brain.aimDriftTimerSec <= 0) {
    brain.aimDriftTimerSec = randomRange(0.24, 0.52);
    const distScale = Math.min(1.25, 0.8 + perceivedDist * 0.018);
    brain.aimDriftTargetYaw = randomRange(-spreadRad, spreadRad) * distScale;
    brain.aimDriftTargetPitch = randomRange(-spreadRad * 0.65, spreadRad * 0.65) * distScale;
  }
  const driftLerp = Math.min(1, dt * 5.5);
  brain.aimDriftYaw += (brain.aimDriftTargetYaw - brain.aimDriftYaw) * driftLerp;
  brain.aimDriftPitch += (brain.aimDriftTargetPitch - brain.aimDriftPitch) * driftLerp;

  const wobble = Math.sin(brain.clockSec * 2.9 + brain.seed) * spreadRad * 0.14;
  const baseYaw = Math.atan2(-dx, -dz);
  const desiredYaw = baseYaw + brain.aimDriftYaw + wobble;
  const desiredPitch = Math.max(
    -MAX_PITCH_RAD * 0.85,
    Math.min(
      MAX_PITCH_RAD * 0.85,
      Math.atan2(dy, Math.max(0.25, horizDist)) + brain.aimDriftPitch,
    ),
  );

  // Capped angular turn speed
  input.yaw = moveAngleToward(input.yaw, desiredYaw, profile.turnRateRadPerSec * dt);
  const maxPitchStep = profile.turnRateRadPerSec * 0.8 * dt;
  const pitchDiff = desiredPitch - input.pitch;
  input.pitch += Math.sign(pitchDiff) * Math.min(Math.abs(pitchDiff), maxPitchStep);

  if (state.phase !== "combat") {
    input.moveX = 0;
    input.moveZ = 0;
    brain.wasFiringLastTick = false;
    return;
  }

  // Periodic line-of-sight query ignoring self and dead players
  brain.losTimerSec -= dt;
  if (brain.losTimerSec <= 0) {
    brain.losTimerSec = 0.09;
    brain.hasLos = hasLineOfSight(rapier, world, botEye, liveCenter, target.collider, (col) => {
      if (col.handle === bot.collider.handle) return false;
      for (const p of players.values()) {
        if (p.collider.handle === col.handle && !p.schema.isAlive) return false;
      }
      return true;
    });
  }

  // Movement: Melee-only rush, KOTH zone priority, or tactical cover strafing
  brain.strafeFlipTimerSec -= dt;
  if (brain.strafeFlipTimerSec <= 0) {
    brain.strafeDir = -brain.strafeDir;
    const flipScale = profile.id === "hard" || profile.id === "nightmare" ? 0.72 : 1.05;
    brain.strafeFlipTimerSec = randomRange(0.95, 2.0) * flipScale;
  }

  const distToKoth = kothZonePos
    ? Math.hypot(kothZonePos.x - bot.movement.x, kothZonePos.z - bot.movement.z)
    : Number.POSITIVE_INFINITY;

  if (meleeOnly) {
    input.moveX = brain.strafeDir * (actualDist < 4.5 ? 0.55 : 0.35);
    input.moveZ = 1.0;
  } else if (kothZonePos && distToKoth > 3.2 && actualDist > 4.2) {
    const steer = steerTowardWorldPoint(bot, kothZonePos, input.yaw, 0.38, brain.strafeDir);
    input.moveX = steer.moveX;
    input.moveZ = steer.moveZ;
  } else {
    input.moveX = brain.strafeDir * (actualDist < 4.5 ? 0.92 : 0.74);
    if (!brain.hasLos || actualDist > 13) {
      input.moveZ = 0.92;
    } else if (actualDist < 5.0 && brain.meleeDecisionSec > 0.2) {
      input.moveZ = -0.58;
    } else if (actualDist < 3.4) {
      input.moveZ = 0.8;
    } else {
      input.moveZ = 0.14;
    }
  }

  // Obstacle jump & combat hop cadence
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

    const hopChance = profile.id === "nightmare" ? 0.32 : profile.id === "hard" ? 0.22 : 0.1;
    if (moved < 0.52 && brain.jumpCooldownSec <= 0) {
      input.jump = true;
      brain.jumpCooldownSec = 0.72;
      brain.strafeDir = -brain.strafeDir;
    } else if (
      brain.hasLos &&
      bot.movement.isGrounded &&
      brain.jumpCooldownSec <= 0 &&
      Math.random() < hopChance
    ) {
      input.jump = true;
      brain.jumpCooldownSec = 1.45;
    }
  }

  // Proactive reload (skipped for melee-only tier)
  if (!meleeOnly && !bot.schema.isReloading && bot.schema.magSize > 0) {
    if (bot.schema.ammo <= 0) {
      input.reload = true;
    } else if (!brain.hasLos && bot.schema.ammo <= Math.floor(bot.schema.magSize * 0.35)) {
      input.reload = true;
    }
  }

  // Realistic burst-fire pauses (tracks exact ammo consumption + infinite-ammo fallback)
  const yawError = Math.abs(wrapAngle(baseYaw - input.yaw));
  if (bot.schema.ammo < brain.lastObservedAmmo) {
    const spent = brain.lastObservedAmmo - bot.schema.ammo;
    brain.burstShotsLeft = Math.max(0, brain.burstShotsLeft - spent);
    brain.burstFallbackTimerSec = 0.18;
    if (brain.burstShotsLeft <= 0 && brain.burstPauseTimerSec <= 0) {
      brain.burstPauseTimerSec = randomRange(profile.burstPauseMinSec, profile.burstPauseMaxSec);
    }
  } else if (brain.wasFiringLastTick) {
    brain.burstFallbackTimerSec -= dt;
    if (brain.burstFallbackTimerSec <= 0) {
      brain.burstShotsLeft = Math.max(0, brain.burstShotsLeft - 1);
      brain.burstFallbackTimerSec = Math.max(0.12, bot.fireCooldownSec + 0.04);
      if (brain.burstShotsLeft <= 0 && brain.burstPauseTimerSec <= 0) {
        brain.burstPauseTimerSec = randomRange(profile.burstPauseMinSec, profile.burstPauseMaxSec);
      }
    }
  }
  brain.lastObservedAmmo = bot.schema.ammo;

  if (brain.burstPauseTimerSec > 0) {
    brain.burstPauseTimerSec = Math.max(0, brain.burstPauseTimerSec - dt);
    if (brain.burstPauseTimerSec <= 0) {
      brain.burstShotsLeft = rollBurstShots(profile);
    }
  }

  const maxAimFireError = Math.max(0.22, spreadRad * 1.9);
  if (
    !meleeOnly &&
    brain.hasLos &&
    brain.burstPauseTimerSec <= 0 &&
    brain.burstShotsLeft > 0 &&
    perceivedDist <= 44 &&
    yawError < maxAimFireError &&
    bot.schema.ammo > 0 &&
    !bot.schema.isReloading
  ) {
    input.fire = true;
  }
  brain.wasFiringLastTick = input.fire;

  // Grenade throws with difficulty-scaled chance and wider throw inaccuracy
  brain.grenadeDecisionSec -= dt;
  if (
    allowGrenades &&
    brain.grenadeDecisionSec <= 0 &&
    bot.grenadeCooldownSec <= 0 &&
    brain.hasLos &&
    perceivedDist >= 6.5 &&
    perceivedDist <= 22 &&
    yawError < 0.36
  ) {
    if (Math.random() < profile.grenadeChance) {
      input.yaw = wrapAngle(
        input.yaw + randomRange(-profile.grenadeSpreadRad, profile.grenadeSpreadRad),
      );
      input.pitch = Math.max(
        -MAX_PITCH_RAD * 0.8,
        Math.min(
          MAX_PITCH_RAD * 0.8,
          input.pitch +
            randomRange(-profile.grenadeSpreadRad * 0.45, profile.grenadeSpreadRad * 0.45),
        ),
      );
      input.grenade = true;
    }
    brain.grenadeDecisionSec = randomRange(3.2, 6.4);
  }

  // Close-range melee (and Gun Game Golden Katana rush)
  brain.meleeDecisionSec = Math.max(0, brain.meleeDecisionSec - dt);
  const meleeReach = meleeOnly ? WEAPON_MELEE.range + 0.35 : WEAPON_MELEE.range + 0.2;
  if (actualDist <= meleeReach && yawError < 0.72 && brain.meleeDecisionSec <= 0) {
    input.melee = true;
    brain.meleeDecisionSec = WEAPON_MELEE.cooldownSec + 0.1;
  }

  // Tactical / airborne dashes scaled by profile.dashChance
  brain.dashDecisionSec -= dt;
  const allowAirDash =
    profile.id === "nightmare" || (profile.id === "hard" && !bot.movement.isGrounded);
  const inDashRange = meleeOnly
    ? actualDist >= 3.0 && actualDist <= 12.5
    : actualDist >= 3.2 && actualDist <= 11.5;

  if (
    brain.dashDecisionSec <= 0 &&
    bot.movement.dashCooldown <= 0 &&
    (brain.hasLos || meleeOnly) &&
    inDashRange &&
    (bot.movement.isGrounded || allowAirDash)
  ) {
    if (Math.random() < profile.dashChance) {
      input.dash = true;
    }
    const dashDelayScale =
      profile.id === "nightmare" ? 0.55 : profile.id === "hard" ? 0.75 : 1.1;
    brain.dashDecisionSec = randomRange(1.8, 3.8) * dashDelayScale;
  }
}
