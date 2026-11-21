import type { CardDefinition } from "../../types";

export const rapidBoltCard: CardDefinition = {
  id: "rapid_bolt",
  name: "Rapid Bolt",
  category: "weapon",
  rarity: "common",
  maxLevel: 5,
  icon: "⏩",
  description: (level) => {
    const reloadReductionPct = Math.round((1 - Math.max(0.35, 1 / (1 + 0.15 * level))) * 100);
    return `Boosts rifle fire rate by ${22 * level}% and cuts reload time by ${reloadReductionPct}%.`;
  },
  statSummary: (level) => {
    const reloadReductionPct = Math.round((1 - Math.max(0.35, 1 / (1 + 0.15 * level))) * 100);
    return `+${22 * level}% Fire Rate • -${reloadReductionPct}% Reload Time`;
  },
  modifyStats: (stats, level) => {
    stats.fireRateMultiplier *= 1 + 0.22 * level;
    stats.reloadTimeMultiplier *= Math.max(0.35, 1 / (1 + 0.15 * level));
  },
};
