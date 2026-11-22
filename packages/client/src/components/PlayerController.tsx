import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FIXED_DT_SEC, getGameModeConfig, PLAYER_EYE_OFFSET_Y } from "@upgun/shared";
import { soundEngine } from "../audio/soundEngine";
import { juiceBus } from "../effects";
import { LocalPlayerPhysics } from "../game/localPhysics";
import { worldRuntime } from "../game/worldRuntime";
import type { AimAssistCandidate } from "../input/aimAssist";
import { InputManager } from "../input/inputManager";
import { sendInputFrame } from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { useCommsStore } from "./comms";
import { useHudLayoutStore } from "./mobile";

const MAX_SUBSTEPS_PER_FRAME = 5;

export function PlayerController() {
  const { gl, camera } = useThree();
  const inputRef = useRef<InputManager | null>(null);
  const physicsRef = useRef<LocalPlayerPhysics | null>(null);
  const accumulatorRef = useRef(0);

  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const sandboxOpen = useGameStore((s) => s.sandboxOpen);
  const phase = useGameStore((s) => s.phase);
  const chatInputOpen = useCommsStore((s) => s.chatInputOpen);
  const quickChatOpen = useCommsStore((s) => s.quickChatOpen);
  const editorOpen = useHudLayoutStore((s) => s.editorOpen);

  useEffect(() => {
    const input = new InputManager();
    const physics = new LocalPlayerPhysics();
    input.attachCanvas(gl.domElement);
    void physics.init().catch((err: unknown) => {
      console.error("[upgun-client] Failed to init local Rapier world:", err);
    });

    inputRef.current = input;
    physicsRef.current = physics;

    const handleCanvasClick = () => {
      input.requestPointerLock();
    };
    gl.domElement.addEventListener("click", handleCanvasClick);

    return () => {
      gl.domElement.removeEventListener("click", handleCanvasClick);
      input.dispose();
      physics.dispose();
      inputRef.current = null;
      physicsRef.current = null;
    };
  }, [gl]);

  useEffect(() => {
    if (
      lobbyOpen ||
      settingsOpen ||
      sandboxOpen ||
      editorOpen ||
      chatInputOpen ||
      quickChatOpen ||
      phase === "drafting" ||
      phase === "match_over"
    ) {
      inputRef.current?.exitPointerLock();
      inputRef.current?.resetTransientTouch();
    }
  }, [lobbyOpen, settingsOpen, sandboxOpen, editorOpen, chatInputOpen, quickChatOpen, phase]);

  useFrame((_, delta) => {
    const input = inputRef.current;
    const physics = physicsRef.current;
    if (!input || !physics) {
      return;
    }

    const localId = worldRuntime.localSessionId;
    const localSnap = localId ? worldRuntime.players.get(localId) : undefined;

    if (physics.isReady) {
      physics.syncMap(worldRuntime.mapId);
    }

    if (worldRuntime.needsSpawnSnap && localSnap) {
      physics.snapTo(
        localSnap.x,
        localSnap.y,
        localSnap.z,
        localSnap.vx,
        localSnap.vy,
        localSnap.vz,
      );
      input.setLookAngles(worldRuntime.pendingSpawnYaw, 0);
      worldRuntime.needsSpawnSnap = false;
    }

    const enemyTargets: AimAssistCandidate[] = [];
    for (const [id, player] of worldRuntime.players) {
      if (id !== localId && player.isAlive) {
        enemyTargets.push({ id, x: player.x, y: player.y, z: player.z });
      }
    }

    const clampedDelta = Math.min(delta, 0.1);
    accumulatorRef.current += clampedDelta;

    const isAlive = localSnap ? localSnap.isAlive : true;
    const gameStoreState = useGameStore.getState();
    const allowMovement =
      worldRuntime.room !== null &&
      !gameStoreState.lobbyOpen &&
      worldRuntime.phase !== "countdown" &&
      worldRuntime.phase !== "drafting" &&
      worldRuntime.phase !== "match_over" &&
      isAlive;
    const modeCfg = getGameModeConfig(gameStoreState.gameMode);
    const gravityMultiplier =
      (gameStoreState.moonGravity ? 0.35 : 1) * modeCfg.gravityMultiplier;
    const infiniteCooldowns = gameStoreState.infiniteMode;
    const hasLineOfSight = physics.isReady
      ? (from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) =>
          physics.hasLineOfSight(from, to)
      : undefined;

    let steps = 0;
    while (accumulatorRef.current >= FIXED_DT_SEC && steps < MAX_SUBSTEPS_PER_FRAME) {
      accumulatorRef.current -= FIXED_DT_SEC;
      const eyePos = {
        x: physics.state.x,
        y: physics.state.y + PLAYER_EYE_OFFSET_Y,
        z: physics.state.z,
      };
      const frame = input.sampleInputFrame(eyePos, FIXED_DT_SEC, enemyTargets, hasLineOfSight);

      if (worldRuntime.room) {
        sendInputFrame(frame);
      }

      if (physics.isReady && worldRuntime.room) {
        physics.step(frame, FIXED_DT_SEC, allowMovement, worldRuntime.localStats, {
          gravityMultiplier,
          dashCooldownMultiplier: modeCfg.dashCooldownMultiplier,
          extraJumpsBonus: modeCfg.extraJumpsBonus,
          airControlMultiplier: modeCfg.airControlMultiplier,
          infiniteCooldowns,
          onDash: () => {
            soundEngine.playDash();
            juiceBus.triggerDashFovKick(frame.moveX);
          },
          onJumpPad: () => {
            soundEngine.playJumpPad();
            juiceBus.triggerDashFovKick(0);
          },
        });
      } else if (localSnap) {
        physics.snapTo(localSnap.x, localSnap.y, localSnap.z);
      }
      steps += 1;
    }

    if (physics.isReady && localSnap && isAlive) {
      physics.reconcile(localSnap);
    }

    const pos = physics.state;
    const { yaw, pitch } = input.getLookAngles();
    const isLobbyShowcase = !worldRuntime.room || gameStoreState.lobbyOpen;
    const isSpectating =
      worldRuntime.room !== null &&
      !gameStoreState.lobbyOpen &&
      !isAlive &&
      worldRuntime.phase !== "lobby" &&
      worldRuntime.phase !== "match_over";

    if (isLobbyShowcase) {
      // Heroic sunlit camera framing the central LobbyHeroPedestal to the right of the glass sidebar
      const t = performance.now() * 0.00025;
      camera.position.set(0.35 + Math.sin(t) * 0.55, 2.38 + Math.cos(t * 0.7) * 0.12, 5.55);
      camera.lookAt(-1.15, 1.65, 0);
    } else if (isAlive) {
      camera.position.set(pos.x, pos.y + PLAYER_EYE_OFFSET_Y, pos.z);
      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch, yaw, 0);
    } else if (!isSpectating) {
      camera.position.set(pos.x, pos.y + 4.5, pos.z + 5.5);
      camera.lookAt(pos.x, pos.y + 0.5, pos.z);
    }
  });

  return null;
}
