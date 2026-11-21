import { getCardDefinition } from "@upgun/shared";
import { useGameStore } from "../store/gameStore";

export function MyCardsDrawer() {
  const cardsDrawerOpen = useGameStore((s) => s.cardsDrawerOpen);
  const ownedCards = useGameStore((s) => s.ownedCards);
  const status = useGameStore((s) => s.status);
  const setCardsDrawerOpen = useGameStore((s) => s.setCardsDrawerOpen);

  if (!cardsDrawerOpen || status !== "connected") {
    return null;
  }

  return (
    <aside
      className="my-cards-drawer"
      aria-label="My Collected Upgrade Cards"
    >
      <div className="my-cards-header">
        <div>
          <h2 className="my-cards-title">My Cards</h2>
          <p className="my-cards-sub">
            {ownedCards.length} active {ownedCards.length === 1 ? "upgrade" : "upgrades"}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary my-cards-close"
          onClick={() => setCardsDrawerOpen(false)}
        >
          Close
        </button>
      </div>

      {ownedCards.length === 0 ? (
        <p className="my-cards-empty">
          No upgrade cards yet. Finish a round to draft your first upgrade!
        </p>
      ) : (
        <ul className="my-cards-list">
          {ownedCards.map((owned) => {
            const def = getCardDefinition(owned.cardId);
            if (!def) {
              return null;
            }
            return (
              <li
                key={owned.cardId}
                className={`my-card-item my-card-item--${def.rarity}`}
              >
                <span className="my-card-icon" aria-hidden="true">
                  {def.icon}
                </span>
                <div className="my-card-body">
                  <div className="my-card-row">
                    <strong className="my-card-name">{def.name}</strong>
                    <span className="my-card-level">
                      LVL {owned.level} / {def.maxLevel}
                    </span>
                  </div>
                  <p className="my-card-stats">{def.statSummary(owned.level)}</p>
                  <p className="my-card-desc">{def.description(owned.level)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
