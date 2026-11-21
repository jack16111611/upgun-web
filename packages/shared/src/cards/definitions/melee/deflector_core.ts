import type { CardDefinition } from "../../types";

export const deflectorCoreCard: CardDefinition = {
  id: "deflector_core",
  name: "Deflector Core",
  category: "survival",
  rarity: "rare",
  maxLevel: 5,
  icon: "🛡️",
  description: (level) =>
    `Swinging opens a ${(0.35 + 0.08 * (level - 1)).toFixed(2)}s shot-reflection barrier and expands grenade deflect radius by +${(1.2 + 0.4 * (level - 1)).toFixed(1)}m.`,
  statSummary: (level) =>
    `${(0.35 + 0.08 * (level - 1)).toFixed(2)}s Shot Reflect • +${(1.2 + 0.4 * (level - 1)).toFixed(1)}m Deflect Radius`,
  onMeleeSwing: (ctx, level) => {
    ctx.reflectShotsDurationSec = Math.max(
      ctx.reflectShotsDurationSec,
      0.35 + 0.08 * (level - 1),
    );
    ctx.deflectRadiusBonus += 1.2 + 0.4 * (level - 1);
  },
};
