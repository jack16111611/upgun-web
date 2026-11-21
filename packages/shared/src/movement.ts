import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, KinematicCharacterController, RigidBody, World } from "@dimforge/rapier3d-compat";
import {
  PLAYER_AIR_ACCEL,
  PLAYER_DASH_COOLDOWN_SEC,
  PLAYER_DASH_DURATION_SEC,
  PLAYER_DASH_SPEED,
  PLAYER_GRAVITY,
  PLAYER_GROUND_ACCEL,
  PLAYER_HALF_HEIGHT,
  PLAYER_JUMP_SPEED,
  PLAYER_MAX_JUMPS,
  PLAYER_MOVE_SPEED,
  PLAYER_RADIUS,
  PLAYER_SPAWN_Y,
} from "./constants";
import type { PlayerComputedStats } from "./cards/types";
import type { InputFrame } from "./input";
import { checkJumpPadTrigger } from "./maps";
import type { ArenaMapDefinition, JumpPadDefinition } from "./maps/types";
import { getMoveAxes } from "./combat";

const CHARACTER_CONTROLLER_OFFSET = 0.02;
const SNAP_TO_GROUND_DISTANCE = 0.3;
const MAX_FALL_SPEED = -42;
const BUNNY_HOP_WINDOW_SEC = 0.16;
const JUMP_PAD_COOLDOWN_SEC = 0.45;

export interface PlayerMovementState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isGrounded: boolean;
  groundedTimeSec: number;
  jumpsRemaining: number;
  jumpHeld: boolean;
  dashHeld: boolean;
  dashCooldown: number;
  dashTimeLeft: number;
  dashDirX: number;
  dashDirZ: number;
  jumpPadCooldown: number;
}

export function createInitialMovementState(
  x = 0,
  y = PLAYER_SPAWN_Y,
  z = 0,
): PlayerMovementState {
  return {
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    isGrounded: false,
    groundedTimeSec: 0,
    jumpsRemaining: PLAYER_MAX_JUMPS,
    jumpHeld: false,
    dashHeld: false,
    dashCooldown: 0,
    dashTimeLeft: 0,
    dashDirX: 0,
    dashDirZ: -1,
    jumpPadCooldown: 0,
  };
}

export function createPlayerCharacterController(
  world: World,
): KinematicCharacterController {
  const controller = world.createCharacterController(CHARACTER_CONTROLLER_OFFSET);
  controller.setUp({ x: 0, y: 1, z: 0 });
  controller.setSlideEnabled(true);
  controller.enableAutostep(0.35, 0.25, false);
  controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
  controller.setMinSlopeSlideAngle((50 * Math.PI) / 180);
  controller.enableSnapToGround(SNAP_TO_GROUND_DISTANCE);
  return controller;
}

export function createPlayerBodyAndCollider(
  rapier: typeof RAPIER,
  world: World,
  x: number,
  y: number,
  z: number,
): { body: RigidBody; collider: Collider } {
  const bodyDesc = rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z);
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = rapier.ColliderDesc.capsule(PLAYER_HALF_HEIGHT, PLAYER_RADIUS);
  const collider = world.createCollider(colliderDesc, body);
  return { body, collider };
}

export interface StepPlayerMovementParams {
  state: PlayerMovementState;
  input: InputFrame;
  dt: number;
  controller: KinematicCharacterController;
  collider: Collider;
  body: RigidBody;
  world: World;
  stats?: PlayerComputedStats;
  speedMultiplier?: number;
  gravityMultiplier?: number;
  dashCooldownMultiplier?: number;
  extraJumpsBonus?: number;
  airControlMultiplier?: number;
  infiniteCooldowns?: boolean;
  map?: ArenaMapDefinition;
  onDash?: (dirX: number, dirZ: number) => void;
  onJumpPad?: (pad: JumpPadDefinition) => void;
  filterPredicate?: (collider: Collider) => boolean;
}

function approach(current: number, target: number, maxDelta: number): number {
  const diff = target - current;
  if (Math.abs(diff) <= maxDelta) {
    return target;
  }
  return current + Math.sign(diff) * maxDelta;
}

