import type { CardDefinition } from "../../types";

export const bigBadaBoomCard: CardDefinition = {
  id: "big_bada_boom",
  name: "Big Bada Boom",
  category: "grenade",
  rarity: "rare",
  maxLevel: 5,
  icon: "☢️",
  description: (level) =>
    `Increases grenade blast radius by ${25 * level}% and grenade max damage by ${20 * level}%.`,
  statSummary: (level) => `+${25 * level}% Blast Radius • +${20 * level}% Grenade DMG`,
  onGrenadeSpawn: (ctx, level) => {
    ctx.params.splashRadius *= 1 + 0.25 * level;
    ctx.params.maxDamage = Math.round(ctx.params.maxDamage * (1 + 0.2 * level));
  },
};
