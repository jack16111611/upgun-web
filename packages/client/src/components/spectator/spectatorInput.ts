import { MAX_PITCH_RAD } from "@upgun/shared";
import { useSettingsStore } from "../../store/settingsStore";
import {
  clampValue,
  getAliveSpectateIds,
  isRuntimeSpectating,
  isSpectatorInputBlocked,
} from "./spectatorHelpers";
import { useSpectatorStore } from "./spectatorStore";

export const FOLLOW_MIN_PITCH = -0.22;
export const FOLLOW_MAX_PITCH = 1.15;

const MOUSE_LOOK_SENSITIVITY = 0.0024;
const TOUCH_LOOK_SENSITIVITY = 0.0052;
const CLICK_DRAG_THRESHOLD_PX = 6;

export interface SpectatorInputState {
  keys: Set<string>;
  orbitYaw: number;
  orbitPitch: number;
  droneYaw: number;
  dronePitch: number;
}

export function createSpectatorInputState(): SpectatorInputState {
  return {
    keys: new Set<string>(),
    orbitYaw: 0,
    orbitPitch: 0.32,
    droneYaw: 0,
    dronePitch: -0.25,
  };
}

export function attachSpectatorInputListeners(
  canvas: HTMLCanvasElement,
  state: SpectatorInputState,
): () => void {
  const drag = {
    active: false,
    button: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  };
  const touchLook: { id: number | null; lastX: number; lastY: number } = {
    id: null,
    lastX: 0,
    lastY: 0,
  };

  const applyLookDelta = (dx: number, dy: number, baseScale: number) => {
    const sens = useSettingsStore.getState().mouseSensitivity * baseScale;
    const mode = useSpectatorStore.getState().mode;
    if (mode === "freefly") {
      state.droneYaw -= dx * sens;
      state.dronePitch = clampValue(
        state.dronePitch - dy * sens,
        -MAX_PITCH_RAD,
        MAX_PITCH_RAD,
      );
    } else {
      state.orbitYaw -= dx * sens;
      state.orbitPitch = clampValue(
        state.orbitPitch + dy * sens,
        FOLLOW_MIN_PITCH,
        FOLLOW_MAX_PITCH,
      );
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!isRuntimeSpectating() || isSpectatorInputBlocked()) return;
    const store = useSpectatorStore.getState();

    if (e.code === "KeyF" && !e.repeat) {
      e.preventDefault();
      store.toggleMode();
      return;
    }

    if (e.code === "Space") {
      if (store.mode === "follow" && !e.repeat) {
        e.preventDefault();
        store.toggleMode();
        return;
      }
      if (store.mode === "freefly") {
        e.preventDefault();
      }
    }

    if (store.mode === "follow" && !e.repeat) {
      if (e.code === "ArrowLeft") {
        store.cycleTarget(-1, getAliveSpectateIds());
        return;
      }
      if (e.code === "ArrowRight") {
        store.cycleTarget(1, getAliveSpectateIds());
        return;
      }
    }

    state.keys.add(e.code);
  };

  const onKeyUp = (e: KeyboardEvent) => {
    state.keys.delete(e.code);
  };

  const onBlur = () => {
    state.keys.clear();
    drag.active = false;
    touchLook.id = null;
  };

  const onMouseDown = (e: MouseEvent) => {
    if (!isRuntimeSpectating() || isSpectatorInputBlocked()) return;
    if (e.button !== 0 && e.button !== 2) return;

    const store = useSpectatorStore.getState();
    if (document.pointerLockElement === canvas) {
      if (store.mode === "follow") {
        store.cycleTarget(e.button === 0 ? -1 : 1, getAliveSpectateIds());
      }
      return;
    }

    drag.active = true;
    drag.button = e.button;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.moved = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isRuntimeSpectating() || isSpectatorInputBlocked()) return;

    if (document.pointerLockElement === canvas) {
      applyLookDelta(e.movementX, e.movementY, MOUSE_LOOK_SENSITIVITY);
      return;
    }

    if (!drag.active) return;

    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    if (
      !drag.moved &&
      Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= CLICK_DRAG_THRESHOLD_PX
    ) {
      drag.moved = true;
    }

    applyLookDelta(dx, dy, MOUSE_LOOK_SENSITIVITY * 1.45);
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!drag.active) return;
    const wasClick = !drag.moved && drag.button === e.button;
    drag.active = false;
    drag.button = -1;

    if (wasClick && isRuntimeSpectating() && !isSpectatorInputBlocked()) {
      const store = useSpectatorStore.getState();
      if (store.mode === "follow") {
        store.cycleTarget(e.button === 0 ? -1 : 1, getAliveSpectateIds());
      }
    }
  };

  const onContextMenu = (e: MouseEvent) => {
    if (isRuntimeSpectating() && !isSpectatorInputBlocked()) {
      e.preventDefault();
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    if (!isRuntimeSpectating() || isSpectatorInputBlocked()) return;
    if (touchLook.id !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchLook.id = touch.identifier;
    touchLook.lastX = touch.clientX;
    touchLook.lastY = touch.clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchLook.id === null || !isRuntimeSpectating() || isSpectatorInputBlocked()) return;
    for (let i = 0; i < e.changedTouches.length; i += 1) {
      const touch = e.changedTouches[i];
      if (!touch || touch.identifier !== touchLook.id) continue;
      const dx = touch.clientX - touchLook.lastX;
      const dy = touch.clientY - touchLook.lastY;
      touchLook.lastX = touch.clientX;
      touchLook.lastY = touch.clientY;
      applyLookDelta(dx, dy, TOUCH_LOOK_SENSITIVITY);
      break;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchLook.id === null) return;
    for (let i = 0; i < e.changedTouches.length; i += 1) {
      const touch = e.changedTouches[i];
      if (touch && touch.identifier === touchLook.id) {
        touchLook.id = null;
        break;
      }
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd);
  canvas.addEventListener("touchcancel", onTouchEnd);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    canvas.removeEventListener("touchcancel", onTouchEnd);
  };
}
