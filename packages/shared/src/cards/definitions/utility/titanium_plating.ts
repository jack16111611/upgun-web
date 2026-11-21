import type { CardDefinition } from "../../types";

export const titaniumPlatingCard: CardDefinition = {
  id: "titanium_plating",
  name: "Titanium Plating",
  category: "survival",
  rarity: "common",
  maxLevel: 5,
  icon: "🛡️",
  description: (level) =>
    `Reinforces your chassis with +${25 * level} maximum HP.`,
  statSummary: (level) => `+${25 * level} Max HP`,
  modifyStats: (stats, level) => {
    stats.maxHp += 25 * level;
  },
};
