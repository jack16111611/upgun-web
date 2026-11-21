import type { CardDefinition } from "../../types";

export const heavyCaliberCard: CardDefinition = {
  id: "heavy_caliber",
  name: "Heavy Caliber",
  category: "weapon",
  rarity: "common",
  maxLevel: 5,
  icon: "🔨",
  description: (level) =>
    `Increases rifle damage by ${22 * level}% and knocks enemies back on hit, at the cost of 10% slower fire rate.`,
  statSummary: (level) =>
    `+${22 * level}% DMG • -10% Fire Rate • ${(4.5 * level).toFixed(1)} Knockback`,
  modifyStats: (stats, level) => {
    stats.damageMultiplier *= 1 + 0.22 * level;
    stats.fireRateMultiplier *= 0.9;
  },
  onHit: (ctx, level) => {
    if (ctx.source !== "rifle" || ctx.targetId === ctx.shooterId) {
      return;
    }

    let dx = 0;
    let dy = 0;
    let dz = 1;

    if (ctx.direction) {
      const len = Math.hypot(ctx.direction.x, ctx.direction.y, ctx.direction.z);
      if (len > 1e-5) {
        dx = ctx.direction.x / len;
        dy = ctx.direction.y / len;
        dz = ctx.direction.z / len;
      }
    }

    const force = 4.5 * level;
    ctx.applyKnockback(ctx.targetId, {
      x: dx * force,
      y: dy * force + 2.0,
      z: dz * force,
    });
  },
};
