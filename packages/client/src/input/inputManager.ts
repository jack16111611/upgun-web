import { MAX_PITCH_RAD, type DeviceType, type InputFrame, type Vec3 } from "@upgun/shared";
import { commsStore } from "../components/comms";
import { sendDeviceType } from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { GamepadInput } from "./gamepadInput";
import { KeyboardMouseInput } from "./keyboardMouseInput";
import { touchInput, type AimAssistTarget } from "./touchInput";

function clampMove(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class InputManager {
  private readonly kbMouse = new KeyboardMouseInput();
  private readonly gamepad = new GamepadInput();
  private yaw = 0;
  private pitch = 0;
  private activeDevice: DeviceType =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0
      ? "mobile"
      : "desktop";

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.kbMouse.attachCanvas(canvas);
  }

  requestPointerLock(): void {
    this.kbMouse.requestPointerLock();
  }

  exitPointerLock(): void {
    this.kbMouse.exitPointerLock();
  }

  setLookAngles(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, pitch));
  }

  getLookAngles(): { yaw: number; pitch: number } {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  resetTransientTouch(): void {
    touchInput.reset();
  }

  sampleInputFrame(
    eyePos: Vec3,
    dt: number,
    enemyTargets: readonly AimAssistTarget[],
  ): InputFrame {
    const game = useGameStore.getState();
    const comms = commsStore.getState();
    const menusOpen =
      game.lobbyOpen ||
      game.settingsOpen ||
      game.sandboxOpen ||
      comms.chatInputOpen ||
      comms.quickChatOpen ||
      game.phase === "drafting" ||
      game.phase === "match_over";
    const showTouch = useSettingsStore.getState().showTouchControls;

    if (menusOpen) {
      touchInput.reset();
    }

    const km = this.kbMouse.sample();
    const gp = this.gamepad.poll(dt);
    const tc = showTouch && !menusOpen
      ? touchInput.sample()
      : {
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
          isAiming: false,
          active: false,
        };

    // Update unified camera angles
    this.yaw += km.deltaYaw + gp.deltaYaw + tc.deltaYaw;
    this.pitch = Math.max(
      -MAX_PITCH_RAD,
      Math.min(MAX_PITCH_RAD, this.pitch + km.deltaPitch + gp.deltaPitch + tc.deltaPitch),
    );

    if (showTouch && !menusOpen && tc.isAiming && !km.active && !gp.active) {
      const assisted = touchInput.applyAimAssist(
        eyePos,
        this.yaw,
        this.pitch,
        enemyTargets,
        dt,
      );
      this.yaw = assisted.yaw;
      this.pitch = assisted.pitch;
    }

    // Track active input device and sync with server on switch
    let nextDevice: DeviceType | null = null;
    if (gp.active) {
      nextDevice = "gamepad";
    } else if (tc.active) {
      nextDevice = "mobile";
    } else if (km.active) {
      nextDevice = "desktop";
    }

    if (nextDevice && nextDevice !== this.activeDevice) {
      this.activeDevice = nextDevice;
      if (game.activeDevice !== nextDevice) {
        game.setActiveDevice(nextDevice);
      }
      sendDeviceType(nextDevice);
    }

    if (menusOpen) {
      return {
        moveX: 0,
        moveZ: 0,
        yaw: this.yaw,
        pitch: this.pitch,
        jump: false,
        dash: false,
        fire: false,
        grenade: false,
        reload: false,
        melee: false,
      };
    }

    return {
      moveX: clampMove(km.moveX + gp.moveX + tc.moveX),
      moveZ: clampMove(km.moveZ + gp.moveZ + tc.moveZ),
      yaw: this.yaw,
      pitch: this.pitch,
      jump: km.jump || gp.jump || tc.jump,
      dash: km.dash || gp.dash || tc.dash,
      fire: km.fire || gp.fire || tc.fire,
      grenade: km.grenade || gp.grenade || tc.grenade,
      reload: km.reload || gp.reload || tc.reload,
      melee: km.melee || gp.melee || tc.melee,
    };
  }

  dispose(): void {
    this.kbMouse.dispose();
    touchInput.reset();
  }
}
