import type { CardDefinition } from "../../types";

export const berserkerCard: CardDefinition = {
  id: "berserker",
  name: "Berserker",
  category: "chaos",
  rarity: "rare",
  maxLevel: 5,
  icon: "🪓",
  description: (level) =>
    `Deal up to +${45 * level}% bonus weapon damage scaling with your missing health.`,
  statSummary: (level) => `Up to +${45 * level}% DMG at Low HP`,
  onFire: (ctx, level) => {
    const missingRatio = Math.max(0, Math.min(1, 1 - (ctx.shooterHpRatio ?? 1)));
    ctx.damageMultiplier *= 1 + 0.45 * level * missingRatio;
  },
};
