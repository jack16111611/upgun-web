import type { CardDefinition } from "../../types";

export const bloodFrenzyCard: CardDefinition = {
  id: "blood_frenzy",
  name: "Blood Frenzy",
  category: "chaos",
  rarity: "epic",
  maxLevel: 5,
  icon: "💢",
  description: (level) => {
    const healPct = Math.round(Math.min(1, 0.35 * level) * 100);
    return `Eliminating an enemy heals ${healPct}% of your max HP, refills your magazine, and resets all cooldowns.`;
  },
  statSummary: (level) => {
    const healPct = Math.round(Math.min(1, 0.35 * level) * 100);
    return `On Kill: +${healPct}% HP • Refill Mag • Reset CDs`;
  },
  onHit: (ctx, level) => {
    if (!ctx.killed || ctx.targetId === ctx.shooterId) {
      return;
    }
    ctx.healShooter(Math.round(ctx.stats.maxHp * Math.min(1, 0.35 * level)));
    ctx.refillMagazine?.();
    ctx.resetCooldowns?.();
  },
};
