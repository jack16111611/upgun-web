import type { CardDefinition } from "../../types";

export const stickyGrenadeCard: CardDefinition = {
  id: "sticky_grenade",
  name: "Sticky Grenade",
  category: "grenade",
  rarity: "common",
  maxLevel: 5,
  icon: "📌",
  description: (level) => {
    const fuseReduction = (0.1 * (level - 1)).toFixed(1);
    return level === 1
      ? "Grenades stick to walls, floors, and surfaces on impact instead of bouncing."
      : `Grenades stick on impact with a ${fuseReduction}s shorter fuse for tighter traps.`;
  },
  statSummary: (level) =>
    level === 1
      ? "Sticky Impact • Minimal Bounce"
      : `Sticky Impact • -${(0.1 * (level - 1)).toFixed(1)}s Fuse`,
  onGrenadeSpawn: (ctx, level) => {
    ctx.params.sticky = true;
    ctx.params.restitution = 0.05;
    ctx.params.fuseSec = Math.max(0.8, ctx.params.fuseSec - 0.1 * (level - 1));
  },
};
