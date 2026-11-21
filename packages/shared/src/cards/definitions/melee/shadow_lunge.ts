import type { CardDefinition } from "../../types";

export const shadowLungeCard: CardDefinition = {
  id: "shadow_lunge",
  name: "Shadow Lunge",
  category: "mobility",
  rarity: "epic",
  maxLevel: 5,
  icon: "💨",
  description: (level) =>
    `Melee swings lunge forward ${(3.5 + 0.5 * (level - 1)).toFixed(1)}m and immediately reset melee cooldown on kill.`,
  statSummary: (level) =>
    `${(3.5 + 0.5 * (level - 1)).toFixed(1)}m Lunge • Cooldown Reset on Kill`,
  onMeleeSwing: (ctx, level) => {
    ctx.lungeDistance = Math.max(ctx.lungeDistance, 3.5 + 0.5 * (level - 1));
    ctx.resetCooldownOnKill = true;
  },
};
