import type { CardDefinition } from "../../types";

export const vampiricBladeCard: CardDefinition = {
  id: "vampiric_blade",
  name: "Vampiric Blade",
  category: "survival",
  rarity: "common",
  maxLevel: 5,
  icon: "🩸",
  description: (level) =>
    `Landing a melee strike siphons ${25 * level} HP and grants a +20% speed surge for 2.0s.`,
  statSummary: (level) => `+${25 * level} HP on Melee Hit • +20% Speed (2.0s)`,
  onMeleeHit: (ctx, level) => {
    ctx.healAttacker(25 * level);
    ctx.boostAttackerSpeed(1.2, 2.0);
  },
};
