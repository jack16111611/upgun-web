import { MAX_PITCH_RAD, type DeviceType, type InputFrame, type Vec3 } from "@upgun/shared";
import { commsStore } from "../components/comms";
import { hudLayoutStore } from "../components/mobile";
import { sendDeviceType } from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import {
  computeMagneticAimAssist,
  resetAimAssistState,
  type AimAssistCandidate,
} from "./aimAssist";
import { GamepadInput } from "./gamepadInput";
import { gyroInput } from "./gyroInput";
import { KeyboardMouseInput } from "./keyboardMouseInput";
import { touchInput } from "./touchInput";

function clampMove(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class InputManager {
  private readonly kbMouse = new KeyboardMouseInput();
  private readonly gamepad = new GamepadInput();
  private yaw = 0;
  private pitch = 0;
  private lookSensitivityScale = 1;
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
    resetAimAssistState();
  }

  sampleInputFrame(
    eyePos: Vec3,
    dt: number,
    enemyTargets: readonly AimAssistCandidate[],
    hasLineOfSight?: (from: Vec3, to: Vec3) => boolean,
  ): InputFrame {
    const game = useGameStore.getState();
    const comms = commsStore.getState();
    const layoutEditorOpen = hudLayoutStore.getState().editorOpen;
    const menusOpen =
      game.lobbyOpen ||
      game.settingsOpen ||
      game.sandboxOpen ||
      layoutEditorOpen ||
      comms.chatInputOpen ||
      comms.quickChatOpen ||
      game.phase === "drafting" ||
      game.phase === "match_over";
    const settings = useSettingsStore.getState();
    const showTouch = settings.showTouchControls;

    if (menusOpen) {
      touchInput.reset();
      resetAimAssistState();
    }

    const km = this.kbMouse.sample();
    const gp = this.gamepad.poll(dt);
    const gyro = !menusOpen ? gyroInput.sample(dt) : { deltaYaw: 0, deltaPitch: 0, active: false };
    const tc =
      showTouch && !menusOpen
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

    // Track active input device and sync with server on switch
    let nextDevice: DeviceType | null = null;
    if (gp.active) {
      nextDevice = "gamepad";
    } else if (tc.active || gyro.active) {
      nextDevice = "mobile";
    } else if (km.active) {
      nextDevice = "desktop";
    }

    if (nextDevice && nextDevice !== this.activeDevice) {
      this.activeDevice = nextDevice;
      if (game.activeDevice !== nextDevice) {
        game.setActiveDevice(nextDevice);
      }
      if (
        (nextDevice === "mobile" || nextDevice === "gamepad") &&
        !settings.aimAssistCustomized &&
        settings.aimAssistPreset === "off"
      ) {
        settings.setAimAssistPreset("strong", false);
      }
      sendDeviceType(nextDevice);
    }

    const activePreset = useSettingsStore.getState().aimAssistPreset;
    const dampScale = activePreset === "off" ? 1 : this.lookSensitivityScale;
    const moveX = menusOpen ? 0 : clampMove(km.moveX + gp.moveX + tc.moveX);
    const moveZ = menusOpen ? 0 : clampMove(km.moveZ + gp.moveZ + tc.moveZ);

    // Apply unified look deltas with aim-slowdown bubble dampening
    const rawDeltaYaw = km.deltaYaw + (gp.deltaYaw + tc.deltaYaw + gyro.deltaYaw) * dampScale;
    const rawDeltaPitch =
      km.deltaPitch + (gp.deltaPitch + tc.deltaPitch + gyro.deltaPitch) * dampScale;
    this.yaw += rawDeltaYaw;
    this.pitch = Math.max(-MAX_PITCH_RAD, Math.min(MAX_PITCH_RAD, this.pitch + rawDeltaPitch));

    let autoFire = false;
    if (!menusOpen && game.isAlive && enemyTargets.length > 0) {
      const assist = computeMagneticAimAssist({
        eyePos,
        yaw: this.yaw,
        pitch: this.pitch,
        dt,
        targets: enemyTargets,
        preset: activePreset,
        isAiming: tc.isAiming || gp.active || gyro.active || km.fire,
        moveX,
        autoFireEnabled: settings.autoFireEnabled && !game.isReloading,
        hasLineOfSight,
      });
      this.yaw = assist.yaw;
      this.pitch = assist.pitch;
      this.lookSensitivityScale = assist.lookSensitivityScale;
      autoFire = assist.autoFire;
    } else {
      this.lookSensitivityScale = 1;
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
      moveX,
      moveZ,
      yaw: this.yaw,
      pitch: this.pitch,
      jump: km.jump || gp.jump || tc.jump,
      dash: km.dash || gp.dash || tc.dash,
      fire: km.fire || gp.fire || tc.fire || autoFire,
      grenade: km.grenade || gp.grenade || tc.grenade,
      reload: km.reload || gp.reload || tc.reload,
      melee: km.melee || gp.melee || tc.melee,
    };
  }

  dispose(): void {
    this.kbMouse.dispose();
    touchInput.reset();
    resetAimAssistState();
  }
}
