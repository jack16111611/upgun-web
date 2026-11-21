import type { CardDefinition } from "../../types";

export const executionerCard: CardDefinition = {
  id: "executioner",
  name: "Executioner",
  category: "weapon",
  rarity: "rare",
  maxLevel: 5,
  icon: "💀",
  description: (level) =>
    `Melee hits against enemies below 40% HP critically execute for ${(2.5 + 0.25 * (level - 1)).toFixed(2)}x damage.`,
  statSummary: (level) =>
    `${(2.5 + 0.25 * (level - 1)).toFixed(2)}x Crit DMG vs <40% HP`,
  onMeleeHit: (ctx, level) => {
    if (ctx.targetHpRatio < 0.4) {
      ctx.damageMultiplier *= 2.5 + 0.25 * (level - 1);
      ctx.isCrit = true;
    }
  },
};
