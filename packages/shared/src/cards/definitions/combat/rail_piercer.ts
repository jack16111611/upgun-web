import type { CardDefinition } from "../../types";

export const railPiercerCard: CardDefinition = {
  id: "rail_piercer",
  name: "Rail Piercer",
  category: "weapon",
  rarity: "epic",
  maxLevel: 5,
  icon: "🗡️",
  description: (level) =>
    `Rifle shots pierce through ${level} extra ${level === 1 ? "target" : "targets"} and gain +${Math.round(25 * level)}% critical damage multiplier.`,
  statSummary: (level) =>
    `+${level} Pierce • +${(0.25 * level).toFixed(2)}x Crit Multiplier`,
  modifyStats: (stats, level) => {
    stats.critMultiplier += 0.25 * level;
  },
  onFire: (ctx, level) => {
    ctx.pierceCount = (ctx.pierceCount ?? 0) + level;
  },
};
