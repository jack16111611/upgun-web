import type { Vec3 } from "../../../constants";
import type { CardDefinition } from "../../types";

function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len <= 1e-6) {
    return { x: 0, y: 0, z: -1 };
  }
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export const multishotCard: CardDefinition = {
  id: "multishot",
  name: "Multishot",
  category: "weapon",
  rarity: "epic",
  maxLevel: 5,
  icon: "🔱",
  description: (level) =>
    `Fire ${level} extra ${level === 1 ? "pellet" : "pellets"} in a tight spread around your aim. All pellets deal 30% less damage each.`,
  statSummary: (level) =>
    `+${level} Extra ${level === 1 ? "Pellet" : "Pellets"} • 70% DMG/Pellet`,
  onFire: (ctx, level) => {
    const dir = normalizeVec3(ctx.direction);
    const refUp: Vec3 = Math.abs(dir.y) > 0.99 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const right = normalizeVec3(crossVec3(dir, refUp));
    const up = normalizeVec3(crossVec3(right, dir));

    const spreadAngle = 0.028 + level * 0.004;
    ctx.damageMultiplier *= 0.7;

    for (let i = 0; i < level; i++) {
      const theta = (i / level) * Math.PI * 2;
      const offsetH = Math.cos(theta) * spreadAngle;
      const offsetV = Math.sin(theta) * spreadAngle;

      const rayDir = normalizeVec3({
        x: dir.x + right.x * offsetH + up.x * offsetV,
        y: dir.y + right.y * offsetH + up.y * offsetV,
        z: dir.z + right.z * offsetH + up.z * offsetV,
      });

      ctx.extraRays.push({
        direction: rayDir,
        damageScale: 0.7,
      });
    }
  },
};
