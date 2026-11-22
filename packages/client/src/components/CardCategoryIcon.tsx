import type { CardCategory, CardRarity } from "@upgun/shared";

export interface CardCategoryIconProps {
  category: CardCategory;
  cardId?: string;
  rarity?: CardRarity;
  size?: number;
  className?: string;
}

const RARITY_PALETTE: Record<CardRarity, { primary: string; accent: string; highlight: string }> = {
  common: { primary: "#cbd5e1", accent: "#64748b", highlight: "#f8fafc" },
  rare: { primary: "#38bdf8", accent: "#2563eb", highlight: "#bae6fd" },
  epic: { primary: "#fbbf24", accent: "#a855f7", highlight: "#fef08a" },
};

function renderSpecificCardGlyph(
  cardId: string,
  primary: string,
  accent: string,
  highlight: string,
) {
  const id = cardId.toLowerCase();

  if (id.includes("frost") || id.includes("ice") || id.includes("cryo")) {
    return (
      <g stroke={primary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6V42M6 24H42M11.3 11.3L36.7 36.7M36.7 11.3L11.3 36.7" />
        <path d="M20 10L24 14L28 10M20 38L24 34L28 38M10 20L14 24L10 28M38 20L34 24L38 28" stroke={highlight} strokeWidth="2" />
        <circle cx="24" cy="24" r="4.5" fill={accent} stroke={highlight} strokeWidth="1.8" />
      </g>
    );
  }

  if (id.includes("multishot") || id.includes("scatter") || id.includes("shotgun")) {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 24H20" stroke={accent} strokeWidth="3.5" />
        <path d="M20 24L39 12M20 24L41 24M20 24L39 36" stroke={primary} strokeWidth="2.8" />
        <circle cx="39" cy="12" r="3.2" fill={highlight} />
        <circle cx="41" cy="24" r="3.5" fill={highlight} />
        <circle cx="39" cy="36" r="3.2" fill={highlight} />
      </g>
    );
  }

  if (id.includes("ricochet") || id.includes("bounce")) {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 36L20 12L31 32L41 14" fill="none" stroke={primary} strokeWidth="3" />
        <path d="M35 13H41.5V19.5" fill="none" stroke={highlight} strokeWidth="2.6" />
        <circle cx="20" cy="12" r="3.2" fill={accent} stroke={highlight} strokeWidth="1.4" />
        <circle cx="31" cy="32" r="3.2" fill={accent} stroke={highlight} strokeWidth="1.4" />
      </g>
    );
  }

  if (id.includes("rail") || id.includes("pierce") || id.includes("laser")) {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 24H42" stroke={primary} strokeWidth="4.2" />
        <path d="M6 24H42" stroke={highlight} strokeWidth="1.6" />
        <path d="M21 11L27 24L21 37M31 14L36 24L31 34" fill="none" stroke={accent} strokeWidth="2.4" />
      </g>
    );
  }

  if (id.includes("gravity") || id.includes("vortex") || id.includes("black_hole")) {
    return (
      <g fill="none" strokeLinecap="round">
        <circle cx="24" cy="24" r="6" fill={accent} stroke={highlight} strokeWidth="2" />
        <path d="M24 8A16 16 0 0 1 40 24M24 40A16 16 0 0 1 8 24" stroke={primary} strokeWidth="2.8" />
        <path d="M33 13A12 12 0 0 1 35 33M15 35A12 12 0 0 1 13 15" stroke={highlight} strokeWidth="2" />
      </g>
    );
  }

  if (id.includes("vampir") || id.includes("blood") || id.includes("regen") || id.includes("second_wind")) {
    return (
      <g strokeLinejoin="round">
        <path
          d="M24 40C24 40 9 30.5 9 19.2C9 13.5 13.4 9.5 18.4 9.5C21.3 9.5 23.2 11 24 12.6C24.8 11 26.7 9.5 29.6 9.5C34.6 9.5 39 13.5 39 19.2C39 30.5 24 40 24 40Z"
          fill={accent}
          fillOpacity="0.35"
          stroke={primary}
          strokeWidth="2.8"
        />
        <path d="M24 18V29M18.5 23.5H29.5" stroke={highlight} strokeWidth="2.8" strokeLinecap="round" />
      </g>
    );
  }

  if (id.includes("melee") || id.includes("blade") || id.includes("katana") || id.includes("slash") || id.includes("knife")) {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 37L36 10L39 13L15 39L11 37Z" fill={primary} stroke={highlight} strokeWidth="1.6" />
        <path d="M10 30L18 38" stroke={accent} strokeWidth="3.2" />
        <path d="M7 41L13 35" stroke={highlight} strokeWidth="3" />
      </g>
    );
  }

  if (id.includes("burn") || id.includes("incendiary") || id.includes("explosive") || id.includes("cluster")) {
    return (
      <g strokeLinejoin="round">
        <path
          d="M24 6L28.5 16L39 12L34 22L42 28L31 30.5L32 41L24 34L16 41L17 30.5L6 28L14 22L9 12L19.5 16L24 6Z"
          fill={accent}
          fillOpacity="0.4"
          stroke={primary}
          strokeWidth="2.4"
        />
        <circle cx="24" cy="24" r="5.5" fill={highlight} />
      </g>
    );
  }

  return null;
}

