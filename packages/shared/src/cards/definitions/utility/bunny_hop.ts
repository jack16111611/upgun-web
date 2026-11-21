import type { CardDefinition } from "../../types";

export const bunnyHopCard: CardDefinition = {
  id: "bunny_hop",
  name: "Bunny Hop",
  category: "mobility",
  rarity: "common",
  maxLevel: 5,
  icon: "🐇",
  description: (level) =>
    `Chaining jumps upon landing grants +${10 * level}% bonus horizontal momentum.`,
  statSummary: (level) => `+${10 * level}% Bunny Hop Boost`,
  modifyStats: (stats, level) => {
    stats.bunnyHopBoost += 0.1 * level;
  },
};
