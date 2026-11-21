import type { CardDefinition } from "../../types";

export const lastChamberCard: CardDefinition = {
  id: "last_chamber",
  name: "Last Chamber",
  category: "weapon",
  rarity: "common",
  maxLevel: 5,
  icon: "🎯",
  description: (level) =>
    `The final round in your magazine deals +${65 * level}% damage and detonates for ${18 * level} bonus splash damage.`,
  statSummary: (level) =>
    `Final Shot: +${65 * level}% DMG • +${18 * level} Splash (${(2.4 + 0.35 * level).toFixed(1)}m)`,
  onFire: (ctx, level) => {
    if (ctx.ammoRemaining !== 0) {
      return;
    }
    ctx.damageMultiplier *= 1 + 0.65 * level;
    ctx.bonusSplashRadius = Math.max(ctx.bonusSplashRadius ?? 0, 2.4 + 0.35 * level);
    ctx.bonusSplashDamage = (ctx.bonusSplashDamage ?? 0) + 18 * level;
  },
};
