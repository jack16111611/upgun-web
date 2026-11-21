import type { CardDefinition } from "../../types";

export const shockwaveDashCard: CardDefinition = {
  id: "shockwave_dash",
  name: "Shockwave Dash",
  category: "mobility",
  rarity: "rare",
  maxLevel: 5,
  icon: "🌊",
  description: (level) => {
    const radius = (3.5 + 0.35 * (level - 1)).toFixed(2);
    return `Dashing unleashes a ${radius}m kinetic shockwave dealing ${15 * level} damage and knocking enemies away.`;
  },
  statSummary: (level) => {
    const radius = (3.5 + 0.35 * (level - 1)).toFixed(2);
    return `${15 * level} Dash DMG • ${radius}m Shockwave`;
  },
  onDash: (ctx, level) => {
    ctx.emitKnockbackPulse(
      ctx.position,
      3.5 + 0.35 * (level - 1),
      11 + 2 * level,
      15 * level,
    );
  },
};
