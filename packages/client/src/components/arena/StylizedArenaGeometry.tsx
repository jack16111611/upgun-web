import { useMemo, useRef } from "react";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import type {
  ArenaBlock,
  ArenaDecorPreset,
  ArenaMapDefinition,
  BlockMaterialKind,
  JumpPadDefinition,
} from "@upgun/shared";
import { ArchitecturalBlockDetail } from "./ArchitecturalPieces";
import { ArenaDecorations } from "./ArenaDecorations";
import { getMaterialTextures } from "./proceduralTextures";

export interface StylizedArenaGeometryProps {
  map: ArenaMapDefinition;
}

const WHITE = new Color("#ffffff");

function computeBlockRepeat(block: ArenaBlock): [number, number] {
  const [sx, sy, sz] = block.size;
  switch (block.kind) {
    case "floor":
      return [sx / 3.0, sz / 3.0];
    case "platform":
    case "ramp":
      return [Math.max(1, sx / 2.5), Math.max(1, sz / 2.5)];
    case "wall":
      return [Math.max(1, Math.max(sx, sz) / 3.0), Math.max(1, sy / 3.0)];
    case "cover":
      return [Math.max(1, Math.max(sx, sz) / 2.0), Math.max(1, sy / 2.0)];
  }
}

function computeTintColor(
  materialKind: BlockMaterialKind,
  blockColor: string,
): string {
  // Neutral silver steel texture accepts full paint tint (e.g. yellow girders)
  if (materialKind === "steel") {
    return blockColor;
  }
  // Gently blend natural procedural textures toward white so they stay bright & crisp
  const tinted = new Color(blockColor).lerp(WHITE, 0.72);
  return `#${tinted.getHexString()}`;
}

function computeSunLightPosition(
  sunPosition: [number, number, number],
): [number, number, number] {
  const [x, y, z] = sunPosition;
  const len = Math.hypot(x, y, z) || 1;
  const dist = 38;
  return [
    (x / len) * dist,
    Math.max(20, (y / len) * dist),
    (z / len) * dist,
  ];
}

function StylizedBlockMesh({
  block,
  floorMaterial,
  accentColor,
  preset,
}: {
  block: ArenaBlock;
  floorMaterial: BlockMaterialKind;
  accentColor: string;
  preset: ArenaDecorPreset;
}) {
  const materialKind: BlockMaterialKind =
    block.material ?? (block.kind === "floor" ? floorMaterial : "concrete");

  const [repeatX, repeatY] = computeBlockRepeat(block);
  const textureSet = useMemo(
    () => getMaterialTextures(materialKind, repeatX, repeatY),
    [materialKind, repeatX, repeatY],
  );
  const tintColor = useMemo(
    () => computeTintColor(materialKind, block.color),
    [materialKind, block.color],
  );

  const isFloor = block.kind === "floor";

  return (
    <group position={block.position} rotation={block.rotation ?? [0, 0, 0]}>
      <mesh castShadow={!isFloor} receiveShadow>
        <boxGeometry args={block.size} />
        <meshStandardMaterial
          color={tintColor}
          map={textureSet.map}
          bumpMap={textureSet.bumpMap}
          bumpScale={isFloor ? 0.045 : 0.06}
          roughnessMap={textureSet.roughnessMap}
          roughness={textureSet.roughness}
          metalness={textureSet.metalness}
        />
      </mesh>

      {!isFloor && (
        <ArchitecturalBlockDetail
          block={block}
          materialKind={materialKind}
          accentColor={accentColor}
          preset={preset}
        />
      )}
    </group>
  );
}

