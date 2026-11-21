import type { CardDefinition } from "../../types";

export const incendiaryCoreCard: CardDefinition = {
  id: "incendiary_core",
  name: "Incendiary Core",
  category: "grenade",
  rarity: "rare",
  maxLevel: 5,
  icon: "🔥",
  description: (level) =>
    `Grenade and splash hits ignite enemies, burning them for ${6 * level} DPS over 3.0s.`,
  statSummary: (level) => `${6 * level} Burn DPS • 3.0s Duration`,
  onHit: (ctx, level) => {
    if (ctx.source !== "grenade" && ctx.source !== "splash") {
      return;
    }
    if (ctx.targetId === ctx.shooterId) {
      return;
    }
    ctx.applyBurn?.(ctx.targetId, 6 * level, 3.0);
  },
};
