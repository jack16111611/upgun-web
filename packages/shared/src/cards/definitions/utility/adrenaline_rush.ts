import type { CardDefinition } from "../../types";

export const adrenalineRushCard: CardDefinition = {
  id: "adrenaline_rush",
  name: "Adrenaline Rush",
  category: "mobility",
  rarity: "common",
  maxLevel: 5,
  icon: "💨",
  description: (level) =>
    `Landing hits on enemies grants +${15 * level}% movement speed for 2.0s.`,
  statSummary: (level) => `+${15 * level}% Speed on Hit (2.0s)`,
  onHit: (ctx, level) => {
    if (ctx.targetId === ctx.shooterId || ctx.damage <= 0) {
      return;
    }
    ctx.boostShooterSpeed?.(1 + 0.15 * level, 2.0);
  },
};