export function stepPlayerMovement(params: StepPlayerMovementParams): PlayerMovementState {
  const {
    state,
    input,
    dt: rawDt,
    controller,
    collider,
    body,
    world,
    stats,
    speedMultiplier = 1,
    gravityMultiplier = 1,
    dashCooldownMultiplier = 1,
    extraJumpsBonus = 0,
    airControlMultiplier = 1,
    infiniteCooldowns = false,
    map,
    onDash,
    onJumpPad,
    filterPredicate,
  } = params;

  if (!Number.isFinite(rawDt) || rawDt <= 0) {
    return state;
  }
  const dt = Math.min(rawDt, 0.1);
  if (!Number.isFinite(state.vx)) state.vx = 0;
  if (!Number.isFinite(state.vy)) state.vy = 0;
  if (!Number.isFinite(state.vz)) state.vz = 0;

  const safeSpeedMult = Number.isFinite(speedMultiplier) ? Math.max(0.1, Math.min(3, speedMultiplier)) : 1;
  const safeGravMult = Number.isFinite(gravityMultiplier) ? Math.max(0.1, Math.min(3, gravityMultiplier)) : 1;
  const safeDashCdMult = Number.isFinite(dashCooldownMultiplier)
    ? Math.max(0.15, Math.min(2, dashCooldownMultiplier))
    : 1;
  const safeAirMult = Number.isFinite(airControlMultiplier)
    ? Math.max(0.5, Math.min(3, airControlMultiplier))
    : 1;
  const moveSpeed = (stats?.moveSpeed ?? PLAYER_MOVE_SPEED) * safeSpeedMult;
  const jumpForce = stats?.jumpForce ?? PLAYER_JUMP_SPEED;
  const maxJumps = PLAYER_MAX_JUMPS + (stats?.extraJumps ?? 0) + Math.max(0, extraJumpsBonus);
  const dashCooldown = infiniteCooldowns
    ? 0
    : (stats?.dashCooldown ?? PLAYER_DASH_COOLDOWN_SEC) * safeDashCdMult;
  const dashImpulse = stats?.dashImpulse ?? PLAYER_DASH_SPEED;
  const gravity = PLAYER_GRAVITY * (stats?.gravityScale ?? 1) * safeGravMult;
  const bunnyHopBoost = stats?.bunnyHopBoost ?? 0;

  const rawMoveX = Number.isFinite(input.moveX) ? input.moveX : 0;
  const rawMoveZ = Number.isFinite(input.moveZ) ? input.moveZ : 0;
  const safeYaw = Number.isFinite(input.yaw) ? input.yaw : 0;
  const clampedX = Math.max(-1, Math.min(1, rawMoveX));
  const clampedZ = Math.max(-1, Math.min(1, rawMoveZ));
  const inputMag = Math.hypot(clampedX, clampedZ);
  const normX = inputMag > 1 ? clampedX / inputMag : clampedX;
  const normZ = inputMag > 1 ? clampedZ / inputMag : clampedZ;

  const { forwardX, forwardZ, rightX, rightZ } = getMoveAxes(safeYaw);
  const wishX = rightX * normX + forwardX * normZ;
  const wishZ = rightZ * normX + forwardZ * normZ;

  state.dashCooldown = Math.max(0, state.dashCooldown - dt);
  state.dashTimeLeft = Math.max(0, state.dashTimeLeft - dt);
  state.jumpPadCooldown = Math.max(0, state.jumpPadCooldown - dt);

  if (input.dash && !state.dashHeld && state.dashCooldown <= 0) {
    const wishLen = Math.hypot(wishX, wishZ);
    state.dashDirX = wishLen > 0.01 ? wishX / wishLen : forwardX;
    state.dashDirZ = wishLen > 0.01 ? wishZ / wishLen : forwardZ;
    state.dashTimeLeft = PLAYER_DASH_DURATION_SEC;
    state.dashCooldown = dashCooldown;
    if (state.vy < 1.5) {
      state.vy = 1.5;
    }
    onDash?.(state.dashDirX, state.dashDirZ);
  }

  if (state.dashTimeLeft > 0) {
    state.vx = state.dashDirX * dashImpulse;
    state.vz = state.dashDirZ * dashImpulse;
  } else {
    const accel = state.isGrounded ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL * safeAirMult;
    const targetVx = wishX * moveSpeed;
    const targetVz = wishZ * moveSpeed;
    state.vx = approach(state.vx, targetVx, accel * dt);
    state.vz = approach(state.vz, targetVz, accel * dt);
  }

  if (state.isGrounded) {
    state.jumpsRemaining = maxJumps;
    state.groundedTimeSec += dt;
  } else {
    state.groundedTimeSec = 0;
  }

  if (input.jump && !state.jumpHeld && state.jumpsRemaining > 0) {
    if (bunnyHopBoost > 0 && state.isGrounded && state.groundedTimeSec <= BUNNY_HOP_WINDOW_SEC) {
      const horizSpeed = Math.hypot(state.vx, state.vz);
      const boosted = Math.min(moveSpeed * 1.9, Math.max(horizSpeed, moveSpeed) * (1 + bunnyHopBoost));
      const wishLen = Math.hypot(wishX, wishZ);
      if (wishLen > 0.01) {
        state.vx = (wishX / wishLen) * boosted;
        state.vz = (wishZ / wishLen) * boosted;
      } else if (horizSpeed > 0.01) {
        state.vx = (state.vx / horizSpeed) * boosted;
        state.vz = (state.vz / horizSpeed) * boosted;
      }
    }
    state.vy = jumpForce;
    state.jumpsRemaining -= 1;
    state.isGrounded = false;
    state.groundedTimeSec = 0;
  }

  if (state.vy > 0) {
    controller.disableSnapToGround();
  } else if (!controller.snapToGroundEnabled()) {
    controller.enableSnapToGround(SNAP_TO_GROUND_DISTANCE);
  }

  state.vy = Math.max(MAX_FALL_SPEED, state.vy - gravity * dt);
  const desiredY = state.isGrounded && state.vy < 0 ? -2.0 * dt : state.vy * dt;

  controller.computeColliderMovement(
    collider,
    { x: state.vx * dt, y: desiredY, z: state.vz * dt },
    undefined,
    undefined,
    filterPredicate,
  );

  const moved = controller.computedMovement();
  const grounded = controller.computedGrounded();
  const currentPos = body.translation();
  let nextX = currentPos.x + (Number.isFinite(moved.x) ? moved.x : 0);
  let nextY = currentPos.y + (Number.isFinite(moved.y) ? moved.y : 0);
  let nextZ = currentPos.z + (Number.isFinite(moved.z) ? moved.z : 0);

  if (!Number.isFinite(nextX) || !Number.isFinite(nextY) || !Number.isFinite(nextZ) || nextY < -15) {
    nextX = 0;
    nextY = PLAYER_SPAWN_Y;
    nextZ = 0;
    state.vx = 0;
    state.vy = 0;
    state.vz = 0;
  }

  body.setTranslation({ x: nextX, y: nextY, z: nextZ }, true);
  world.propagateModifiedBodyPositionsToColliders();

  if (state.vy > 0 && moved.y < state.vy * dt * 0.5) {
    state.vy = 0;
  }

  if (grounded) {
    state.isGrounded = true;
    state.jumpsRemaining = maxJumps;
    if (state.vy < 0) {
      state.vy = 0;
    }
  } else {
    state.isGrounded = false;
  }

  state.x = nextX;
  state.y = nextY;
  state.z = nextZ;

  // Check jump pad trigger on the active arena map
  if (map && state.jumpPadCooldown <= 0) {
    const pad = checkJumpPadTrigger(map, nextX, nextY, nextZ);
    if (pad) {
      state.vx = pad.launchVelocity[0] !== 0 ? pad.launchVelocity[0] : state.vx;
      state.vy = pad.launchVelocity[1];
      state.vz = pad.launchVelocity[2] !== 0 ? pad.launchVelocity[2] : state.vz;
      state.isGrounded = false;
      state.groundedTimeSec = 0;
      state.jumpsRemaining = Math.max(1, maxJumps - 1);
      state.jumpPadCooldown = JUMP_PAD_COOLDOWN_SEC;
      onJumpPad?.(pad);
    }
  }

  state.jumpHeld = input.jump;
  state.dashHeld = input.dash;

  return state;
}
