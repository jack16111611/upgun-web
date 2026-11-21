import type { CardDefinition } from "../../types";

export const ricochetRoundsCard: CardDefinition = {
  id: "ricochet_rounds",
  name: "Ricochet Rounds",
  category: "weapon",
  rarity: "rare",
  maxLevel: 5,
  icon: "↩️",
  description: (level) =>
    `Rifle shots ricochet off walls and floors up to ${level} ${level === 1 ? "time" : "times"}.`,
  statSummary: (level) => `+${level} Bullet ${level === 1 ? "Bounce" : "Bounces"}`,
  onFire: (ctx, level) => {
    ctx.ricochetBounces += level;
  },
};
