import type { CardDefinition } from "../../types";

export const frostRoundsCard: CardDefinition = {
  id: "frost_rounds",
  name: "Frost Rounds",
  category: "weapon",
  rarity: "rare",
  maxLevel: 5,
  icon: "❄️",
  description: (level) => {
    const slowPct = Math.round(Math.min(0.65, 0.18 * level) * 100);
    return `Rifle hits chill targets, slowing their movement speed by ${slowPct}% for 2.0s.`;
  },
  statSummary: (level) => {
    const slowPct = Math.round(Math.min(0.65, 0.18 * level) * 100);
    return `${slowPct}% Slow • 2.0s Duration`;
  },
  onHit: (ctx, level) => {
    if (ctx.source !== "rifle" || ctx.targetId === ctx.shooterId) {
      return;
    }
    const speedFactor = Math.max(0.35, 1 - Math.min(0.65, 0.18 * level));
    ctx.applySlow(ctx.targetId, speedFactor, 2.0);
  },
};
