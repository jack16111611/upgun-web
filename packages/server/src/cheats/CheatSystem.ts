import {
  ALL_CARDS,
  CARD_REGISTRY,
  getCardDefinition,
  MAX_COMBAT_BOTS,
  type CardDefinition,
  type CheatCodeId,
} from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";

export const VALID_CHEAT_CODES: readonly CheatCodeId[] = [
  "IDDQD",
  "INFINITE",
  "UPGUNMAX",
  "MOON",
  "BIGHEAD",
  "BOTARMY",
] as const;

export const MOON_GRAVITY_SCALE = 0.35;
export const BIG_HEAD_SCALE = 2.5;
const UPGUNMAX_STARTER_COUNT = 5;

const VALID_CHEAT_CODE_SET: ReadonlySet<string> = new Set(VALID_CHEAT_CODES);

export interface CheatFlagsSnapshot {
  godMode: boolean;
  infiniteMode: boolean;
  moonGravity: boolean;
  bigHead: boolean;
}

export interface CheatExecutionCallbacks {
  spawnExtraBot: () => boolean;
  announce: (banner: string, subtitle: string, accent: string) => void;
}

export interface CheatExecutionResult {
  ok: boolean;
  code?: CheatCodeId;
  message: string;
}

export function parseCheatCode(raw: unknown): CheatCodeId | null {
  if (typeof raw !== "string") {
    return null;
  }
  const normalized = raw.trim().toUpperCase();
  if (!VALID_CHEAT_CODE_SET.has(normalized)) {
    return null;
  }
  return normalized as CheatCodeId;
}

function pickRandomCards(pool: readonly CardDefinition[], count: number): CardDefinition[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    const swapTarget = copy[j];
    if (current !== undefined && swapTarget !== undefined) {
      copy[i] = swapTarget;
      copy[j] = current;
    }
  }
  return copy.slice(0, count);
}

export class CheatSystem {
  private moonGravity = false;
  private bigHead = false;
  private readonly godModePlayers = new Set<string>();
  private readonly infinitePlayers = new Set<string>();

  isGodMode(sessionId: string): boolean {
    return this.godModePlayers.has(sessionId);
  }

  isInfiniteMode(sessionId: string): boolean {
    return this.infinitePlayers.has(sessionId);
  }

  getGravityScale(): number {
    return this.moonGravity ? MOON_GRAVITY_SCALE : 1;
  }

  isMoonGravity(): boolean {
    return this.moonGravity;
  }

  isBigHead(): boolean {
    return this.bigHead;
  }

  getHeadScale(): number {
    return this.bigHead ? BIG_HEAD_SCALE : 1;
  }

  getFlagsSnapshot(sessionId: string): CheatFlagsSnapshot {
    return {
      godMode: this.isGodMode(sessionId),
      infiniteMode: this.isInfiniteMode(sessionId),
      moonGravity: this.moonGravity,
      bigHead: this.bigHead,
    };
  }

  removePlayer(sessionId: string): void {
    this.godModePlayers.delete(sessionId);
    this.infinitePlayers.delete(sessionId);
  }

  resetAll(): void {
    this.moonGravity = false;
    this.bigHead = false;
    this.godModePlayers.clear();
    this.infinitePlayers.clear();
  }

