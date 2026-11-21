import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  PerspectiveCamera,
  Quaternion,
  Vector3,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { worldRuntime } from "../game/worldRuntime";
import { DamageNumbers } from "./DamageNumbers";
import { juiceBus, type NeonTracerEvent, type ShockwaveRingEvent } from "./juiceBus";
import { ViewmodelRifle } from "./ViewmodelRifle";

const MAX_NEON_TRACERS = 28;
const MAX_SHOCKWAVES = 14;
const DEFAULT_BASE_FOV = 75;
const DASH_FOV_BOOST = 12;
const UP_AXIS = new Vector3(0, 1, 0);

export interface JuiceSystemProps {
  baseFov?: number;
  showDamageNumbers?: boolean;
  showViewmodel?: boolean;
}

function JuiceEffectsPass({ baseFov }: { baseFov: number }) {
  const tracerRefs = useRef<(Mesh | null)[]>([]);
  const tracerMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const ringMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const flashRefs = useRef<(Mesh | null)[]>([]);
  const flashMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);

  const activeTracersRef = useRef<NeonTracerEvent[]>([]);
  const activeShockwavesRef = useRef<ShockwaveRingEvent[]>([]);

  const camStateRef = useRef({
    lastDashSeq: juiceBus.getDashPulseSeq(),
    fovBoostTarget: 0,
    fovBoostCurrent: 0,
    trauma: 0,
    shakeTime: 0,
  });

  const scratch = useMemo(
    () => ({
      start: new Vector3(),
      end: new Vector3(),
      dir: new Vector3(),
      mid: new Vector3(),
      quat: new Quaternion(),
    }),
    [],
  );

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = performance.now();
    const camState = camStateRef.current;

    // 1. Dash FOV kick (base 75 -> ~87 -> smooth decay back to base)
    const dashSeq = juiceBus.getDashPulseSeq();
    if (dashSeq !== camState.lastDashSeq) {
      camState.lastDashSeq = dashSeq;
      camState.fovBoostTarget = DASH_FOV_BOOST;
    }

    camState.fovBoostTarget *= Math.exp(-5.8 * dt);
    if (camState.fovBoostTarget < 0.02) {
      camState.fovBoostTarget = 0;
    }
    camState.fovBoostCurrent +=
      (camState.fovBoostTarget - camState.fovBoostCurrent) * Math.min(1, dt * 22);
    if (camState.fovBoostCurrent < 0.01 && camState.fovBoostTarget === 0) {
      camState.fovBoostCurrent = 0;
    }

    if (camera instanceof PerspectiveCamera) {
      const desiredFov = baseFov + camState.fovBoostCurrent;
      if (Math.abs(camera.fov - desiredFov) > 0.01) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }
    }

    // 2. Clamped rotational + positional screen shake
    const shakeImpulse = juiceBus.consumeShakeImpulse();
    if (shakeImpulse > 0) {
      camState.trauma = Math.min(1, camState.trauma + shakeImpulse);
    }
    if (camState.trauma > 0) {
      camState.trauma = Math.max(0, camState.trauma - dt * 2.5);
      camState.shakeTime += dt * 44;

      const localId = worldRuntime.localSessionId;
      const localSnap = localId ? worldRuntime.players.get(localId) : undefined;
      const inFirstPerson =
        worldRuntime.room !== null && (localSnap ? localSnap.isAlive : true);

      if (inFirstPerson && camState.trauma > 0.001) {
        const shake = camState.trauma * camState.trauma;
        const t = camState.shakeTime;
        const nPitch = Math.sin(t * 1.13) * 0.65 + Math.cos(t * 2.31) * 0.35;
        const nYaw = Math.cos(t * 1.37) * 0.65 + Math.sin(t * 2.17) * 0.35;
        const nRoll = Math.sin(t * 1.71 + 1.1);

        camera.rotation.x += nPitch * shake * 0.02;
        camera.rotation.y += nYaw * shake * 0.018;
        camera.rotation.z += nRoll * shake * 0.03;

        camera.position.x += nYaw * shake * 0.055;
        camera.position.y += nPitch * shake * 0.045;
      }
    }

    // 3. Pooled neon additive bullet trails
    const tracers = activeTracersRef.current;
    juiceBus.drainNeonTracers(tracers);
    for (let i = tracers.length - 1; i >= 0; i--) {
      const tr = tracers[i];
      if (!tr || now - tr.createdAt >= tr.durationMs) {
        tracers.splice(i, 1);
      }
    }
    if (tracers.length > MAX_NEON_TRACERS) {
      tracers.splice(0, tracers.length - MAX_NEON_TRACERS);
    }

    for (let i = 0; i < MAX_NEON_TRACERS; i++) {
      const mesh = tracerRefs.current[i];
      const mat = tracerMatRefs.current[i];
      if (!mesh || !mat) {
        continue;
      }
      const tr = tracers[i];
      if (!tr) {
        mesh.visible = false;
        continue;
      }

      scratch.start.set(tr.origin.x, tr.origin.y, tr.origin.z);
      scratch.end.set(tr.end.x, tr.end.y, tr.end.z);
      scratch.dir.subVectors(scratch.end, scratch.start);
      const len = scratch.dir.length();
      if (len < 0.02) {
        mesh.visible = false;
        continue;
      }

      scratch.mid.addVectors(scratch.start, scratch.end).multiplyScalar(0.5);
      scratch.dir.divideScalar(len);
      scratch.quat.setFromUnitVectors(UP_AXIS, scratch.dir);

      const alpha = Math.max(0, 1 - (now - tr.createdAt) / tr.durationMs);
      const thickness = 0.4 + alpha * 1.15;

      mesh.visible = true;
      mesh.position.copy(scratch.mid);
      mesh.quaternion.copy(scratch.quat);
      mesh.scale.set(thickness, len, thickness);

      mat.opacity = alpha * 0.92;
      mat.color.set(tr.hit ? "#fb7185" : "#38bdf8");
    }

    // 4. Pooled explosion shockwave rings & flash spheres
    const shockwaves = activeShockwavesRef.current;
    juiceBus.drainShockwaveRings(shockwaves);
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      if (!sw || now - sw.createdAt >= sw.durationMs) {
        shockwaves.splice(i, 1);
      }
    }
    if (shockwaves.length > MAX_SHOCKWAVES) {
      shockwaves.splice(0, shockwaves.length - MAX_SHOCKWAVES);
    }

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const ring = ringRefs.current[i];
      const ringMat = ringMatRefs.current[i];
      const flash = flashRefs.current[i];
      const flashMat = flashMatRefs.current[i];
      if (!ring || !ringMat || !flash || !flashMat) {
        continue;
      }

      const sw = shockwaves[i];
      if (!sw) {
        ring.visible = false;
        flash.visible = false;
        continue;
      }

      const t = Math.min(1, Math.max(0, (now - sw.createdAt) / sw.durationMs));
      const expand = 0.35 + Math.pow(t, 0.48) * sw.radius * 1.2;

      ring.visible = true;
      ring.position.set(sw.origin.x, sw.origin.y + 0.08, sw.origin.z);
      ring.scale.set(expand, expand, Math.max(0.3, 1.2 - t * 0.8));
      ringMat.opacity = Math.max(0, (1 - t) * 0.85);
      ringMat.color.set(t < 0.25 ? "#fef08a" : t < 0.6 ? "#fb923c" : "#f43f5e");

      const flashT = Math.min(1, t / 0.62);
      if (flashT < 1) {
        const flashScale = 0.3 + Math.pow(flashT, 0.42) * sw.radius * 0.72;
        flash.visible = true;
        flash.position.set(sw.origin.x, sw.origin.y, sw.origin.z);
        flash.scale.setScalar(flashScale);
        flashMat.opacity = Math.max(0, (1 - flashT) * 0.55);
        flashMat.color.set(flashT < 0.35 ? "#fef9c3" : "#f97316");
      } else {
        flash.visible = false;
      }
    }
  });

  return (
    <group name="juice_effects_pass">
      {Array.from({ length: MAX_NEON_TRACERS }, (_, idx) => (
        <mesh
          key={`neon_tracer_${idx}`}
          ref={(el) => {
            tracerRefs.current[idx] = el;
          }}
          visible={false}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.022, 0.022, 1, 6]} />
          <meshBasicMaterial
            ref={(el) => {
              tracerMatRefs.current[idx] = el;
            }}
            color="#38bdf8"
            transparent
            opacity={0.9}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {Array.from({ length: MAX_SHOCKWAVES }, (_, idx) => (
        <group key={`shockwave_${idx}`}>
          <mesh
            ref={(el) => {
              ringRefs.current[idx] = el;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            frustumCulled={false}
          >
            <torusGeometry args={[1, 0.05, 8, 32]} />
            <meshBasicMaterial
              ref={(el) => {
                ringMatRefs.current[idx] = el;
              }}
              color="#fb923c"
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(el) => {
              flashRefs.current[idx] = el;
            }}
            visible={false}
            frustumCulled={false}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              ref={(el) => {
                flashMatRefs.current[idx] = el;
              }}
              color="#fef9c3"
              transparent
              opacity={0.55}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function JuiceSystem({
  baseFov = DEFAULT_BASE_FOV,
  showDamageNumbers = true,
  showViewmodel = true,
}: JuiceSystemProps) {
  return (
    <group name="juice_system">
      <JuiceEffectsPass baseFov={baseFov} />
      {showDamageNumbers ? <DamageNumbers /> : null}
      {showViewmodel ? <ViewmodelRifle /> : null}
    </group>
  );
}
