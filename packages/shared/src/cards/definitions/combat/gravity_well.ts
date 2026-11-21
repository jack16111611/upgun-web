import type { CardDefinition } from "../../types";

export const gravityWellCard: CardDefinition = {
  id: "gravity_well",
  name: "Gravity Well",
  category: "grenade",
  rarity: "epic",
  maxLevel: 5,
  icon: "🌀",
  description: (level) =>
    `Grenade explosions create a singularity that yanks nearby players inward with ${(12 + level * 3.5).toFixed(1)} pull force.`,
  statSummary: (level) =>
    `+${(2.5 + level * 0.8).toFixed(1)}m Pull Radius • ${(12 + level * 3.5).toFixed(1)} Pull Force`,
  onGrenadeExplode: (ctx, level) => {
    const pullRadius = ctx.radius + 2.5 + level * 0.8;
    const pullForce = 12 + level * 3.5;
    ctx.pullNearbyPlayers?.(ctx.position, pullRadius, pullForce);
  },
};
