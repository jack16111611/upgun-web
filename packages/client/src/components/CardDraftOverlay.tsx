import { useEffect, type CSSProperties } from "react";
import { DRAFTING_DURATION_SEC, getCardDefinition } from "@upgun/shared";
import { soundEngine } from "../audio/soundEngine";
import { sendPickCard, sendRerollDraft } from "../network/colyseusClient";
import { useGameStore } from "../store/gameStore";
import { CardCategoryIcon } from "./CardCategoryIcon";

function parseStatBadges(summary: string): string[] {
  const parts = summary
    .split(/\s*[•|,]\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts : [summary];
}

export function CardDraftOverlay() {
  const status = useGameStore((s) => s.status);
  const phase = useGameStore((s) => s.phase);
  const phaseTimer = useGameStore((s) => s.phaseTimer);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const ownedCards = useGameStore((s) => s.ownedCards);
  const draftChoices = useGameStore((s) => s.draftChoices);
  const hasPickedDraft = useGameStore((s) => s.hasPickedDraft);
  const rerollsRemaining = useGameStore((s) => s.rerollsRemaining);
  const draftStatuses = useGameStore((s) => s.draftStatuses);

  const visible =
    status === "connected" && phase === "drafting" && !lobbyOpen && !settingsOpen;

  useEffect(() => {
    if (!visible || hasPickedDraft) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "1" || event.key === "2" || event.key === "3") {
        const idx = Number(event.key) - 1;
        const cardId = draftChoices[idx];
        if (cardId) {
          event.preventDefault();
          const def = getCardDefinition(cardId);
          soundEngine.playCardSelect(def?.rarity);
          sendPickCard(cardId);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, hasPickedDraft, draftChoices]);

  if (!visible) {
    return null;
  }

  const ownedLevels = new Map<string, number>();
  for (const card of ownedCards) {
    ownedLevels.set(card.cardId, card.level);
  }

  const timeProgress = Math.max(0, Math.min(DRAFTING_DURATION_SEC, phaseTimer));
  const timerColor = phaseTimer <= 4 ? "#f87171" : "#38bdf8";

  return (
    <div
      className="draft-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-title"
    >
      <div className="draft-container">
        <header className="draft-header">
          <p className="draft-kicker">ROUND {roundNumber} COMPLETE</p>
          <h2 id="draft-title" className="draft-title">
            Choose Your Upgrade
          </h2>

          <div className="draft-timer-wrap">
            <div className="draft-timer-meta">
              <span>Draft Timer</span>
              <span className="draft-timer-sec">{Math.max(0, Math.ceil(phaseTimer))}s</span>
            </div>
            <progress
              aria-label="Draft countdown"
              className="hud-progress"
              value={timeProgress}
              max={DRAFTING_DURATION_SEC}
              style={{ "--progress-bar-fill": timerColor } as CSSProperties}
            />
          </div>

          <div className="draft-status-row" aria-label="Player draft progress">
            {draftStatuses.map((p) => (
              <span
                key={p.sessionId}
                className={`draft-player-chip ${p.hasPicked ? "draft-player-chip--done" : ""}`}
              >
                <span aria-hidden="true">{p.hasPicked ? "✓" : "…"}</span>
                <span>{p.displayName}</span>
              </span>
            ))}
          </div>
        </header>

        {hasPickedDraft ? (
          <div className="draft-waiting-box" role="status">
            <strong>Upgrade Locked In!</strong>
            <p>Waiting for other players to finish choosing...</p>
          </div>
        ) : (
          <>
            <div className="draft-grid">
              {draftChoices.map((cardId, idx) => {
                const def = getCardDefinition(cardId);
                if (!def) {
                  return null;
                }
                const currentLevel = ownedLevels.get(cardId) ?? 0;
                const nextLevel = Math.min(def.maxLevel, currentLevel + 1);
                const levelPill =
                  currentLevel === 0
                    ? "NEW CARD"
                    : `LVL ${currentLevel} → LVL ${nextLevel}`;
                const statBadges = parseStatBadges(def.statSummary(nextLevel));

                return (
                  <button
                    key={cardId}
                    type="button"
                    className={`draft-card draft-card--${def.rarity}`}
                    onMouseEnter={() => soundEngine.playCardHover()}
                    onClick={() => {
                      soundEngine.playCardSelect(def.rarity);
                      sendPickCard(cardId);
                    }}
                  >
                    <span className="draft-card-sheen" aria-hidden="true" />

                    <span className="draft-card-top">
                      <span className="draft-category-pill">
                        <CardCategoryIcon
                          category={def.category}
                          rarity={def.rarity}
                          size={14}
                          className="draft-category-svg"
                        />
                        <span>{def.category}</span>
                      </span>
                      <span className="draft-shortcut-pill" aria-hidden="true">
                        {idx + 1}
                      </span>
                    </span>

                    <span className={`draft-card-emblem draft-card-emblem--${def.rarity}`}>
                      <CardCategoryIcon
                        category={def.category}
                        cardId={def.id}
                        rarity={def.rarity}
                        size={52}
                      />
                    </span>

                    <span className="draft-card-heading">
                      <span className="draft-card-name">{def.name}</span>
                      <span className={`draft-rarity-label draft-rarity-label--${def.rarity}`}>
                        {def.rarity}
                      </span>
                    </span>

                    <span className="draft-level-row">
                      <span
                        className={`draft-level-pill ${currentLevel === 0 ? "draft-level-pill--new" : ""}`}
                      >
                        {levelPill}
                      </span>
                      <span className="draft-level-pips" aria-hidden="true">
                        {Array.from({ length: def.maxLevel }, (_, pipIdx) => {
                          const pipNum = pipIdx + 1;
                          const stateClass =
                            pipNum <= currentLevel
                              ? "draft-pip--owned"
                              : pipNum === nextLevel
                                ? "draft-pip--next"
                                : "";
                          return <span key={pipNum} className={`draft-pip ${stateClass}`} />;
                        })}
                      </span>
                    </span>

                    <span className="draft-card-desc">{def.description(nextLevel)}</span>

                    <span className="draft-stat-badges">
                      {statBadges.map((badge, badgeIdx) => (
                        <span key={badgeIdx} className="draft-stat-badge">
                          {badge}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="draft-actions">
              <button
                type="button"
                className="btn btn--secondary draft-reroll-btn"
                disabled={rerollsRemaining <= 0}
                onClick={() => sendRerollDraft()}
              >
                Reroll Choices ({rerollsRemaining} left)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