function renderCategoryGlyph(
  category: CardCategory,
  primary: string,
  accent: string,
  highlight: string,
) {
  switch (category) {
    case "weapon":
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="13" fill="none" stroke={primary} strokeWidth="2.6" />
          <circle cx="24" cy="24" r="4.2" fill={accent} stroke={highlight} strokeWidth="1.8" />
          <path d="M24 6V14M24 34V42M6 24H14M34 24H42" stroke={highlight} strokeWidth="2.6" />
        </g>
      );

    case "grenade":
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <rect x="19" y="8" width="10" height="5" rx="1.5" fill={accent} stroke={highlight} strokeWidth="1.6" />
          <path d="M29 10.5C33.5 10.5 36 13 36 17" fill="none" stroke={highlight} strokeWidth="2.4" />
          <circle cx="24" cy="27" r="12" fill={accent} fillOpacity="0.34" stroke={primary} strokeWidth="2.8" />
          <path d="M15 24H33M15 30H33M24 15V39" stroke={primary} strokeWidth="1.8" opacity="0.8" />
          <circle cx="36" cy="17" r="2.2" fill={highlight} />
        </g>
      );

    case "mobility":
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M27 7L12 26H23L20 41L36 21H25L27 7Z"
            fill={accent}
            fillOpacity="0.38"
            stroke={primary}
            strokeWidth="2.6"
          />
          <path d="M7 18H13M6 24H10M35 30H41" stroke={highlight} strokeWidth="2.2" />
        </g>
      );

    case "survival":
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M24 7L38 12.5V23.5C38 32 32 37.8 24 41C16 37.8 10 32 10 23.5V12.5L24 7Z"
            fill={accent}
            fillOpacity="0.35"
            stroke={primary}
            strokeWidth="2.8"
          />
          <path d="M24 16V30M17 23H31" stroke={highlight} strokeWidth="3" />
        </g>
      );

    case "chaos":
    default:
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M24 6L28.5 18.5L41 24L28.5 29.5L24 42L19.5 29.5L7 24L19.5 18.5L24 6Z"
            fill={accent}
            fillOpacity="0.38"
            stroke={primary}
            strokeWidth="2.5"
          />
          <circle cx="24" cy="24" r="4.5" fill={highlight} />
          <circle cx="11" cy="11" r="2.2" fill={highlight} />
          <circle cx="37" cy="37" r="2.2" fill={highlight} />
        </g>
      );
  }
}

export function CardCategoryIcon({
  category,
  cardId,
  rarity = "common",
  size = 48,
  className = "",
}: CardCategoryIconProps) {
  const palette = RARITY_PALETTE[rarity];
  const specific = cardId
    ? renderSpecificCardGlyph(cardId, palette.primary, palette.accent, palette.highlight)
    : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {specific ?? renderCategoryGlyph(category, palette.primary, palette.accent, palette.highlight)}
    </svg>
  );
}
