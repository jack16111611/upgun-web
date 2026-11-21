import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MAX_PITCH_RAD } from "@upgun/shared";
import { Euler, Vector3 } from "three";
import { worldRuntime } from "../../game/worldRuntime";
import {
  clampValue,
  getAliveSpectateIds,
  getLocalRuntimeSnapshot,
  isRuntimeSpectating,
  isSpectatorInputBlocked,
  SPECTATOR_BOUNDS,
} from "./spectatorHelpers";
import {
  attachSpectatorInputListeners,
  createSpectatorInputState,
  type SpectatorInputState,
} from "./spectatorInput";
import {
  KILLER_FOCUS_DURATION_MS,
  useSpectatorStore,
  type SpectatorMode,
} from "./spectatorStore";

const FOLLOW_DISTANCE = 5.4;
const FOLLOW_PIVOT_Y = 0.85;
const DRONE_BASE_SPEED = 13.0;
const DRONE_BOOST_SPEED = 21.0;

function clampArenaPos(vec: Vector3): void {
  vec.x = clampValue(vec.x, SPECTATOR_BOUNDS.minX, SPECTATOR_BOUNDS.maxX);
  vec.y = clampValue(vec.y, SPECTATOR_BOUNDS.minY, SPECTATOR_BOUNDS.maxY);
  vec.z = clampValue(vec.z, SPECTATOR_BOUNDS.minZ, SPECTATOR_BOUNDS.maxZ);
}

