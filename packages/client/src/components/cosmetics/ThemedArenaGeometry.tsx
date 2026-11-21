import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import type {
  ArenaBlock,
  ArenaMapDefinition,
  JumpPadDefinition,
} from "@upgun/shared";

export interface ThemedArenaGeometryProps {
  map: ArenaMapDefinition;
}

function createNeonGridTexture(
  baseColor: string,
  gridColor: string,
  halfSize: number,
): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Subtle dark-tile checkerboard depth
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

    // Fine inner sub-grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Soft neon outer glow pass
    ctx.strokeStyle = gridColor;
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 10;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Crisp neon border line
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Corner accent ticks
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = gridColor;
    ctx.fillRect(0, 0, 12, 12);
    ctx.fillRect(size - 12, 0, 12, 12);
    ctx.fillRect(0, size - 12, 12, 12);
    ctx.fillRect(size - 12, size - 12, 12, 12);
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(halfSize, halfSize);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function ThemedBlockMesh({
  block,
  floorTexture,
  accentColor,
  gridColor,
}: {
  block: ArenaBlock;
  floorTexture: CanvasTexture;
  accentColor: string;
  gridColor: string;
}) {
  const isFloor = block.kind === "floor";
  const isPlatform = block.kind === "platform";
  const isWall = block.kind === "wall";
  const isRamp = block.kind === "ramp";

  const [sx, sy, sz] = block.size;
  const roughness = isPlatform || isRamp ? 0.45 : isFloor ? 0.75 : 0.68;
  const metalness = isPlatform || isRamp ? 0.28 : 0.14;

  return (
    <group position={block.position} rotation={block.rotation ?? [0, 0, 0]}>
      <mesh castShadow={!isFloor} receiveShadow>
        <boxGeometry args={block.size} />
        <meshStandardMaterial
          color={isFloor ? "#ffffff" : block.color}
          map={isFloor ? floorTexture : null}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Emissive neon trim band on elevated platforms */}
      {isPlatform && (
        <mesh position={[0, sy * 0.5 - 0.045, 0]}>
          <boxGeometry args={[sx + 0.04, 0.09, sz + 0.04]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={1.15}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Emissive upper neon ribbon on arena boundary walls */}
      {isWall && (
        <mesh position={[0, sy * 0.24, 0]}>
          <boxGeometry args={[sx + 0.04, 0.14, sz + 0.04]} />
          <meshStandardMaterial
            color={gridColor}
            emissive={gridColor}
            emissiveIntensity={1.05}
            roughness={0.25}
          />
        </mesh>
      )}

      {/* Emissive side rails on ramps */}
      {isRamp && (
        <>
          <mesh position={[-sx * 0.5 - 0.02, sy * 0.32, 0]}>
            <boxGeometry args={[0.06, 0.08, sz]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[sx * 0.5 + 0.02, sy * 0.32, 0]}>
            <boxGeometry args={[0.06, 0.08, sz]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function JumpPadMesh({ pad }: { pad: JumpPadDefinition }) {
  const outerRingRef = useRef<Mesh>(null);
  const pulseRingRef = useRef<Mesh>(null);
  const pulseMatRef = useRef<MeshStandardMaterial>(null);
  const chevron0Ref = useRef<Group>(null);
  const chevron1Ref = useRef<Group>(null);
  const chevron2Ref = useRef<Group>(null);

  const [vx, , vz] = pad.launchVelocity;
  const horizontalSpeed = Math.hypot(vx, vz);
  const launchYaw = horizontalSpeed > 0.1 ? Math.atan2(vx, vz) : 0;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (outerRingRef.current) {
      const s = 1 + Math.sin(t * 3.8) * 0.045;
      outerRingRef.current.scale.set(s, s, 1);
    }

    const ringCycle = (t * 0.9) % 1;
    if (pulseRingRef.current) {
      pulseRingRef.current.position.y = 0.12 + ringCycle * 1.15;
      const scale = 0.88 + ringCycle * 0.25;
      pulseRingRef.current.scale.set(scale, scale, 1);
    }
    if (pulseMatRef.current) {
      pulseMatRef.current.opacity = (1 - ringCycle) * 0.85;
    }

    const chevrons = [chevron0Ref.current, chevron1Ref.current, chevron2Ref.current];
    for (let i = 0; i < chevrons.length; i++) {
      const group = chevrons[i];
      if (!group) continue;
      const phase = (t * 1.35 + i / 3) % 1;
      group.position.y = 0.28 + phase * 1.35;
      const fadeScale = Math.sin(phase * Math.PI) * 0.95 + 0.15;
      group.scale.setScalar(fadeScale);
    }
  });

  const r = pad.radius;

  return (
    <group position={pad.position} name={`jump_pad_${pad.id}`}>
      {/* Metallic Rim Base */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[r, r * 1.08, 0.09, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.65} />
      </mesh>

      {/* Glowing Core Pad Disc */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[r * 0.72, r * 0.72, 0.08, 24]} />
        <meshStandardMaterial
          color={pad.color}
          emissive={pad.color}
          emissiveIntensity={1.35}
          roughness={0.2}
        />
      </mesh>

      {/* Static Base Emissive Ring */}
      <mesh ref={outerRingRef} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.88, 0.055, 8, 28]} />
        <meshStandardMaterial
          color={pad.color}
          emissive={pad.color}
          emissiveIntensity={1.55}
          roughness={0.18}
        />
      </mesh>

      {/* Rising Pulsing Holo-Ring */}
      <mesh ref={pulseRingRef} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.76, 0.04, 8, 24]} />
        <meshStandardMaterial
          ref={pulseMatRef}
          color={pad.color}
          emissive={pad.color}
          emissiveIntensity={1.6}
          transparent
          opacity={0.75}
          roughness={0.15}
        />
      </mesh>

      {/* Floating Animated Upward Chevrons angled toward launch direction */}
      <group rotation={[0, launchYaw, 0]}>
        {[chevron0Ref, chevron1Ref, chevron2Ref].map((ref, idx) => (
          <group key={idx} ref={ref} position={[0, 0.35 + idx * 0.4, 0]}>
            <mesh position={[-0.17, 0, 0]} rotation={[0, 0, 0.62]}>
              <boxGeometry args={[0.42, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={pad.color}
                emissiveIntensity={1.7}
                roughness={0.15}
              />
            </mesh>
            <mesh position={[0.17, 0, 0]} rotation={[0, 0, -0.62]}>
              <boxGeometry args={[0.42, 0.07, 0.07]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={pad.color}
                emissiveIntensity={1.7}
                roughness={0.15}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function ThemedArenaGeometry({ map }: ThemedArenaGeometryProps) {
  const floorBlock = map.blocks.find((block) => block.kind === "floor");
  const floorBaseColor = floorBlock?.color ?? "#1e293b";

  const floorTexture = useMemo(
    () => createNeonGridTexture(floorBaseColor, map.theme.gridColor, map.halfSize),
    [floorBaseColor, map.theme.gridColor, map.halfSize],
  );

  useEffect(() => {
    return () => {
      floorTexture.dispose();
    };
  }, [floorTexture]);

  return (
    <group name={`themed_arena_${map.id}`}>
      {/* Atmospheric Backdrop, Fog & Themed Lighting */}
      <color attach="background" args={[map.theme.skyTop]} />
      <fog
        attach="fog"
        args={[map.theme.fogColor, map.theme.fogNear, map.theme.fogFar]}
      />
      <hemisphereLight
        args={[map.theme.skyTop, map.theme.skyBottom, map.theme.ambientIntensity]}
      />
      <directionalLight
        castShadow
        position={[14, 24, 10]}
        color={map.theme.sunColor}
        intensity={map.theme.sunIntensity}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={75}
      />

      {/* Arena Blocks */}
      {map.blocks.map((block) => (
        <ThemedBlockMesh
          key={block.id}
          block={block}
          floorTexture={floorTexture}
          accentColor={map.theme.accentColor}
          gridColor={map.theme.gridColor}
        />
      ))}

      {/* Animated Glowing Jump Pads */}
      {map.jumpPads.map((pad) => (
        <JumpPadMesh key={pad.id} pad={pad} />
      ))}
    </group>
  );
}
