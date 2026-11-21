import type { CardDefinition } from "../../types";

export const chaosRouletteCard: CardDefinition = {
  id: "chaos_roulette",
  name: "Chaos Roulette",
  category: "chaos",
  rarity: "rare",
  maxLevel: 5,
  icon: "🎲",
  description: (level) =>
    `At the start of each round, gain a random temporary Epic card at Level ${level} for that round.`,
  statSummary: (level) => `Random Lv.${level} Epic Card / Round`,
  onRoundStart: (ctx, level) => {
    const pool = ctx.getEpicCardIds().filter((id) => id !== "chaos_roulette");
    if (pool.length === 0) {
      return;
    }
    const chosenId = pool[Math.floor(Math.random() * pool.length)];
    if (chosenId !== undefined) {
      ctx.grantTemporaryCard(chosenId, level);
    }
  },
};
