import type { CardDefinition } from "../../types";

export const plasmaKatanaCard: CardDefinition = {
  id: "plasma_katana",
  name: "Plasma Katana",
  category: "weapon",
  rarity: "rare",
  maxLevel: 5,
  icon: "⚔️",
  description: (level) =>
    `Supercharge your melee arc for +${Math.round(35 * level)}% melee damage and +${(0.5 * level).toFixed(1)}m cleave reach.`,
  statSummary: (level) =>
    `+${Math.round(35 * level)}% Melee DMG • +${(0.5 * level).toFixed(1)}m Melee Range`,
  modifyStats: (stats, level) => {
    stats.meleeDamageMultiplier *= 1 + 0.35 * level;
    stats.meleeRangeBonus += 0.5 * level;
  },
};
