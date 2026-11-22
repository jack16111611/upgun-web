import type { RefObject } from "react";
import type { MeshStandardMaterial } from "three";
import type { ViewmodelWeaponId } from "./viewmodelWeaponConfig";

export {
  resolveViewmodelWeapon,
  type ViewmodelWeaponConfig,
  type ViewmodelWeaponId,
} from "./viewmodelWeaponConfig";

export interface ViewmodelWeaponMeshesProps {
  weaponId: ViewmodelWeaponId;
  accentColor: string;
  energyMatRef: RefObject<MeshStandardMaterial | null>;
}

const SLATE_DARK = "#0f172a";
const SLATE_BODY = "#1e293b";
const STEEL = "#334155";
const TITANIUM = "#64748b";

function EnergyRail({
  position,
  args,
  accentColor,
  energyMatRef,
}: {
  position: [number, number, number];
  args: [number, number, number];
  accentColor: string;
  energyMatRef?: RefObject<MeshStandardMaterial | null>;
}) {
  return (
    <mesh position={position} frustumCulled={false}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={energyMatRef}
        color={accentColor}
        emissive={accentColor}
        emissiveIntensity={1.65}
        roughness={0.16}
        toneMapped={false}
      />
    </mesh>
  );
}

export function ViewmodelWeaponMeshes({
  weaponId,
  accentColor,
  energyMatRef,
}: ViewmodelWeaponMeshesProps) {
  switch (weaponId) {
    case "golden_katana":
      return (
        <group position={[0.04, -0.05, 0.04]} rotation={[0.42, -0.26, 0.32]} frustumCulled={false}>
          <mesh position={[0, -0.17, 0.02]} frustumCulled={false}>
            <cylinderGeometry args={[0.02, 0.022, 0.24, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.65} metalness={0.35} />
          </mesh>
          <mesh position={[0, -0.3, 0.02]} frustumCulled={false}>
            <cylinderGeometry args={[0.025, 0.022, 0.03, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.88} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.045, 0.02]} frustumCulled={false}>
            <cylinderGeometry args={[0.068, 0.068, 0.018, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.16} />
          </mesh>
          <mesh position={[0, -0.015, 0.02]} frustumCulled={false}>
            <boxGeometry args={[0.024, 0.045, 0.04]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.34, 0.025]} rotation={[-0.03, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.012, 0.72, 0.032]} />
            <meshStandardMaterial color="#fef3c7" metalness={0.92} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0.35, -0.002]} rotation={[-0.03, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.007, 0.75, 0.022]} />
            <meshStandardMaterial
              ref={energyMatRef}
              color="#fef9c3"
              emissive="#facc15"
              emissiveIntensity={2.1}
              roughness={0.12}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0.745, 0.005]} rotation={[-0.18, 0, 0]} frustumCulled={false}>
            <coneGeometry args={[0.018, 0.095, 4]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        </group>
      );

    case "instagib_railgun":
    case "precision_railgun":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, -0.005, 0.04]} frustumCulled={false}>
            <boxGeometry args={[0.078, 0.095, 0.38]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.78} roughness={0.24} />
          </mesh>
          <mesh position={[-0.034, 0.02, -0.34]} frustumCulled={false}>
            <boxGeometry args={[0.018, 0.032, 0.48]} />
            <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.2} />
          </mesh>
          <mesh position={[0.034, 0.02, -0.34]} frustumCulled={false}>
            <boxGeometry args={[0.018, 0.032, 0.48]} />
            <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.2} />
          </mesh>
          <EnergyRail position={[0, 0.02, -0.32]} args={[0.024, 0.02, 0.44]} accentColor={accentColor} energyMatRef={energyMatRef} />
          {[-0.22, -0.36, -0.49].map((z, idx) => (
            <mesh key={idx} position={[0, 0.02, z]} frustumCulled={false}>
              <boxGeometry args={[0.094, 0.056, 0.024]} />
              <meshStandardMaterial color={SLATE_DARK} metalness={0.82} roughness={0.28} />
            </mesh>
          ))}
          <mesh position={[0, 0.088, -0.02]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.024, 0.028, 0.24, 10]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.76} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.085, 0.08]} rotation={[-0.22, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.044, 0.11, 0.06]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      );

    case "explosive_launcher":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0.03, -0.18]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.058, 0.062, 0.54, 12]} />
            <meshStandardMaterial color={STEEL} metalness={0.72} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, -0.44]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.074, 0.064, 0.07, 12]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.8} roughness={0.26} />
          </mesh>
          <mesh position={[0, -0.045, -0.02]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.078, 0.078, 0.14, 8]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.68} roughness={0.34} />
          </mesh>
          <EnergyRail position={[0, 0.095, -0.18]} args={[0.028, 0.02, 0.38]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <mesh position={[0, -0.055, -0.26]} frustumCulled={false}>
            <boxGeometry args={[0.038, 0.09, 0.042]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.35} roughness={0.65} />
          </mesh>
        </group>
      );

    case "scatter_shotgun":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0, 0.02]} frustumCulled={false}>
            <boxGeometry args={[0.096, 0.098, 0.34]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.7} roughness={0.32} />
          </mesh>
          <mesh position={[-0.024, 0.028, -0.27]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.022, 0.024, 0.36, 8]} />
            <meshStandardMaterial color={STEEL} metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[0.024, 0.028, -0.27]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.022, 0.024, 0.36, 8]} />
            <meshStandardMaterial color={STEEL} metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[0, -0.03, -0.22]} frustumCulled={false}>
            <boxGeometry args={[0.072, 0.056, 0.2]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.45} roughness={0.55} />
          </mesh>
          <EnergyRail position={[-0.052, 0.02, -0.04]} args={[0.01, 0.022, 0.26]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <EnergyRail position={[0.052, 0.02, -0.04]} args={[0.01, 0.022, 0.26]} accentColor={accentColor} />
        </group>
      );

    case "plasma_smg":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0.005, 0.02]} frustumCulled={false}>
            <boxGeometry args={[0.068, 0.088, 0.3]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.75} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0.018, -0.21]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.018, 0.022, 0.17, 8]} />
            <meshStandardMaterial color={TITANIUM} metalness={0.85} roughness={0.22} />
          </mesh>
          <EnergyRail position={[-0.042, 0.015, -0.01]} args={[0.016, 0.034, 0.22]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <EnergyRail position={[0.042, 0.015, -0.01]} args={[0.016, 0.034, 0.22]} accentColor={accentColor} />
          <mesh position={[0, -0.105, -0.06]} rotation={[-0.24, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.034, 0.145, 0.048]} />
            <meshStandardMaterial color={STEEL} metalness={0.58} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.072, 0.04]} frustumCulled={false}>
            <boxGeometry args={[0.044, 0.034, 0.045]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.65} roughness={0.3} />
          </mesh>
        </group>
      );

    case "heavy_slugger":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0.01, -0.02]} frustumCulled={false}>
            <boxGeometry args={[0.088, 0.115, 0.38]} />
            <meshStandardMaterial color={STEEL} metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.028, -0.29]} frustumCulled={false}>
            <boxGeometry args={[0.064, 0.074, 0.22]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.82} roughness={0.25} />
          </mesh>
          <EnergyRail position={[0, 0.074, -0.08]} args={[0.034, 0.016, 0.34]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <mesh position={[0, -0.095, -0.04]} rotation={[0.14, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.064, 0.11, 0.092]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.6} roughness={0.42} />
          </mesh>
        </group>
      );

    case "ricochet_carbine":
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.074, 0.092, 0.4]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.76} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0.022, -0.3]} rotation={[Math.PI / 2, 0, Math.PI / 4]} frustumCulled={false}>
            <cylinderGeometry args={[0.032, 0.038, 0.26, 4]} />
            <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.2} />
          </mesh>
          <EnergyRail position={[-0.044, 0.02, -0.08]} args={[0.012, 0.018, 0.38]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <EnergyRail position={[0.044, 0.02, -0.08]} args={[0.012, 0.018, 0.38]} accentColor={accentColor} />
          <mesh position={[0, 0.082, 0.03]} frustumCulled={false}>
            <boxGeometry args={[0.052, 0.042, 0.075]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.68} roughness={0.32} />
          </mesh>
          <mesh position={[0, -0.085, -0.05]} rotation={[0.25, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.042, 0.115, 0.068]} />
            <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.42} />
          </mesh>
        </group>
      );

    case "burst_rifle":
    case "classic_rifle":
    default:
      return (
        <group frustumCulled={false}>
          <mesh position={[0, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.074, 0.092, 0.42]} />
            <meshStandardMaterial color={SLATE_BODY} metalness={0.74} roughness={0.27} />
          </mesh>
          <mesh position={[0, 0.054, -0.02]} frustumCulled={false}>
            <boxGeometry args={[0.054, 0.028, 0.36]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.62} roughness={0.36} />
          </mesh>
          <EnergyRail position={[-0.04, 0.016, -0.03]} args={[0.01, 0.018, 0.35]} accentColor={accentColor} energyMatRef={energyMatRef} />
          <EnergyRail position={[0.04, 0.016, -0.03]} args={[0.01, 0.018, 0.35]} accentColor={accentColor} />
          <mesh position={[0, 0.022, -0.275]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.016, 0.021, 0.23, 8]} />
            <meshStandardMaterial color={STEEL} metalness={0.86} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.022, -0.38]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <cylinderGeometry args={[0.024, 0.022, 0.055, 8]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.82} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.086, -0.05]} rotation={[0.22, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.042, 0.115, 0.068]} />
            <meshStandardMaterial color={STEEL} metalness={0.52} roughness={0.44} />
          </mesh>
          <mesh position={[0, -0.06, -0.175]} rotation={[-0.25, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.034, 0.075, 0.038]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.35} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.086, 0.05]} frustumCulled={false}>
            <boxGeometry args={[0.048, 0.042, 0.068]} />
            <meshStandardMaterial color={SLATE_DARK} metalness={0.65} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.089, 0.048]} frustumCulled={false}>
            <boxGeometry args={[0.009, 0.009, 0.009]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
        </group>
      );
  }
}
