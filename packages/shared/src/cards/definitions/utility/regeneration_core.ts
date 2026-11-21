import type { CardDefinition } from "../../types";

export const regenerationCoreCard: CardDefinition = {
  id: "regeneration_core",
  name: "Regeneration Core",
  category: "survival",
  rarity: "rare",
  maxLevel: 5,
  icon: "💚",
  description: (level) =>
    `Regenerate ${4 * level} HP per second after avoiding damage for 3.0s.`,
  statSummary: (level) => `+${4 * level} HP/s Regen • 3.0s Delay`,
  modifyStats: (stats, level) => {
    stats.regenPerSec += 4 * level;
    stats.regenDelaySec = Math.min(stats.regenDelaySec, 3.0);
  },
};
