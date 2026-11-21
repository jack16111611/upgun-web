import type { CardDefinition } from "../types";

export const vampirismCard: CardDefinition = {
  id: "vampirism",
  name: "Vampirism",
  category: "survival",
  rarity: "rare",
  maxLevel: 5,
  icon: "🩸",
  description: (level) =>
    `Heal yourself for ${20 * level}% of all damage dealt to enemies.`,
  statSummary: (level) => `+${20 * level}% Lifesteal`,
  modifyStats: (stats, level) => {
    stats.lifestealRatio += 0.2 * level;
  },
  onHit: (ctx, level) => {
    if (ctx.targetId === ctx.shooterId || ctx.damage <= 0) {
      return;
    }
    const healAmount = Math.max(1, Math.round(ctx.damage * 0.2 * level));
    ctx.healShooter(healAmount);
  },
};
