import { COMBAT_CARDS } from "./definitions/combat";
import { explosiveBulletsCard } from "./definitions/explosive_bullets";
import { grenadeceptionCard } from "./definitions/grenadeception";
import { kineticDashCard } from "./definitions/kinetic_dash";
import { MELEE_CARDS } from "./definitions/melee";
import { UTILITY_CARDS } from "./definitions/utility";
import { vampirismCard } from "./definitions/vampirism";
import type { CardDefinition } from "./types";

export const ALL_CARDS: readonly CardDefinition[] = [
  explosiveBulletsCard,
  grenadeceptionCard,
  vampirismCard,
  kineticDashCard,
  ...COMBAT_CARDS,
  ...UTILITY_CARDS,
  ...MELEE_CARDS,
];

export const CARD_REGISTRY: ReadonlyMap<string, CardDefinition> = new Map(
  ALL_CARDS.map((card) => [card.id, card]),
);

export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return CARD_REGISTRY.get(cardId);
}