  executeCheat(
    cheatsEnabled: boolean,
    rawCode: unknown,
    player: PlayerEntity,
    callbacks: CheatExecutionCallbacks,
  ): CheatExecutionResult {
    if (!cheatsEnabled) {
      return {
        ok: false,
        message: "Cheats are disabled in this room.",
      };
    }

    const code = parseCheatCode(rawCode);
    if (!code) {
      return {
        ok: false,
        message: "Unknown cheat code.",
      };
    }

    const actorName = player.schema.displayName || "Player";

    switch (code) {
      case "IDDQD": {
        const enabling = !this.godModePlayers.has(player.sessionId);
        if (enabling) {
          this.godModePlayers.add(player.sessionId);
          player.heal(player.stats.maxHp);
        } else {
          this.godModePlayers.delete(player.sessionId);
        }
        callbacks.announce(
          "IDDQD — GOD MODE",
          enabling ? `${actorName} is now INVINCIBLE` : `${actorName} disabled God Mode`,
          "#facc15",
        );
        return {
          ok: true,
          code,
          message: enabling ? "God Mode enabled." : "God Mode disabled.",
        };
      }

      case "INFINITE": {
        const enabling = !this.infinitePlayers.has(player.sessionId);
        if (enabling) {
          this.infinitePlayers.add(player.sessionId);
          player.refillMagazine();
          player.resetCooldowns();
          player.fireCooldownSec = 0;
        } else {
          this.infinitePlayers.delete(player.sessionId);
        }
        callbacks.announce(
          "INFINITE POWER",
          enabling
            ? `${actorName} unlocked infinite ammo & zero cooldowns`
            : `${actorName} disabled Infinite Mode`,
          "#38bdf8",
        );
        return {
          ok: true,
          code,
          message: enabling
            ? "Infinite ammo & cooldowns enabled."
            : "Infinite mode disabled.",
        };
      }

      case "UPGUNMAX": {
        return this.executeUpgunMax(player, actorName, callbacks);
      }

      case "MOON": {
        this.moonGravity = !this.moonGravity;
        callbacks.announce(
          "MOON GRAVITY",
          this.moonGravity
            ? `Low gravity (${MOON_GRAVITY_SCALE}x) engaged!`
            : "Standard arena gravity restored.",
          "#a855f7",
        );
        return {
          ok: true,
          code,
          message: this.moonGravity
            ? `Moon gravity (${MOON_GRAVITY_SCALE}x) enabled.`
            : "Moon gravity disabled.",
        };
      }

      case "BIGHEAD": {
        this.bigHead = !this.bigHead;
        callbacks.announce(
          "BIG HEAD MODE",
          this.bigHead
            ? `Giant robot heads (${BIG_HEAD_SCALE}x) activated!`
            : "Standard robot head proportions restored.",
          "#fb923c",
        );
        return {
          ok: true,
          code,
          message: this.bigHead
            ? `Big Head mode (${BIG_HEAD_SCALE}x) enabled.`
            : "Big Head mode disabled.",
        };
      }

      case "BOTARMY": {
        const spawned = callbacks.spawnExtraBot();
        if (!spawned) {
          return {
            ok: false,
            code,
            message: `Combat bot cap (${MAX_COMBAT_BOTS}) already reached.`,
          };
        }
        callbacks.announce(
          "BOT ARMY",
          `${actorName} deployed an extra AI combat bot!`,
          "#f43f5e",
        );
        return {
          ok: true,
          code,
          message: "Spawned an extra AI combat bot.",
        };
      }
    }
  }

  grantSandboxCard(
    cheatsEnabled: boolean,
    rawCardId: unknown,
    player: PlayerEntity,
  ): boolean {
    if (!cheatsEnabled || typeof rawCardId !== "string") {
      return false;
    }
    if (!CARD_REGISTRY.has(rawCardId)) {
      return false;
    }
    return player.addOrUpgradeCard(rawCardId);
  }

  private executeUpgunMax(
    player: PlayerEntity,
    actorName: string,
    callbacks: CheatExecutionCallbacks,
  ): CheatExecutionResult {
    if (player.ownedCards.length === 0) {
      const epicPool = ALL_CARDS.filter((card) => card.rarity === "epic");
      const chosen = pickRandomCards(epicPool, UPGUNMAX_STARTER_COUNT);
      if (chosen.length < UPGUNMAX_STARTER_COUNT) {
        const chosenIds = new Set(chosen.map((c) => c.id));
        const fallback = pickRandomCards(
          ALL_CARDS.filter((c) => !chosenIds.has(c.id)),
          UPGUNMAX_STARTER_COUNT - chosen.length,
        );
        chosen.push(...fallback);
      }

      let grantedCount = 0;
      for (const card of chosen) {
        if (player.addOrUpgradeCard(card.id)) {
          grantedCount += 1;
        }
      }

      callbacks.announce(
        "UPGUN MAX!",
        `${actorName} received ${grantedCount} random Epic cards!`,
        "#d946ef",
      );
      return {
        ok: true,
        code: "UPGUNMAX",
        message: `Granted ${grantedCount} random Epic cards.`,
      };
    }

    let levelsAdded = 0;
    const ownedSnapshot = [...player.ownedCards];
    for (const owned of ownedSnapshot) {
      const def = getCardDefinition(owned.cardId);
      if (!def) continue;
      while (owned.level < def.maxLevel) {
        const upgraded = player.addOrUpgradeCard(owned.cardId);
        if (!upgraded) break;
        levelsAdded += 1;
      }
    }

    callbacks.announce(
      "UPGUN MAX!",
      levelsAdded > 0
        ? `${actorName} maxed out all owned upgrades (+${levelsAdded} levels)!`
        : `${actorName}'s deck is already at maximum level!`,
      "#d946ef",
    );
    return {
      ok: true,
      code: "UPGUNMAX",
      message:
        levelsAdded > 0
          ? `Maxed all owned cards (+${levelsAdded} levels).`
          : "All owned cards are already max level.",
    };
  }
}
