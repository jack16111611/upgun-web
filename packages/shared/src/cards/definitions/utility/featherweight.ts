import type { CardDefinition } from "../../types";

export const featherweightCard: CardDefinition = {
  id: "featherweight",
  name: "Featherweight",
  category: "mobility",
  rarity: "common",
  maxLevel: 5,
  icon: "🪶",
  description: (level) => {
    const gravityReduction = Math.round((1 - Math.max(0.25, 1 - 0.18 * level)) * 100);
    return `Reduces gravity by ${gravityReduction}% and boosts movement speed by ${12 * level}%.`;
  },
  statSummary: (level) => {
    const gravityReduction = Math.round((1 - Math.max(0.25, 1 - 0.18 * level)) * 100);
    return `-${gravityReduction}% Gravity • +${12 * level}% Move Speed`;
  },
  modifyStats: (stats, level) => {
    stats.gravityScale *= Math.max(0.25, 1 - 0.18 * level);
    stats.moveSpeed *= 1 + 0.12 * level;
  },
};
