import type { CardDefinition } from "../../types";

export const secondWindCard: CardDefinition = {
  id: "second_wind",
  name: "Second Wind",
  category: "survival",
  rarity: "epic",
  maxLevel: 5,
  icon: "🔥",
  description: (level) =>
    `Once per round, survive a lethal blow with ${15 * level} HP and immediately trigger a free dash.`,
  statSummary: (level) => `Cheat Death (${15 * level} HP) • Free Dash`,
  onTakeDamage: (ctx, level) => {
    if (
      ctx.secondWindAvailable &&
      ctx.currentHp !== undefined &&
      ctx.currentHp - ctx.damage * ctx.damageMultiplier <= 0
    ) {
      ctx.preventLethal?.(15 * level, true);
    }
  },
};
