import type { CardDefinition } from "../../types";

export const glassCannonCard: CardDefinition = {
  id: "glass_cannon",
  name: "Glass Cannon",
  category: "chaos",
  rarity: "epic",
  maxLevel: 5,
  icon: "💎",
  description: (level) =>
    `Boosts all weapon and grenade damage by +${40 * level}%, at the cost of -25% max HP.`,
  statSummary: (level) => `+${40 * level}% DMG • -25% Max HP`,
  modifyStats: (stats, level) => {
    stats.damageMultiplier *= 1 + 0.4 * level;
    stats.maxHp = Math.max(30, Math.round(stats.maxHp * 0.75));
  },
};
