import type { CardDefinition } from "../../types";

export const phaseBlinkCard: CardDefinition = {
  id: "phase_blink",
  name: "Phase Blink",
  category: "mobility",
  rarity: "epic",
  maxLevel: 5,
  icon: "✨",
  description: (level) => {
    const distance = (4.5 + (level - 1) * 0.8).toFixed(1);
    const invuln = (0.25 + (level - 1) * 0.05).toFixed(2);
    return `Dashing phase-blinks you forward ${distance}m and grants ${invuln}s of invulnerability.`;
  },
  statSummary: (level) => {
    const distance = (4.5 + (level - 1) * 0.8).toFixed(1);
    const invuln = (0.25 + (level - 1) * 0.05).toFixed(2);
    return `${distance}m Blink • ${invuln}s Invuln`;
  },
  onDash: (ctx, level) => {
    ctx.blinkTeleport?.(4.5 + (level - 1) * 0.8, 0.25 + (level - 1) * 0.05);
  },
};
