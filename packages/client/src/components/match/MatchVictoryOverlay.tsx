import { useEffect, useRef } from "react";
import type { HatId } from "@upgun/shared";
import { ChampionPodiumCanvas } from "./ChampionPodiumCanvas";
import { playVictoryFanfare } from "./announcerSfx";
import "./match.css";

export interface MatchVictoryPlayer {
  sessionId: string;
  displayName: string;
  bodyColor: string;
  hatId: HatId;
  score: number;
  kills: number;
  meleeKills: number;
  cardCount: number;
  isBot: boolean;
}

export interface MatchVictoryOverlayProps {
  visible: boolean;
  champion: MatchVictoryPlayer | null;
  standings: readonly MatchVictoryPlayer[];
  nextMapName: string;
  onPlayAgain: () => void;
  onReturnLobby: () => void;
  soundGain?: number;
}

function CrownBadgeIcon() {
  return (
    <svg
      className="match-victory__crown-svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 18L5 8L9.5 12.5L12 5L14.5 12.5L19 8L21 18H3Z"
        fill="#fbbf24"
        stroke="#fef3c7"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="4" y="19.5" width="16" height="2" rx="1" fill="#f59e0b" />
    </svg>
  );
}

export function MatchVictoryOverlay({
  visible,
  champion,
  standings,
  nextMapName,
  onPlayAgain,
  onReturnLobby,
  soundGain = 0.3,
}: MatchVictoryOverlayProps) {
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      playVictoryFanfare(soundGain);
    }
    wasVisibleRef.current = visible;
  }, [visible, soundGain]);

  if (!visible) {
    return null;
  }

  const displayChampion = champion ?? standings[0] ?? null;

  return (
    <div
      className="match-victory-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-victory-heading"
    >
      <div className="match-victory-modal">
        <header className="match-victory__header">
          <div className="match-victory__badge">
            <CrownBadgeIcon />
            <span>MATCH CHAMPION</span>
          </div>

          <h2 id="match-victory-heading" className="match-victory__name">
            {displayChampion ? displayChampion.displayName : "Arena Champion"}
            {displayChampion?.isBot && (
              <span className="match-victory__bot-tag">BOT</span>
            )}
          </h2>

          {displayChampion && (
            <div className="match-victory__highlights">
              <span>{displayChampion.score} Round Wins</span>
              <span aria-hidden="true">&bull;</span>
              <span>{displayChampion.kills} Kills</span>
              <span aria-hidden="true">&bull;</span>
              <span>{displayChampion.meleeKills} Melee</span>
              <span aria-hidden="true">&bull;</span>
              <span>{displayChampion.cardCount} Cards</span>
            </div>
          )}
        </header>

        {displayChampion && (
          <ChampionPodiumCanvas
            bodyColor={displayChampion.bodyColor}
            hatId={displayChampion.hatId}
            isBot={displayChampion.isBot}
          />
        )}

        <section className="match-victory__stats" aria-label="Final Match Standings">
          <div className="match-victory__table-wrap">
            <table className="match-victory__table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Kills</th>
                  <th>Melee Kills</th>
                  <th>Cards Collected</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, index) => {
                  const rank = index + 1;
                  const isChamp =
                    displayChampion?.sessionId === player.sessionId || rank === 1;
                  return (
                    <tr
                      key={player.sessionId}
                      className={isChamp ? "match-victory__row--champ" : undefined}
                    >
                      <td className="match-victory__rank-cell">
                        <span
                          className={`match-victory__rank-pill ${
                            rank === 1 ? "match-victory__rank-pill--gold" : ""
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td>
                        <div className="match-victory__player-cell">
                          <span
                            className="match-victory__swatch"
                            style={{ backgroundColor: player.bodyColor }}
                            aria-hidden="true"
                          />
                          <span className="match-victory__player-name">
                            {player.displayName}
                          </span>
                          {player.isBot && (
                            <span className="match-victory__bot-tag">BOT</span>
                          )}
                        </div>
                      </td>
                      <td className="match-victory__num match-victory__score">
                        {player.score}
                      </td>
                      <td className="match-victory__num">{player.kills}</td>
                      <td className="match-victory__num">{player.meleeKills}</td>
                      <td className="match-victory__num">{player.cardCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="match-victory__actions">
          <button
            type="button"
            className="match-victory__btn match-victory__btn--primary"
            onClick={onPlayAgain}
          >
            <span className="match-victory__btn-main">Play Again</span>
            {nextMapName && (
              <span className="match-victory__btn-sub">Next Map: {nextMapName}</span>
            )}
          </button>

          <button
            type="button"
            className="match-victory__btn match-victory__btn--secondary"
            onClick={onReturnLobby}
          >
            Back to Lobby
          </button>
        </footer>
      </div>
    </div>
  );
}
