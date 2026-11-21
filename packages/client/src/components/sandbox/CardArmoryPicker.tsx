import { useMemo, useState } from "react";
import { ALL_CARDS, type CardCategory, type OwnedCard } from "@upgun/shared";

export interface CardArmoryPickerProps {
  ownedCards: readonly OwnedCard[];
  onGrantCard: (cardId: string) => void;
}

type CategoryFilter = "all" | CardCategory;

const CATEGORY_FILTERS: readonly { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "weapon", label: "Weapon" },
  { id: "grenade", label: "Grenade" },
  { id: "mobility", label: "Mobility" },
  { id: "survival", label: "Survival" },
  { id: "chaos", label: "Chaos" },
] as const;

export function CardArmoryPicker({
  ownedCards,
  onGrantCard,
}: CardArmoryPickerProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const ownedLevelMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of ownedCards) {
      map.set(card.cardId, card.level);
    }
    return map;
  }, [ownedCards]);

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_CARDS.filter((card) => {
      if (category !== "all" && card.category !== category) {
        return false;
      }
      if (!query) {
        return true;
      }
      const level = Math.max(1, ownedLevelMap.get(card.id) ?? 0);
      return (
        card.name.toLowerCase().includes(query) ||
        card.id.toLowerCase().includes(query) ||
        card.category.toLowerCase().includes(query) ||
        card.rarity.toLowerCase().includes(query) ||
        card.description(level).toLowerCase().includes(query)
      );
    });
  }, [category, searchQuery, ownedLevelMap]);

  return (
    <section className="sandbox-section sandbox-armory" aria-label="Card Armory Picker">
      <div className="sandbox-section-head">
        <h3 className="sandbox-section-title">
          Card Armory ({filteredCards.length} / {ALL_CARDS.length})
        </h3>
        <span className="sandbox-section-hint">
          Click any card to grant or upgrade (+1 level)
        </span>
      </div>

      <div className="sandbox-armory-controls">
        <div className="sandbox-pills" role="tablist" aria-label="Card Categories">
          {CATEGORY_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={`sandbox-pill ${category === item.id ? "sandbox-pill--active" : ""}`}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="text-input sandbox-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cards..."
          aria-label="Search armory cards"
        />
      </div>

      <div className="sandbox-card-grid">
        {filteredCards.length === 0 ? (
          <p className="sandbox-empty">No cards match your filter.</p>
        ) : (
          filteredCards.map((card) => {
            const level = ownedLevelMap.get(card.id) ?? 0;
            const isMaxed = level >= card.maxLevel;
            const previewLevel = Math.max(1, level);
            return (
              <button
                key={card.id}
                type="button"
                disabled={isMaxed}
                className={`sandbox-armory-card sandbox-armory-card--${card.rarity} ${
                  level > 0 ? "sandbox-armory-card--owned" : ""
                }`}
                onClick={() => onGrantCard(card.id)}
              >
                <div className="sandbox-armory-card-top">
                  <span className="sandbox-armory-icon" aria-hidden="true">
                    {card.icon}
                  </span>
                  <span
                    className={`sandbox-level-badge ${
                      isMaxed
                        ? "sandbox-level-badge--max"
                        : level > 0
                          ? "sandbox-level-badge--owned"
                          : ""
                    }`}
                  >
                    {level}/{card.maxLevel}
                  </span>
                </div>
                <strong className="sandbox-armory-name">{card.name}</strong>
                <span className="sandbox-armory-meta">
                  {card.category} &bull; {card.rarity}
                </span>
                <span className="sandbox-armory-stat">
                  {card.statSummary(previewLevel)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
