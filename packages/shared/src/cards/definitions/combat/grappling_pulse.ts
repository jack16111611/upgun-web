import type { CardDefinition } from "../../types";

export const grapplingPulseCard: CardDefinition = {
  id: "grappling_pulse",
  name: "Grappling Pulse",
  category: "grenade",
  rarity: "epic",
  maxLevel: 5,
  icon: "🪝",
  description: (level) =>
    `When your grenade detonates while you are airborne, launch toward the blast with ${(14 + level * 2.5).toFixed(1)} impulse.`,
  statSummary: (level) => `Airborne Grapple Impulse: ${(14 + level * 2.5).toFixed(1)}`,
  onGrenadeExplode: (ctx, level) => {
    ctx.launchOwnerToward?.(ctx.position, 14 + level * 2.5, true);
  },
};
