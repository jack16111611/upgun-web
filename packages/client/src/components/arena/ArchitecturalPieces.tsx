import type { ArenaBlock, ArenaDecorPreset, BlockMaterialKind } from "@upgun/shared";
import { FoliageCluster } from "./ArchitecturalProps";

function trimToneFor(material: BlockMaterialKind, fallback: string): string {
  switch (material) {
    case "sandstone": return "#d8b482";
    case "marble": return "#e2ded2";
    case "concrete": return "#9aa7b5";
    case "timber": return "#8d5932";
    case "terracotta": return "#b84e2c";
    case "steel": return "#475569";
    case "cobblestone": return "#b8ad9a";
    case "grass": return "#8c6b46";
    case "foliage": return "#62a84b";
    default: return fallback;
  }
}

export function ArchitecturalBlockDetail({
  block,
  materialKind,
  accentColor,
}: {
  block: ArenaBlock;
  materialKind: BlockMaterialKind;
  accentColor: string;
  preset: ArenaDecorPreset;
}) {
  const [sx, sy, sz] = block.size;
  const trim = trimToneFor(materialKind, accentColor);
  const isSteel = materialKind === "steel";
  const metal = isSteel ? 0.45 : 0.08;
  const rough = isSteel ? 0.42 : 0.72;

  if (block.kind === "wall") {
    const alongX = sx >= sz;
    const span = alongX ? sx : sz;
    const thick = alongX ? sz : sx;
    const pilasterCount = Math.max(2, Math.floor(span / 6.5));
    const offsets: number[] = [];
    for (let i = 0; i < pilasterCount; i++) {
      offsets.push(((i + 0.5) / pilasterCount - 0.5) * (span - 3.0));
    }
    return (
      <group>
        {/* Stepped stone/concrete plinth base */}
        <mesh position={[0, -sy * 0.5 + 0.28, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.16, 0.56, sz + 0.16]} />
          <meshStandardMaterial color={trim} roughness={0.86} />
        </mesh>
        {/* Mid-wall architectural dado belt */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[sx + 0.1, 0.22, sz + 0.1]} />
          <meshStandardMaterial color={trim} roughness={0.78} />
        </mesh>
        {/* Overhanging cornice coping cap */}
        <mesh position={[0, sy * 0.5 + 0.12, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.28, 0.26, sz + 0.28]} />
          <meshStandardMaterial color={trim} roughness={0.74} />
        </mesh>
        {/* Rhythm of beveled architectural pilasters */}
        {offsets.map((off, idx) => (
          <group key={idx} position={alongX ? [off, 0, 0] : [0, 0, off]}>
            <mesh receiveShadow>
              <boxGeometry args={alongX ? [0.68, sy - 0.2, thick + 0.28] : [thick + 0.28, sy - 0.2, 0.68]} />
              <meshStandardMaterial color={trim} roughness={0.82} />
            </mesh>
            <mesh position={[0, sy * 0.5 - 0.16, 0]}>
              <boxGeometry args={alongX ? [0.92, 0.3, thick + 0.42] : [thick + 0.42, 0.3, 0.92]} />
              <meshStandardMaterial color={accentColor} roughness={0.62} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (block.kind === "cover" && sy >= 1.8 && Math.max(sx, sz) <= 2.8) {
    // Beveled structural pillar / column with stone plinth base & capital crown
    return (
      <group>
        <mesh position={[0, -sy * 0.5 + 0.16, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.22, 0.32, sz + 0.22]} />
          <meshStandardMaterial color={trim} roughness={rough} metalness={metal} />
        </mesh>
        <mesh position={[0, -sy * 0.5 + 0.38, 0]}>
          <boxGeometry args={[sx + 0.1, 0.14, sz + 0.1]} />
          <meshStandardMaterial color={trim} roughness={rough} metalness={metal} />
        </mesh>
        <mesh position={[0, sy * 0.5 - 0.14, 0]}>
          <boxGeometry args={[sx + 0.26, 0.28, sz + 0.26]} />
          <meshStandardMaterial color={trim} roughness={rough} metalness={metal} />
        </mesh>
        <mesh position={[0, sy * 0.5 - 0.34, 0]}>
          <boxGeometry args={[sx + 0.12, 0.12, sz + 0.12]} />
          <meshStandardMaterial color={accentColor} roughness={0.55} metalness={metal} />
        </mesh>
      </group>
    );
  }

  if (block.kind === "cover") {
    if (materialKind === "foliage") {
      return (
        <group>
          <mesh position={[0, -sy * 0.5 + 0.16, 0]} receiveShadow>
            <boxGeometry args={[sx + 0.16, 0.32, sz + 0.16]} />
            <meshStandardMaterial color="#d8bc93" roughness={0.85} />
          </mesh>
          <FoliageCluster position={[0, sy * 0.38, 0]} radius={Math.min(sx, sz) * 0.44} />
        </group>
      );
    }
    return (
      <group>
        <mesh position={[0, -sy * 0.5 + 0.08, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.14, 0.16, sz + 0.14]} />
          <meshStandardMaterial color={trim} roughness={0.84} />
        </mesh>
        <mesh position={[0, sy * 0.5 + 0.045, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.12, 0.1, sz + 0.12]} />
          <meshStandardMaterial color={trim} roughness={0.68} />
        </mesh>
        <mesh position={[0, sy * 0.5 - 0.06, 0]}>
          <boxGeometry args={[sx + 0.05, 0.05, sz + 0.05]} />
          <meshStandardMaterial color={accentColor} roughness={0.55} />
        </mesh>
      </group>
    );
  }

  if (block.kind === "platform") {
    if (sy > 0.65) {
      return (
        <group>
          <mesh position={[0, -sy * 0.5 + 0.22, 0]} receiveShadow>
            <boxGeometry args={[sx + 0.24, 0.44, sz + 0.24]} />
            <meshStandardMaterial color={trim} roughness={0.86} />
          </mesh>
          <mesh position={[0, sy * 0.5 - 0.08, 0]} receiveShadow>
            <boxGeometry args={[sx + 0.14, 0.16, sz + 0.14]} />
            <meshStandardMaterial color={trim} roughness={0.76} />
          </mesh>
        </group>
      );
    }
    const alongX = sx >= sz;
    const beamCount = Math.min(5, Math.max(2, Math.floor((alongX ? sx : sz) / 2.6)));
    const beams: number[] = [];
    for (let i = 0; i < beamCount; i++) {
      beams.push(((i + 0.5) / beamCount - 0.5) * ((alongX ? sx : sz) - 0.8));
    }
    return (
      <group>
        <mesh position={[0, sy * 0.5 - 0.04, 0]} receiveShadow>
          <boxGeometry args={[sx + 0.08, 0.09, sz + 0.08]} />
          <meshStandardMaterial color={accentColor} roughness={0.52} metalness={metal} />
        </mesh>
        {beams.map((off, idx) => (
          <mesh key={idx} position={alongX ? [off, -sy * 0.5 - 0.07, 0] : [0, -sy * 0.5 - 0.07, off]}>
            <boxGeometry args={alongX ? [0.18, 0.16, sz + 0.2] : [sx + 0.2, 0.16, 0.18]} />
            <meshStandardMaterial color={trim} roughness={rough} metalness={metal} />
          </mesh>
        ))}
        {materialKind === "terracotta" && (
          <mesh position={[0, -sy * 0.5 + 0.04, 0]}>
            <boxGeometry args={[sx + 0.34, 0.1, sz + 0.34]} />
            <meshStandardMaterial color="#8d5530" roughness={0.78} />
          </mesh>
        )}
      </group>
    );
  }

  if (block.kind === "ramp") {
    const alongZ = sz >= sx;
    const span = alongZ ? sz : sx;
    const halfW = (alongZ ? sx : sz) * 0.5;
    const posts = [-span * 0.36, 0, span * 0.36];
    return (
      <group>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={alongZ ? [side * (halfW + 0.04), sy * 0.35, 0] : [0, sy * 0.35, side * (halfW + 0.04)]}>
              <boxGeometry args={alongZ ? [0.09, 0.14, sz] : [sx, 0.14, 0.09]} />
              <meshStandardMaterial color={accentColor} roughness={0.55} />
            </mesh>
            <mesh position={alongZ ? [side * (halfW + 0.05), sy * 0.5 + 0.58, 0] : [0, sy * 0.5 + 0.58, side * (halfW + 0.05)]}>
              <boxGeometry args={alongZ ? [0.06, 0.06, sz * 0.92] : [sx * 0.92, 0.06, 0.06]} />
              <meshStandardMaterial color="#475569" roughness={0.45} metalness={0.55} />
            </mesh>
            {posts.map((p, idx) => (
              <mesh
                key={idx}
                position={alongZ ? [side * (halfW + 0.05), sy * 0.5 + 0.28, p] : [p, sy * 0.5 + 0.28, side * (halfW + 0.05)]}
              >
                <boxGeometry args={[0.06, 0.58, 0.06]} />
                <meshStandardMaterial color="#475569" roughness={0.48} metalness={0.55} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }

  return null;
}
