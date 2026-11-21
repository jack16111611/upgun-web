import type { CardDefinition } from "../../types";

export const seismicSlamCard: CardDefinition = {
  id: "seismic_slam",
  name: "Seismic Slam",
  category: "chaos",
  rarity: "epic",
  maxLevel: 5,
  icon: "🌋",
  description: (level) =>
    `Swinging while airborne triggers a seismic slam shockwave dealing ${30 * level} radial damage across ${(5.2 + 0.5 * (level - 1)).toFixed(1)}m.`,
  statSummary: (level) =>
    `Airborne Slam • ${30 * level} DMG • ${(5.2 + 0.5 * (level - 1)).toFixed(1)}m Radius`,
  onMeleeSwing: (ctx, level) => {
    if (!ctx.isAirborne) {
      return;
    }
    ctx.triggerSeismicSlam?.(30 * level, 5.2 + 0.5 * (level - 1));
  },
};