function StylizedJumpPadMesh({ pad }: { pad: JumpPadDefinition }) {
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
      const s = 1 + Math.sin(t * 3.8) * 0.05;
      outerRingRef.current.scale.set(s, s, 1);
    }

    const ringCycle = (t * 0.95) % 1;
    if (pulseRingRef.current) {
      pulseRingRef.current.position.y = 0.12 + ringCycle * 1.25;
      const scale = 0.86 + ringCycle * 0.28;
      pulseRingRef.current.scale.set(scale, scale, 1);
    }
    if (pulseMatRef.current) {
      pulseMatRef.current.opacity = (1 - ringCycle) * 0.82;
    }

    const chevrons = [chevron0Ref.current, chevron1Ref.current, chevron2Ref.current];
    for (let i = 0; i < chevrons.length; i++) {
      const group = chevrons[i];
      if (!group) continue;
      const phase = (t * 1.4 + i / 3) % 1;
      group.position.y = 0.26 + phase * 1.45;
      const fadeScale = Math.sin(phase * Math.PI) * 0.95 + 0.18;
      group.scale.setScalar(fadeScale);
    }
  });

  const r = pad.radius;

  return (
    <group position={pad.position} name={`jump_pad_${pad.id}`}>
      {/* Brushed stone/steel rim housing */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[r, r * 1.08, 0.09, 20]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.42} metalness={0.35} />
      </mesh>

      {/* Luminous wind-stream core disc */}
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[r * 0.74, r * 0.74, 0.08, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={pad.color}
          emissiveIntensity={1.25}
          roughness={0.2}
        />
      </mesh>

      {/* Pulsing luminous outer ring */}
      <mesh ref={outerRingRef} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.88, 0.055, 8, 24]} />
        <meshStandardMaterial
          color={pad.color}
          emissive={pad.color}
          emissiveIntensity={1.35}
          roughness={0.18}
        />
      </mesh>

      {/* Rising animated wind-stream ring */}
      <mesh ref={pulseRingRef} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.78, 0.045, 8, 20]} />
        <meshStandardMaterial
          ref={pulseMatRef}
          color="#ffffff"
          emissive={pad.color}
          emissiveIntensity={1.45}
          transparent
          opacity={0.75}
          roughness={0.15}
        />
      </mesh>

      {/* Rising glowing chevrons angled along launch trajectory */}
      <group rotation={[0, launchYaw, 0]}>
        {[chevron0Ref, chevron1Ref, chevron2Ref].map((ref, idx) => (
          <group key={idx} ref={ref} position={[0, 0.35 + idx * 0.4, 0]}>
            <mesh position={[-0.17, 0, 0]} rotation={[0, 0, 0.62]}>
              <boxGeometry args={[0.42, 0.075, 0.075]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={pad.color}
                emissiveIntensity={1.55}
                roughness={0.15}
              />
            </mesh>
            <mesh position={[0.17, 0, 0]} rotation={[0, 0, -0.62]}>
              <boxGeometry args={[0.42, 0.075, 0.075]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive={pad.color}
                emissiveIntensity={1.55}
                roughness={0.15}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function StylizedArenaGeometry({ map }: StylizedArenaGeometryProps) {
  const sunLightPos = useMemo(
    () => computeSunLightPosition(map.theme.sunPosition),
    [map.theme.sunPosition],
  );
  const fillLightPos: [number, number, number] = [
    -sunLightPos[0] * 0.55,
    16,
    -sunLightPos[2] * 0.55,
  ];

  return (
    <group name={`stylized_arena_${map.id}`}>
      {/* Procedural Daylight / Golden-Hour Sky Dome & Exponential Atmospheric Fog */}
      <color attach="background" args={[map.theme.skyBottom]} />
      <Sky
        distance={450000}
        sunPosition={map.theme.sunPosition}
        turbidity={map.theme.turbidity}
        rayleigh={map.theme.rayleigh}
        mieCoefficient={map.theme.mieCoefficient}
        mieDirectionalG={0.82}
      />
      <fogExp2
        attach="fog"
        args={[map.theme.fogColor, map.theme.fogDensity ?? 0.0085]}
      />

      {/* Cool Sky / Warm Ground Hemisphere Bounce & Warm Shadow-Casting Sunlight */}
      <hemisphereLight
        args={[
          map.theme.hemisphereSky,
          map.theme.hemisphereGround,
          map.theme.ambientIntensity,
        ]}
      />
      <directionalLight
        castShadow
        position={sunLightPos}
        color={map.theme.sunColor}
        intensity={map.theme.sunIntensity}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={2}
        shadow-camera-far={95}
      />
      <directionalLight
        position={fillLightPos}
        color={map.theme.hemisphereSky}
        intensity={0.34}
      />

      {/* Procedural PBR-Textured Multi-Part Architectural Blocks */}
      {map.blocks.map((block) => (
        <StylizedBlockMesh
          key={block.id}
          block={block}
          floorMaterial={map.theme.floorMaterial}
          accentColor={map.theme.accentColor}
          preset={map.theme.decorPreset}
        />
      ))}

      {/* Non-Colliding Architectural Alcoves, Roofs, Pergolas, Banners & Foliage */}
      <ArenaDecorations
        preset={map.theme.decorPreset}
        halfSize={map.halfSize}
      />

      {/* Animated Jump Pads */}
      {map.jumpPads.map((pad) => (
        <StylizedJumpPadMesh key={pad.id} pad={pad} />
      ))}
    </group>
  );
}
