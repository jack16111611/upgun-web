import { DRAFTING_DURATION_SEC, rollDraftChoices } from "@upgun/shared";
import type { ArenaState } from "../schema/ArenaState";
import type { PlayerEntity } from "./PlayerEntity";

const DRAFT_CHOICE_COUNT = 3;

function setDraftChoices(player: PlayerEntity, choices: readonly string[]): void {
  player.schema.draftChoices.clear();
  for (const id of choices) {
    player.schema.draftChoices.push(id);
  }
}

export class DraftSystem {
  beginDraft(state: ArenaState, players: Map<string, PlayerEntity>): void {
    state.phase = "drafting";
    state.phaseTimer = DRAFTING_DURATION_SEC;

    for (const player of players.values()) {
      const choices = rollDraftChoices(player.ownedCards, DRAFT_CHOICE_COUNT);
      if (player.isBot) {
        player.schema.draftChoices.clear();
        const botChoice = choices[0];
        if (botChoice) {
          player.addOrUpgradeCard(botChoice);
        }
        player.schema.hasPickedDraft = true;
        continue;
      }

      if (choices.length === 0) {
        player.schema.draftChoices.clear();
        player.schema.hasPickedDraft = true;
      } else {
        setDraftChoices(player, choices);
        player.schema.hasPickedDraft = false;
      }
    }
  }

  handlePickCard(
    state: ArenaState,
    player: PlayerEntity,
    rawPayload: unknown,
  ): boolean {
    if (state.phase !== "drafting" || player.isBot || player.schema.hasPickedDraft) {
      return false;
    }

    const cardId =
      typeof rawPayload === "string"
        ? rawPayload
        : typeof rawPayload === "object" &&
            rawPayload !== null &&
            typeof (rawPayload as { cardId?: unknown }).cardId === "string"
          ? (rawPayload as { cardId: string }).cardId
          : "";

    if (!cardId) {
      return false;
    }

    const offered = Array.from(player.schema.draftChoices);
    if (!offered.includes(cardId)) {
      return false;
    }

    const applied = player.addOrUpgradeCard(cardId);
    if (!applied) {
      return false;
    }

    player.schema.draftChoices.clear();
    player.schema.hasPickedDraft = true;
    return true;
  }

  handleRerollDraft(state: ArenaState, player: PlayerEntity): boolean {
    if (
      state.phase !== "drafting" ||
      player.isBot ||
      player.schema.hasPickedDraft ||
      player.schema.rerollsRemaining <= 0
    ) {
      return false;
    }

    const previous = Array.from(player.schema.draftChoices);
    const nextChoices = rollDraftChoices(
      player.ownedCards,
      DRAFT_CHOICE_COUNT,
      Math.random,
      previous,
    );
    if (nextChoices.length === 0) {
      return false;
    }

    player.schema.rerollsRemaining -= 1;
    setDraftChoices(player, nextChoices);
    return true;
  }

  allHumansPicked(players: Map<string, PlayerEntity>): boolean {
    let humanCount = 0;
    for (const player of players.values()) {
      if (player.isBot) {
        continue;
      }
      humanCount += 1;
      if (!player.schema.hasPickedDraft) {
        return false;
      }
    }
    return humanCount > 0;
  }

  autoPickUnpicked(players: Map<string, PlayerEntity>): void {
    for (const player of players.values()) {
      if (player.isBot || player.schema.hasPickedDraft) {
        continue;
      }
      const fallback = player.schema.draftChoices[0];
      if (fallback) {
        player.addOrUpgradeCard(fallback);
      }
      player.schema.draftChoices.clear();
      player.schema.hasPickedDraft = true;
    }
  }
}
