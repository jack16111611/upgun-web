import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getCardDefinition, type OwnedCard } from "@upgun/shared";
import { useGameStore } from "../../store/gameStore";
import { useSettingsStore } from "../../store/settingsStore";
import { formatWeaponSource, getSyncedPlayerCards } from "./spectatorHelpers";
import { useSpectatorStore } from "./spectatorStore";
import "./spectator.css";

const MAX_VISIBLE_CARDS = 6;

export interface SpectatorOverlayProps {
  /** Optional map of player sessionId -> equipped cards (defaults to reading synced room state). */
  playerCardsById?: Readonly<Record<string, readonly OwnedCard[]>>;
}

export function SpectatorOverlay({ playerCardsById }: SpectatorOverlayProps = {}) {
  const status = useGameStore((s) => s.status);
  const localSessionId = useGameStore((s) => s.sessionId);
  const phase = useGameStore((s) => s.phase);
  const isAlive = useGameStore((s) => s.isAlive);
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const sandboxOpen = useGameStore((s) => s.sandboxOpen);
  const scoreboardRows = useGameStore((s) => s.scoreboardRows);
  const showTouchControls = useSettingsStore((s) => s.showTouchControls);

  const mode = useSpectatorStore((s) => s.mode);
  const targetSessionId = useSpectatorStore((s) => s.targetSessionId);
  const killerHighlight = useSpectatorStore((s) => s.killerHighlight);
  const toggleMode = useSpectatorStore((s) => s.toggleMode);
  const cycleTarget = useSpectatorStore((s) => s.cycleTarget);
  const clearExpiredKillerHighlight = useSpectatorStore((s) => s.clearExpiredKillerHighlight);

  const [highlightVisible, setHighlightVisible] = useState(false);

  useEffect(() => {
    if (!killerHighlight) {
      setHighlightVisible(false);
      return;
    }
    const remaining = killerHighlight.untilMs - performance.now();
    if (remaining <= 0) {
      setHighlightVisible(false);
      clearExpiredKillerHighlight();
      return;
    }
    setHighlightVisible(true);
    const timer = window.setTimeout(() => {
      setHighlightVisible(false);
      clearExpiredKillerHighlight();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [killerHighlight, clearExpiredKillerHighlight]);

  const isSpectating =
    status === "connected" &&
    !isAlive &&
    phase !== "lobby" &&
    phase !== "drafting" &&
    phase !== "match_over" &&
    !lobbyOpen &&
    !settingsOpen &&
    !sandboxOpen;

  const aliveRows = useMemo(
    () =>
      scoreboardRows
        .filter((row) => row.isAlive && row.sessionId !== localSessionId)
        .sort((a, b) => a.sessionId.localeCompare(b.sessionId)),
    [scoreboardRows, localSessionId],
  );

  const aliveIds = useMemo(() => aliveRows.map((row) => row.sessionId), [aliveRows]);

  const followedRow = useMemo(() => {
    if (aliveRows.length === 0) return null;
    if (targetSessionId) {
      const exact = aliveRows.find((row) => row.sessionId === targetSessionId);
      if (exact) return exact;
    }
    return aliveRows[0] ?? null;
  }, [aliveRows, targetSessionId]);

  if (!isSpectating) {
    return null;
  }

  const followedCards: readonly OwnedCard[] = followedRow
    ? (playerCardsById?.[followedRow.sessionId] ?? getSyncedPlayerCards(followedRow.sessionId))
    : [];
  const visibleCards = followedCards.slice(0, MAX_VISIBLE_CARDS);
  const hiddenCardCount = Math.max(0, followedCards.length - visibleCards.length);

  const followedHpRatio =
    followedRow && followedRow.maxHp > 0 ? followedRow.hp / followedRow.maxHp : 0;
  const followedHpColor =
    followedHpRatio > 0.55 ? "#4ade80" : followedHpRatio > 0.25 ? "#facc15" : "#f87171";

  const killerHpRatio =
    killerHighlight && killerHighlight.killerMaxHp > 0
      ? killerHighlight.killerHp / killerHighlight.killerMaxHp
      : 0;

  return (
    <div
      className={`spectator-layer ${showTouchControls ? "spectator-layer--touch" : ""}`}
      aria-label="Spectator controls"
    >
      {/* Top 1.5s Killer Highlight Toast */}
      {highlightVisible && killerHighlight && (
        <div className="spectator-killer-toast" role="status" aria-live="polite">
          <div className="spectator-killer-toast__row">
            <span className="spectator-killer-toast__badge">ELIMINATED</span>
            <span className="spectator-killer-toast__text">
              {killerHighlight.killerId
                ? `Eliminated by ${killerHighlight.killerName} (${killerHighlight.killerHp} HP left)`
                : `Eliminated by ${killerHighlight.killerName}`}
            </span>
            <span className="spectator-killer-toast__weapon">
              {formatWeaponSource(killerHighlight.weaponSource)}
            </span>
          </div>
          {killerHighlight.killerMaxHp > 0 && (
            <div className="spectator-killer-toast__hp-track" aria-hidden="true">
              <div
                className="spectator-killer-toast__hp-fill"
                style={{ width: `${Math.max(0, Math.min(100, killerHpRatio * 100))}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Compact Spectator Bar */}
      <section className="spectator-bar" aria-label="Spectator camera bar">
        <div className="spectator-bar__top">
          <div className="spectator-bar__status">
            <span className="spectator-bar__dot" aria-hidden="true" />
            <span className="spectator-bar__title">SPECTATING</span>
            <span className="spectator-bar__alive">{aliveRows.length} Alive</span>
          </div>

          <button
            type="button"
            className={`spectator-mode-btn ${mode === "freefly" ? "spectator-mode-btn--drone" : ""}`}
            onClick={() => toggleMode()}
          >
            <span>{mode === "follow" ? "Follow Cam" : "Free-Fly Drone"}</span>
            <kbd className="spectator-kbd">
              {mode === "follow" ? "SPACE / F" : "F"}
            </kbd>
          </button>
        </div>

        {mode === "follow" ? (
          <div className="spectator-follow">
            <button
              type="button"
              className="spectator-cycle-btn"
              disabled={aliveIds.length <= 1}
              onClick={() => cycleTarget(-1, aliveIds)}
            >
              Prev <span className="spectator-cycle-btn__hint">(LMB)</span>
            </button>

            <div className="spectator-target">
              {followedRow ? (
                <>
                  <div className="spectator-target__head">
                    <span className="spectator-target__identity">
                      <span
                        className="spectator-target__swatch"
                        style={{ backgroundColor: followedRow.color }}
                        aria-hidden="true"
                      />
                      <strong className="spectator-target__name">
                        {followedRow.displayName}
                      </strong>
                      {followedRow.isBot && (
                        <span className="spectator-target__bot">BOT</span>
                      )}
                    </span>
                    <span className="spectator-target__hp-text">
                      {followedRow.hp} / {followedRow.maxHp} HP
                    </span>
                  </div>

                  <progress
                    className="spectator-hp-bar"
                    aria-label={`${followedRow.displayName} health`}
                    value={followedRow.hp}
                    max={Math.max(1, followedRow.maxHp)}
                    style={{ "--spec-hp-fill": followedHpColor } as CSSProperties}
                  />

                  {visibleCards.length > 0 && (
                    <div className="spectator-cards" aria-label="Equipped upgrade cards">
                      {visibleCards.map((owned) => {
                        const def = getCardDefinition(owned.cardId);
                        if (!def) return null;
                        return (
                          <span
                            key={owned.cardId}
                            className={`spectator-card-pill spectator-card-pill--${def.rarity}`}
                            title={`${def.name} Lv.${owned.level}: ${def.statSummary(owned.level)}`}
                          >
                            <span aria-hidden="true">{def.icon}</span>
                            <span className="spectator-card-pill__name">{def.name}</span>
                            <span className="spectator-card-pill__lvl">L{owned.level}</span>
                          </span>
                        );
                      })}
                      {hiddenCardCount > 0 && (
                        <span className="spectator-card-pill spectator-card-pill--more">
                          +{hiddenCardCount}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="spectator-target__empty">
                  No active combatants — waiting for next round...
                </div>
              )}
            </div>

            <button
              type="button"
              className="spectator-cycle-btn"
              disabled={aliveIds.length <= 1}
              onClick={() => cycleTarget(1, aliveIds)}
            >
              Next <span className="spectator-cycle-btn__hint">(RMB)</span>
            </button>
          </div>
        ) : (
          <div className="spectator-freefly-hint">
            {showTouchControls
              ? "Drag screen to look around • Tap Free-Fly Drone button to return to Follow Cam"
              : "WASD Move • Space Up • Ctrl Down • F / Button Switch Mode"}
          </div>
        )}
      </section>
    </div>
  );
}
