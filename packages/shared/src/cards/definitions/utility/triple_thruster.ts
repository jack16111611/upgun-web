import type { CardDefinition } from "../../types";

export const tripleThrusterCard: CardDefinition = {
  id: "triple_thruster",
  name: "Triple Thruster",
  category: "mobility",
  rarity: "rare",
  maxLevel: 5,
  icon: "🚀",
  description: (level) =>
    `Gain +${level} extra mid-air ${level === 1 ? "jump" : "jumps"} and +10% jump force for vertical arena control.`,
  statSummary: (level) =>
    `+${level} Extra ${level === 1 ? "Jump" : "Jumps"} • +10% Jump Force`,
  modifyStats: (stats, level) => {
    stats.extraJumps += level;
    stats.jumpForce *= 1.1;
  },
};
