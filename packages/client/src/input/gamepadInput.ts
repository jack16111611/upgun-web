import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";

const STICK_DEADZONE = 0.16;
const BASE_LOOK_SPEED_RAD = 2.6;

export interface GamepadSample {
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
  active: boolean;
}

function applyRadialDeadzone(
  rawX: number,
  rawY: number,
  deadzone = STICK_DEADZONE,
): { x: number; y: number } {
  const mag = Math.hypot(rawX, rawY);
  if (mag <= deadzone) {
    return { x: 0, y: 0 };
  }
  const scaled = Math.min(1, (mag - deadzone) / (1 - deadzone));
  return {
    x: (rawX / mag) * scaled,
    y: (rawY / mag) * scaled,
  };
}

function isPressed(btn: GamepadButton | undefined, threshold = 0.25): boolean {
  if (!btn) {
    return false;
  }
  return btn.pressed || btn.value > threshold;
}

export class GamepadInput {
  private selectHeld = false;

  poll(dt: number): GamepadSample {
    const empty: GamepadSample = {
      moveX: 0,
      moveZ: 0,
      jump: false,
      dash: false,
      fire: false,
      grenade: false,
      reload: false,
      melee: false,
      deltaYaw: 0,
      deltaPitch: 0,
      active: false,
    };

    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      return empty;
    }

    const pads = navigator.getGamepads();
    let pad: Gamepad | null = null;
    for (const candidate of pads) {
      if (candidate && candidate.connected) {
        pad = candidate;
        break;
      }
    }

    if (!pad) {
      if (this.selectHeld) {
        this.selectHeld = false;
        useGameStore.getState().setScoreboardOpen(false);
      }
      return empty;
    }

    const game = useGameStore.getState();
    const selectDown = isPressed(pad.buttons[8]);
    if (selectDown !== this.selectHeld) {
      this.selectHeld = selectDown;
      if (game.status === "connected" && !game.lobbyOpen && !game.settingsOpen) {
        game.setScoreboardOpen(selectDown);
      }
    }

    if (game.lobbyOpen || game.settingsOpen) {
      return empty;
    }

    const leftStick = applyRadialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const rightStick = applyRadialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);

    const sens = useSettingsStore.getState().mouseSensitivity;
    const lookMag = Math.hypot(rightStick.x, rightStick.y);
    const curvedScale = lookMag > 0 ? Math.pow(lookMag, 1.35) / lookMag : 0;
    const turnSpeed = BASE_LOOK_SPEED_RAD * sens * curvedScale;

    const deltaYaw = -rightStick.x * turnSpeed * dt;
    const deltaPitch = -rightStick.y * turnSpeed * 0.8 * dt;

    const jump = isPressed(pad.buttons[0]); // A / Cross
    const melee = isPressed(pad.buttons[1]); // B / Circle
    const reload = isPressed(pad.buttons[2]); // X / Square
    const grenade = isPressed(pad.buttons[4]); // LB
    const dash = isPressed(pad.buttons[5]) || isPressed(pad.buttons[6]); // RB or LT
    const fire = isPressed(pad.buttons[7]); // RT

    const active =
      Math.hypot(leftStick.x, leftStick.y) > 0 ||
      lookMag > 0 ||
      jump ||
      melee ||
      reload ||
      grenade ||
      dash ||
      fire ||
      selectDown;

    return {
      moveX: leftStick.x,
      moveZ: -leftStick.y,
      jump,
      dash,
      fire,
      grenade,
      reload,
      melee,
      deltaYaw,
      deltaPitch,
      active,
    };
  }
}
