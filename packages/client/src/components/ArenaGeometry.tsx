import { useEffect, useMemo } from "react";
import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from "three";
import { ARENA_BLOCKS, type ArenaBlock } from "@upgun/shared";

function createGridTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#3b4a62";
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

function ArenaBlockMesh({
  block,
  floorTexture,
}: {
  block: ArenaBlock;
  floorTexture: CanvasTexture;
}) {
  const isFloor = block.kind === "floor";
  const roughness = block.kind === "platform" || block.kind === "ramp" ? 0.55 : 0.8;
  const metalness = block.kind === "platform" ? 0.15 : 0.05;

  return (
    <mesh
      position={block.position}
      rotation={block.rotation ?? [0, 0, 0]}
      castShadow={!isFloor}
      receiveShadow
    >
      <boxGeometry args={block.size} />
      <meshStandardMaterial
        color={isFloor ? "#ffffff" : block.color}
        map={isFloor ? floorTexture : null}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

export function ArenaGeometry() {
  const floorTexture = useMemo(() => createGridTexture(), []);

  useEffect(() => {
    return () => {
      floorTexture.dispose();
    };
  }, [floorTexture]);

  return (
    <group name="graybox_arena">
      {ARENA_BLOCKS.map((block) => (
        <ArenaBlockMesh key={block.id} block={block} floorTexture={floorTexture} />
      ))}
    </group>
  );
}
