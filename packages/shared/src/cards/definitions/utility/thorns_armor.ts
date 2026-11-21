import type { CardDefinition } from "../../types";

export const thornsArmorCard: CardDefinition = {
  id: "thorns_armor",
  name: "Thorns Armor",
  category: "survival",
  rarity: "rare",
  maxLevel: 5,
  icon: "🌵",
  description: (level) =>
    `Reflects ${20 * level}% of incoming enemy damage back at the attacker.`,
  statSummary: (level) => `+${20 * level}% Damage Reflect`,
  modifyStats: (stats, level) => {
    stats.thornsRatio += 0.2 * level;
  },
  onTakeDamage: (ctx, level) => {
    if (
      ctx.source === "thorns" ||
      !ctx.attackerId ||
      ctx.attackerId === ctx.targetId ||
      ctx.damage <= 0
    ) {
      return;
    }
    ctx.reflectDamage(Math.max(1, Math.round(ctx.damage * 0.2 * level)));
  },
};
