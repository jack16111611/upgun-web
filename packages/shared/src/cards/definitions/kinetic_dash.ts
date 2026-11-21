import type { CardDefinition } from "../types";

export const kineticDashCard: CardDefinition = {
  id: "kinetic_dash",
  name: "Kinetic Dash",
  category: "mobility",
  rarity: "common",
  maxLevel: 5,
  icon: "⚡",
  description: (level) =>
    `Reduces Dash cooldown by ${15 * level}%, reloads ${2 * level} bullets on dash, and emits a knockback pulse.`,
  statSummary: (level) =>
    `-${15 * level}% Dash CD • +${2 * level} Ammo on Dash • Knockback Pulse`,
  modifyStats: (stats, level) => {
    const reduction = Math.min(0.75, 0.15 * level);
    stats.dashCooldown = Math.max(0.35, stats.dashCooldown * (1 - reduction));
  },
  onDash: (ctx, level) => {
    ctx.reloadAmmo(2 * level);
    ctx.emitKnockbackPulse(ctx.position, 4.5 + level * 0.5, 11 + level * 2.5);
  },
};
