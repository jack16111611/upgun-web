import type { CardDefinition } from "../../types";

export const blastShieldCard: CardDefinition = {
  id: "blast_shield",
  name: "Blast Shield",
  category: "survival",
  rarity: "common",
  maxLevel: 5,
  icon: "🔰",
  description: (level) => {
    const reduction = Math.round((1 - Math.max(0.15, 1 - 0.25 * level)) * 100);
    return `Reduces incoming grenade and splash explosion damage by ${reduction}%.`;
  },
  statSummary: (level) => {
    const reduction = Math.round((1 - Math.max(0.15, 1 - 0.25 * level)) * 100);
    return `-${reduction}% Blast & Splash DMG`;
  },
  onTakeDamage: (ctx, level) => {
    if (ctx.source === "grenade" || ctx.source === "splash") {
      ctx.damageMultiplier *= Math.max(0.15, 1 - 0.25 * level);
    }
  },
};
