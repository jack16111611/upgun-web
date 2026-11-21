import { MAX_RECURSION_DEPTH } from "../../constants";
import type { CardDefinition } from "../types";

export const explosiveBulletsCard: CardDefinition = {
  id: "explosive_bullets",
  name: "Explosive Bullets",
  category: "weapon",
  rarity: "rare",
  maxLevel: 5,
  icon: "💥",
  description: (level) =>
    `Rifle hits trigger a mini explosion dealing ${12 * level} radial splash damage.`,
  statSummary: (level) =>
    `+${12 * level} Splash DMG • ${(3.0 + level * 0.35).toFixed(1)}m Radius`,
  onHit: (ctx, level) => {
    if (ctx.source !== "rifle" || ctx.recursionDepth >= MAX_RECURSION_DEPTH) {
      return;
    }
    const splashDamage = 12 * level;
    const splashRadius = 3.0 + level * 0.35;
    ctx.dealSplashDamage(ctx.point, splashRadius, splashDamage, ctx.recursionDepth + 1);
  },
};