export function SpectatorCamera() {
  const { gl, camera } = useThree();

  const wasSpectatingRef = useRef(false);
  const prevModeRef = useRef<SpectatorMode>("follow");
  const prevTargetIdRef = useRef<string | null>(null);
  const inputStateRef = useRef<SpectatorInputState>(createSpectatorInputState());

  const smoothPosRef = useRef(new Vector3(0, 8, 12));
  const smoothLookRef = useRef(new Vector3(0, 1.2, 0));
  const desiredPosRef = useRef(new Vector3());
  const desiredLookRef = useRef(new Vector3());

  const dronePosRef = useRef(new Vector3(0, 8, 12));
  const droneVelRef = useRef(new Vector3());
  const moveDirRef = useRef(new Vector3());
  const forwardRef = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const eulerScratchRef = useRef(new Euler(0, 0, 0, "YXZ"));

  useEffect(() => {
    return attachSpectatorInputListeners(gl.domElement, inputStateRef.current);
  }, [gl]);

  useFrame((_, delta) => {
    const spectating = isRuntimeSpectating();
    const localSnap = getLocalRuntimeSnapshot();
    const input = inputStateRef.current;

    if (!spectating || !localSnap) {
      if (wasSpectatingRef.current) {
        wasSpectatingRef.current = false;
        input.keys.clear();
        if (
          worldRuntime.room === null ||
          localSnap?.isAlive ||
          worldRuntime.phase === "lobby" ||
          worldRuntime.phase === "match_over"
        ) {
          useSpectatorStore.getState().resetSpectator();
        }
      }
      return;
    }

    const dt = Math.min(delta, 0.1);
    const now = performance.now();
    const store = useSpectatorStore.getState();

    if (!wasSpectatingRef.current) {
      wasSpectatingRef.current = true;
      smoothPosRef.current.copy(camera.position);
      clampArenaPos(smoothPosRef.current);
      smoothLookRef.current.set(localSnap.x, localSnap.y + 0.6, localSnap.z);
      dronePosRef.current.copy(smoothPosRef.current);
      droneVelRef.current.set(0, 0, 0);
      eulerScratchRef.current.setFromQuaternion(camera.quaternion, "YXZ");
      input.droneYaw = eulerScratchRef.current.y;
      input.dronePitch = clampValue(eulerScratchRef.current.x, -MAX_PITCH_RAD, MAX_PITCH_RAD);
      input.orbitYaw = localSnap.yaw;
      input.orbitPitch = 0.32;
      prevModeRef.current = store.mode;
      prevTargetIdRef.current = store.targetSessionId;
    }

    // 1. 1.5s Killer Focus Camera
    const highlight = store.killerHighlight;
    if (highlight) {
      if (now < highlight.untilMs) {
        const progress = clampValue(
          1 - (highlight.untilMs - now) / KILLER_FOCUS_DURATION_MS,
          0,
          1,
        );
        const killerSnap = highlight.killerId
          ? worldRuntime.players.get(highlight.killerId)
          : undefined;

        const desiredPos = desiredPosRef.current;
        const desiredLook = desiredLookRef.current;

        if (killerSnap && killerSnap.sessionId !== localSnap.sessionId) {
          desiredLook.set(killerSnap.x, killerSnap.y + 0.65, killerSnap.z);
          let awayX = localSnap.x - killerSnap.x;
          let awayZ = localSnap.z - killerSnap.z;
          const dist = Math.hypot(awayX, awayZ);
          if (dist > 0.05) {
            awayX /= dist;
            awayZ /= dist;
          } else {
            awayX = Math.sin(localSnap.yaw);
            awayZ = Math.cos(localSnap.yaw);
          }
          const pullDist = 2.8 + progress * 3.0;
          desiredPos.set(
            localSnap.x + awayX * pullDist,
            localSnap.y + 2.0 + progress * 1.5,
            localSnap.z + awayZ * pullDist,
          );
        } else {
          desiredLook.set(localSnap.x, localSnap.y + 0.5, localSnap.z);
          desiredPos.set(
            localSnap.x + Math.sin(localSnap.yaw) * (3.6 + progress * 2.2),
            localSnap.y + 2.6 + progress * 1.8,
            localSnap.z + Math.cos(localSnap.yaw) * (3.6 + progress * 2.2),
          );
        }

        clampArenaPos(desiredPos);
        smoothPosRef.current.lerp(desiredPos, 1 - Math.exp(-6.5 * dt));
        smoothLookRef.current.lerp(desiredLook, 1 - Math.exp(-11 * dt));
        camera.position.copy(smoothPosRef.current);
        camera.lookAt(smoothLookRef.current);
        return;
      }

      store.clearExpiredKillerHighlight(now);
    }

    // Seamless mode switch handoff
    if (store.mode !== prevModeRef.current) {
      if (store.mode === "freefly") {
        dronePosRef.current.copy(camera.position);
        clampArenaPos(dronePosRef.current);
        droneVelRef.current.set(0, 0, 0);
        eulerScratchRef.current.setFromQuaternion(camera.quaternion, "YXZ");
        input.droneYaw = eulerScratchRef.current.y;
        input.dronePitch = clampValue(
          eulerScratchRef.current.x,
          -MAX_PITCH_RAD,
          MAX_PITCH_RAD,
        );
      } else {
        smoothPosRef.current.copy(camera.position);
        clampArenaPos(smoothPosRef.current);
      }
      prevModeRef.current = store.mode;
    }

    // 2. Free-Fly Drone Cam
    if (store.mode === "freefly") {
      const keys = input.keys;
      const blocked = isSpectatorInputBlocked();
      const moveDir = moveDirRef.current.set(0, 0, 0);

      if (!blocked) {
        const yaw = input.droneYaw;
        const pitch = input.dronePitch;
        const cosP = Math.cos(pitch);
        forwardRef.current.set(-Math.sin(yaw) * cosP, Math.sin(pitch), -Math.cos(yaw) * cosP);
        rightRef.current.set(Math.cos(yaw), 0, -Math.sin(yaw));

        if (keys.has("KeyW") || keys.has("ArrowUp")) moveDir.add(forwardRef.current);
        if (keys.has("KeyS") || keys.has("ArrowDown")) moveDir.sub(forwardRef.current);
        if (keys.has("KeyD") || keys.has("ArrowRight")) moveDir.add(rightRef.current);
        if (keys.has("KeyA") || keys.has("ArrowLeft")) moveDir.sub(rightRef.current);
        if (keys.has("Space")) moveDir.y += 1;
        if (keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("KeyC")) {
          moveDir.y -= 1;
        }
      }

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
      }

      const speed =
        keys.has("ShiftLeft") || keys.has("ShiftRight")
          ? DRONE_BOOST_SPEED
          : DRONE_BASE_SPEED;
      const targetVel = desiredPosRef.current.copy(moveDir).multiplyScalar(speed);
      droneVelRef.current.lerp(targetVel, 1 - Math.exp(-10 * dt));
      dronePosRef.current.addScaledVector(droneVelRef.current, dt);
      clampArenaPos(dronePosRef.current);

      camera.position.copy(dronePosRef.current);
      camera.rotation.order = "YXZ";
      camera.rotation.set(input.dronePitch, input.droneYaw, 0);
      return;
    }

    // 3. Follow Player Cam
    const aliveIds = getAliveSpectateIds();
    let targetId = store.targetSessionId;
    if (!targetId || !aliveIds.includes(targetId)) {
      targetId = aliveIds[0] ?? null;
      if (targetId !== store.targetSessionId) {
        store.setTargetSessionId(targetId);
      }
    }

    const targetSnap = targetId ? worldRuntime.players.get(targetId) : undefined;
    const desiredPos = desiredPosRef.current;
    const desiredLook = desiredLookRef.current;

    if (targetSnap && targetSnap.isAlive) {
      if (prevTargetIdRef.current !== targetId) {
        input.orbitYaw = targetSnap.yaw;
        prevTargetIdRef.current = targetId;
      }

      const horiz = Math.cos(input.orbitPitch) * FOLLOW_DISTANCE;
      desiredPos.set(
        targetSnap.x + Math.sin(input.orbitYaw) * horiz,
        targetSnap.y + FOLLOW_PIVOT_Y + Math.sin(input.orbitPitch) * FOLLOW_DISTANCE,
        targetSnap.z + Math.cos(input.orbitYaw) * horiz,
      );
      clampArenaPos(desiredPos);
      desiredLook.set(targetSnap.x, targetSnap.y + 0.75, targetSnap.z);
    } else {
      const t = now * 0.00025;
      desiredPos.set(Math.sin(t) * 16, 10.5, Math.cos(t) * 16);
      clampArenaPos(desiredPos);
      desiredLook.set(0, 1.4, 0);
    }

    smoothPosRef.current.lerp(desiredPos, 1 - Math.exp(-9 * dt));
    smoothLookRef.current.lerp(desiredLook, 1 - Math.exp(-12 * dt));
    camera.position.copy(smoothPosRef.current);
    camera.lookAt(smoothLookRef.current);
  });

  return null;
}
