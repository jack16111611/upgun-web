import { commsStore } from "../components/comms";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";

const BASE_MOUSE_SENSITIVITY = 0.0022;

export interface KeyboardMouseSample {
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

export class KeyboardMouseInput {
  private readonly keys = new Set<string>();
  private mouseLeftDown = false;
  private mouseRightDown = false;
  private mouseMiddleDown = false;
  private deltaYaw = 0;
  private deltaPitch = 0;
  private targetCanvas: HTMLCanvasElement | null = null;
  private tabHeld = false;
  private hadRecentInput = false;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.targetCanvas = canvas;
  }

  requestPointerLock(): void {
    const game = useGameStore.getState();
    const settings = useSettingsStore.getState();
    const comms = commsStore.getState();
    if (
      game.lobbyOpen ||
      game.settingsOpen ||
      game.sandboxOpen ||
      comms.chatInputOpen ||
      comms.quickChatOpen ||
      game.phase === "drafting" ||
      game.phase === "match_over" ||
      settings.showTouchControls
    ) {
      return;
    }
    if (!this.targetCanvas || document.pointerLockElement === this.targetCanvas) {
      return;
    }
    void this.targetCanvas.requestPointerLock?.();
  }

  exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  isLocked(): boolean {
    return this.targetCanvas !== null && document.pointerLockElement === this.targetCanvas;
  }

  sample(): KeyboardMouseSample {
    const game = useGameStore.getState();
    const comms = commsStore.getState();
    const allowInput =
      this.isLocked() &&
      !game.lobbyOpen &&
      !game.settingsOpen &&
      !game.sandboxOpen &&
      !comms.chatInputOpen &&
      !comms.quickChatOpen &&
      game.phase !== "drafting" &&
      game.phase !== "match_over";

    const moveZ = allowInput
      ? (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) -
        (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0)
      : 0;
    const moveX = allowInput
      ? (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
        (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0)
      : 0;

    const jump = allowInput && this.keys.has("Space");
    const dash =
      allowInput &&
      (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.mouseRightDown);
    const fire = allowInput && this.mouseLeftDown;
    const grenade = allowInput && (this.keys.has("KeyG") || this.keys.has("KeyQ"));
    const reload = allowInput && this.keys.has("KeyR");
    const melee =
      allowInput && (this.keys.has("KeyV") || this.keys.has("KeyE") || this.mouseMiddleDown);

    const deltaYaw = allowInput ? this.deltaYaw : 0;
    const deltaPitch = allowInput ? this.deltaPitch : 0;
    this.deltaYaw = 0;
    this.deltaPitch = 0;

    const active =
      allowInput &&
      (this.hadRecentInput ||
        moveX !== 0 ||
        moveZ !== 0 ||
        jump ||
        dash ||
        fire ||
        grenade ||
        reload ||
        melee ||
        deltaYaw !== 0 ||
        deltaPitch !== 0);
    this.hadRecentInput = false;

    return {
      moveX,
      moveZ,
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

  private clearCombatInputs(): void {
    this.keys.clear();
    this.mouseLeftDown = false;
    this.mouseRightDown = false;
    this.deltaYaw = 0;
    this.deltaPitch = 0;
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const game = useGameStore.getState();
    if (event.code === "Tab" && game.status === "connected" && !game.lobbyOpen && !game.settingsOpen) {
      event.preventDefault();
      if (!this.tabHeld) {
        this.tabHeld = true;
        game.setScoreboardOpen(true);
      }
      return;
    }

    this.keys.add(event.code);
    if (this.isLocked()) {
      this.hadRecentInput = true;
      if (event.code === "Space" || event.code.startsWith("Arrow")) {
        event.preventDefault();
      }
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (event.code === "Tab" && this.tabHeld) {
      this.tabHeld = false;
      useGameStore.getState().setScoreboardOpen(false);
    }
    this.keys.delete(event.code);
  };

  private readonly onMouseDown = (event: MouseEvent) => {
    if (!this.isLocked()) {
      return;
    }
    this.hadRecentInput = true;
    if (event.button === 0) {
      this.mouseLeftDown = true;
    } else if (event.button === 1) {
      event.preventDefault();
      this.mouseMiddleDown = true;
    } else if (event.button === 2) {
      this.mouseRightDown = true;
    }
  };

  private readonly onMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      this.mouseLeftDown = false;
    } else if (event.button === 1) {
      this.mouseMiddleDown = false;
    } else if (event.button === 2) {
      this.mouseRightDown = false;
    }
  };

  private readonly onMouseMove = (event: MouseEvent) => {
    if (!this.isLocked()) {
      return;
    }
    const sens = useSettingsStore.getState().mouseSensitivity * BASE_MOUSE_SENSITIVITY;
    this.deltaYaw -= event.movementX * sens;
    this.deltaPitch -= event.movementY * sens;
    this.hadRecentInput = true;
  };

  private readonly onContextMenu = (event: MouseEvent) => {
    if (this.isLocked()) {
      event.preventDefault();
    }
  };

  private readonly onBlur = () => {
    this.clearCombatInputs();
    if (this.tabHeld) {
      this.tabHeld = false;
      useGameStore.getState().setScoreboardOpen(false);
    }
  };

  private readonly onPointerLockChange = () => {
    const locked = this.isLocked();
    if (!locked) {
      this.clearCombatInputs();
    }
    useGameStore.getState().setPointerLocked(locked);
  };

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
  }
}
