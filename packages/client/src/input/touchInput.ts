import { getAimDirection, MAX_PITCH_RAD, type Vec3 } from "@upgun/shared";
import { useSettingsStore } from "../store/settingsStore";

const TOUCH_LOOK_SENSITIVITY = 0.0045;
const AIM_ASSIST_MAX_RANGE = 40;
const AIM_ASSIST_CONE_RAD = (7 * Math.PI) / 180;
const AIM_ASSIST_STRENGTH = 3.4;

export type TouchActionName = "fire" | "jump" | "dash" | "grenade" | "reload" | "melee";

export interface TouchSample {
  moveX: number;
  moveZ: number;
  jump: boolean;
  dash: boolean;
  fire: boolean;
  grenade: boolean;
  reload: boolean;
  melee: boolean;
  deltaYaw: number;
  deltaPitch: number;
  isAiming: boolean;
  active: boolean;
}

export interface AimAssistTarget {
  x: number;
  y: number;
  z: number;
}

function shortestAngleDiff(current: number, target: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export class TouchInputController {
  private moveX = 0;
  private moveZ = 0;
  private deltaYaw = 0;
  private deltaPitch = 0;
  private aimDragging = false;
  private recentActivity = false;

  private readonly actionSources: Record<TouchActionName, Set<string>> = {
    fire: new Set(),
    jump: new Set(),
    dash: new Set(),
    grenade: new Set(),
    reload: new Set(),
    melee: new Set(),
  };

  setMove(x: number, z: number): void {
    const mag = Math.hypot(x, z);
    if (mag > 1) {
      this.moveX = x / mag;
      this.moveZ = z / mag;
    } else {
      this.moveX = x;
      this.moveZ = z;
    }
    if (Math.abs(x) > 0.01 || Math.abs(z) > 0.01) {
      this.recentActivity = true;
    }
  }

  setAimDragging(dragging: boolean): void {
    this.aimDragging = dragging;
    if (dragging) {
      this.recentActivity = true;
    }
  }

  addLookDelta(dx: number, dy: number, sensitivityScale = 1): void {
    const sens =
      useSettingsStore.getState().mouseSensitivity *
      TOUCH_LOOK_SENSITIVITY *
      sensitivityScale;
    this.deltaYaw -= dx * sens;
    this.deltaPitch -= dy * sens;
    this.recentActivity = true;
  }

  setAction(action: TouchActionName, pressed: boolean): void {
    this.setActionSource(action, "default", pressed);
  }

  setActionSource(action: TouchActionName, sourceId: string, pressed: boolean): void {
    const set = this.actionSources[action];
    if (pressed) {
      set.add(sourceId);
      this.recentActivity = true;
    } else {
      set.delete(sourceId);
    }
  }

  private isActionPressed(action: TouchActionName): boolean {
    return this.actionSources[action].size > 0;
  }

  reset(): void {
    this.moveX = 0;
    this.moveZ = 0;
    this.deltaYaw = 0;
    this.deltaPitch = 0;
    this.aimDragging = false;
    this.recentActivity = false;
    this.actionSources.fire.clear();
    this.actionSources.jump.clear();
    this.actionSources.dash.clear();
    this.actionSources.grenade.clear();
    this.actionSources.reload.clear();
    this.actionSources.melee.clear();
  }

  sample(): TouchSample {
    const deltaYaw = this.deltaYaw;
    const deltaPitch = this.deltaPitch;
    this.deltaYaw = 0;
    this.deltaPitch = 0;

    const fire = this.isActionPressed("fire");
    const jump = this.isActionPressed("jump");
    const dash = this.isActionPressed("dash");
    const grenade = this.isActionPressed("grenade");
    const reload = this.isActionPressed("reload");
    const melee = this.isActionPressed("melee");

    const hasAction = fire || jump || dash || grenade || reload || melee;

    const active =
      this.recentActivity ||
      this.aimDragging ||
      hasAction ||
      Math.hypot(this.moveX, this.moveZ) > 0.01 ||
      deltaYaw !== 0 ||
      deltaPitch !== 0;

    this.recentActivity = false;

    return {
      moveX: this.moveX,
      moveZ: this.moveZ,
      jump,
      dash,
      fire,
      grenade,
      reload,
      melee,
      deltaYaw,
      deltaPitch,
      isAiming: this.aimDragging || fire,
      active,
    };
  }

  /**
   * Subtle touch aim-assist magnetism when crosshair passes close to an enemy hitbox.
   */
  applyAimAssist(
    eyePos: Vec3,
    yaw: number,
    pitch: number,
    targets: readonly AimAssistTarget[],
    dt: number,
  ): { yaw: number; pitch: number } {
    if (targets.length === 0) {
      return { yaw, pitch };
    }

    const aimDir = getAimDirection(yaw, pitch);
    let bestAngle = AIM_ASSIST_CONE_RAD;
    let bestYaw = yaw;
    let bestPitch = pitch;
    let found = false;

    for (const target of targets) {
      const dx = target.x - eyePos.x;
      const dy = target.y + 0.15 - eyePos.y;
      const dz = target.z - eyePos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 0.8 || dist > AIM_ASSIST_MAX_RANGE) {
        continue;
      }

      const dot = (dx * aimDir.x + dy * aimDir.y + dz * aimDir.z) / dist;
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (angle < bestAngle) {
        bestAngle = angle;
        bestYaw = Math.atan2(-dx, -dz);
        bestPitch = Math.atan2(dy, Math.hypot(dx, dz));
        found = true;
      }
    }

    if (!found) {
      return { yaw, pitch };
    }

    const closeness = 1 - bestAngle / AIM_ASSIST_CONE_RAD;
    const blend = Math.min(0.28, dt * AIM_ASSIST_STRENGTH * (0.45 + closeness * 0.55));
    const nextYaw = yaw + shortestAngleDiff(yaw, bestYaw) * blend;
    const nextPitch = Math.max(
      -MAX_PITCH_RAD,
      Math.min(MAX_PITCH_RAD, pitch + (bestPitch - pitch) * blend),
    );
    return { yaw: nextYaw, pitch: nextPitch };
  }
}

export const touchInput = new TouchInputController();
