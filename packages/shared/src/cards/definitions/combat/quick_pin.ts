import type { CardDefinition } from "../../types";

export const quickPinCard: CardDefinition = {
  id: "quick_pin",
  name: "Quick Pin",
  category: "grenade",
  rarity: "common",
  maxLevel: 5,
  icon: "⏱️",
  description: (level) => {
    const cdReductionPct = Math.round((1 - Math.max(0.25, 1 - 0.18 * level)) * 100);
    return `Cuts grenade cooldown by ${cdReductionPct}% and launches thrown grenades 25% faster.`;
  },
  statSummary: (level) => {
    const cdReductionPct = Math.round((1 - Math.max(0.25, 1 - 0.18 * level)) * 100);
    return `-${cdReductionPct}% Grenade CD • +25% Throw Speed`;
  },
  modifyStats: (stats, level) => {
    stats.grenadeCooldown *= Math.max(0.25, 1 - 0.18 * level);
  },
  onGrenadeSpawn: (ctx) => {
    ctx.params.velocity.x *= 1.25;
    ctx.params.velocity.y *= 1.25;
    ctx.params.velocity.z *= 1.25;
  },
};
