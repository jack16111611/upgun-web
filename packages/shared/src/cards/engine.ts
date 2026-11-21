import {
  PLAYER_DASH_COOLDOWN_SEC,
  PLAYER_DASH_SPEED,
  PLAYER_JUMP_SPEED,
  PLAYER_MAX_HP,
  PLAYER_MOVE_SPEED,
  WEAPON_GRENADE,
  WEAPON_MELEE,
  WEAPON_RIFLE,
} from "../constants";
import { ALL_CARDS, CARD_REGISTRY } from "./registry";
import type {
  CardDefinition,
  CardHookContextMap,
  CardHookName,
  CardRarity,
  OwnedCard,
  PlayerComputedStats,
} from "./types";

const RARITY_WEIGHTS: Record<CardRarity, number> = {
  common: 55,
  rare: 32,
  epic: 13,
};

export function createBasePlayerStats(): PlayerComputedStats {
  return {
    maxHp: PLAYER_MAX_HP,
    moveSpeed: PLAYER_MOVE_SPEED,
    jumpForce: PLAYER_JUMP_SPEED,
    extraJumps: 0,
    dashCooldown: PLAYER_DASH_COOLDOWN_SEC,
    dashImpulse: PLAYER_DASH_SPEED,
    damageMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    magSize: WEAPON_RIFLE.magazineSize,
    reloadTimeMultiplier: 1.0,
    grenadeCooldown: WEAPON_GRENADE.cooldownSec,
    critMultiplier: 1.5,
    lifestealRatio: 0,
    thornsRatio: 0,
    gravityScale: 1.0,
    bunnyHopBoost: 0,
    regenPerSec: 0,
    regenDelaySec: 3.0,
    meleeDamageMultiplier: 1.0,
    meleeRangeBonus: 0,
    meleeCooldown: WEAPON_MELEE.cooldownSec,
  };
}

export function computePlayerStats(
  ownedCards: readonly OwnedCard[],
): PlayerComputedStats {
  const stats = createBasePlayerStats();

  for (const owned of ownedCards) {
    if (owned.level <= 0) {
      continue;
    }
    const def = CARD_REGISTRY.get(owned.cardId);
    if (def?.modifyStats) {
      def.modifyStats(stats, Math.min(owned.level, def.maxLevel));
    }
  }

  stats.maxHp = Math.max(25, Math.round(stats.maxHp));
  stats.moveSpeed = Math.max(2, stats.moveSpeed);
  stats.jumpForce = Math.max(3, stats.jumpForce);
  stats.extraJumps = Math.max(0, Math.round(stats.extraJumps));
  stats.dashCooldown = Math.max(0.25, stats.dashCooldown);
  stats.dashImpulse = Math.max(6, stats.dashImpulse);
  stats.damageMultiplier = Math.max(0.2, stats.damageMultiplier);
  stats.fireRateMultiplier = Math.max(0.25, stats.fireRateMultiplier);
  stats.magSize = Math.max(1, Math.round(stats.magSize));
  stats.reloadTimeMultiplier = Math.max(0.2, stats.reloadTimeMultiplier);
  stats.grenadeCooldown = Math.max(0.5, stats.grenadeCooldown);
  stats.critMultiplier = Math.max(1, stats.critMultiplier);
  stats.lifestealRatio = Math.max(0, stats.lifestealRatio);
  stats.thornsRatio = Math.max(0, stats.thornsRatio);
  stats.gravityScale = Math.max(0.25, Math.min(2.5, stats.gravityScale));

  return stats;
}

export function runCardHook<K extends CardHookName>(
  ownedCards: readonly OwnedCard[],
  hookName: K,
  ctx: CardHookContextMap[K],
): void {
  for (const owned of ownedCards) {
    if (owned.level <= 0) {
      continue;
    }
    const def = CARD_REGISTRY.get(owned.cardId);
    if (!def) {
      continue;
    }
    const hookFn = def[hookName] as
      | ((context: CardHookContextMap[K], level: number) => void)
      | undefined;
    if (hookFn) {
      hookFn(ctx, Math.min(owned.level, def.maxLevel));
    }
  }
}

function drawWeightedCards(
  sourcePool: CardDefinition[],
  count: number,
  rng: () => number,
): string[] {
  const pool = [...sourcePool];
  const picked: string[] = [];
  const targetCount = Math.min(count, pool.length);

  for (let i = 0; i < targetCount; i++) {
    let totalWeight = 0;
    for (const card of pool) {
      totalWeight += RARITY_WEIGHTS[card.rarity];
    }

    let roll = rng() * totalWeight;
    let chosenIdx = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      const card = pool[j]!;
      roll -= RARITY_WEIGHTS[card.rarity];
      if (roll <= 0) {
        chosenIdx = j;
        break;
      }
    }

    const [chosen] = pool.splice(chosenIdx, 1);
    if (chosen) {
      picked.push(chosen.id);
    }
  }

  return picked;
}

export function rollDraftChoices(
  ownedCards: readonly OwnedCard[],
  count = 3,
  rng: () => number = Math.random,
  excludeIds?: readonly string[],
): string[] {
  const ownedLevels = new Map<string, number>();
  for (const owned of ownedCards) {
    ownedLevels.set(owned.cardId, owned.level);
  }

  const excluded = new Set(excludeIds ?? []);
  const allEligible = ALL_CARDS.filter((card) => {
    const current = ownedLevels.get(card.id) ?? 0;
    return current < card.maxLevel;
  });

  // Always prefer cards not in excludeIds first (so rerolls always surface unseen cards when any exist)
  const preferredPool = allEligible.filter((card) => !excluded.has(card.id));
  const fallbackPool = allEligible.filter((card) => excluded.has(card.id));

  const picked = drawWeightedCards(preferredPool, count, rng);
  if (picked.length < count && fallbackPool.length > 0) {
    picked.push(...drawWeightedCards(fallbackPool, count - picked.length, rng));
  }

  return picked;
}
