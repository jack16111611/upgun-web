import { ROBOT_BODY_COLORS, type HatId } from "@upgun/shared";
import "./cosmetics.css";

export interface CosmeticsPickerProps {
  hatId: HatId;
  bodyColor: string;
  onSelectHat: (hat: HatId) => void;
  onSelectColor: (color: string) => void;
}

interface HatOption {
  id: HatId;
  label: string;
}

const HAT_OPTIONS: readonly HatOption[] = [
  { id: "none", label: "None" },
  { id: "crown", label: "Crown" },
  { id: "tophat", label: "Top Hat" },
  { id: "viking", label: "Viking" },
  { id: "antenna", label: "Antenna" },
] as const;

function HatIcon({ hatId }: { hatId: HatId }) {
  switch (hatId) {
    case "crown":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 12L3.5 5L6.5 8.5L8 4L9.5 8.5L12.5 5L14 12H2Z"
            fill="#fbbf24"
            stroke="#fde68a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "tophat":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="4.5" y="3" width="7" height="8" rx="1" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
          <rect x="4.5" y="8.5" width="7" height="2" fill="#38bdf8" />
          <rect x="2" y="11" width="12" height="2" rx="1" fill="#cbd5e1" />
        </svg>
      );
    case "viking":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 11A4 4 0 0 1 12 11H4Z" fill="#94a3b8" />
          <path d="M4 9C2 8.5 1.5 6 2.5 4.5" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 9C14 8.5 14.5 6 13.5 4.5" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "antenna":
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 12L4.5 5.5M10 12L11.5 5.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4.5" cy="4.5" r="2" fill="#22d3ee" />
          <circle cx="11.5" cy="4.5" r="2" fill="#22d3ee" />
          <rect x="4" y="11.5" width="8" height="2" rx="1" fill="#475569" />
        </svg>
      );
    case "none":
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 11.5L11.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function RobotPreviewBadge({ bodyColor, hatId }: { bodyColor: string; hatId: HatId }) {
  return (
    <div className="cosmetics-picker__badge" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
        {/* Hat Layer */}
        {hatId === "crown" && (
          <path
            d="M14 14L15.5 7L19.5 10.5L22 6L24.5 10.5L28.5 7L30 14H14Z"
            fill="#fbbf24"
            stroke="#fde68a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        )}
        {hatId === "tophat" && (
          <g>
            <rect x="16" y="4" width="12" height="9" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <rect x="16" y="10.5" width="12" height="2.2" fill="#38bdf8" />
            <rect x="12" y="12.5" width="20" height="2.2" rx="1" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" />
          </g>
        )}
        {hatId === "viking" && (
          <g>
            <path d="M13 15A9 7 0 0 1 31 15H13Z" fill="#94a3b8" />
            <path d="M13 13C9 12 8.5 8 10 6" stroke="#fef3c7" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M31 13C35 12 35.5 8 34 6" stroke="#fef3c7" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        )}
        {hatId === "antenna" && (
          <g>
            <path d="M18 14L15.5 7.5M26 14L28.5 7.5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="15.5" cy="6.5" r="2.4" fill="#22d3ee" />
            <circle cx="28.5" cy="6.5" r="2.4" fill="#22d3ee" />
          </g>
        )}

        {/* Robot Head */}
        <rect x="13" y="14" width="18" height="14" rx="3.5" fill={bodyColor} stroke="#0f172a" strokeWidth="1.4" />
        {/* Glowing Neon Visor */}
        <rect x="16" y="18.5" width="12" height="4.8" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />

        {/* Robot Shoulders & Chest Core */}
        <rect x="10" y="30" width="24" height="10" rx="3.5" fill={bodyColor} stroke="#0f172a" strokeWidth="1.4" />
        <rect x="17" y="32.5" width="10" height="4.5" rx="1.5" fill="#0f172a" />
        <rect x="19" y="34" width="6" height="1.8" rx="0.9" fill="#38bdf8" />
      </svg>
    </div>
  );
}

export function CosmeticsPicker({
  hatId,
  bodyColor,
  onSelectHat,
  onSelectColor,
}: CosmeticsPickerProps) {
  const activeColorName =
    ROBOT_BODY_COLORS.find((c) => c.hex.toLowerCase() === bodyColor.toLowerCase())?.name ??
    "Custom";
  const activeHatLabel =
    HAT_OPTIONS.find((h) => h.id === hatId)?.label ?? "None";

  return (
    <section className="cosmetics-picker" aria-label="Robot Customizer">
      <div className="cosmetics-picker__header">
        <div className="cosmetics-picker__preview-row">
          <RobotPreviewBadge bodyColor={bodyColor} hatId={hatId} />
          <div className="cosmetics-picker__meta">
            <span className="cosmetics-picker__title">Robot Customizer</span>
            <span className="cosmetics-picker__summary">
              {activeColorName} &bull; {activeHatLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="cosmetics-picker__section">
        <span className="cosmetics-picker__label">Headgear</span>
        <div className="cosmetics-picker__hats" role="group" aria-label="Select robot hat">
          {HAT_OPTIONS.map((option) => {
            const isActive = option.id === hatId;
            return (
              <button
                key={option.id}
                type="button"
                className={`cosmetics-hat-pill ${isActive ? "cosmetics-hat-pill--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => onSelectHat(option.id)}
              >
                <HatIcon hatId={option.id} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cosmetics-picker__section">
        <span className="cosmetics-picker__label">Chassis Color</span>
        <div className="cosmetics-picker__colors" role="group" aria-label="Select robot body color">
          {ROBOT_BODY_COLORS.map((swatch) => {
            const isActive = swatch.hex.toLowerCase() === bodyColor.toLowerCase();
            return (
              <button
                key={swatch.id}
                type="button"
                className={`cosmetics-color-swatch ${isActive ? "cosmetics-color-swatch--active" : ""}`}
                style={{ backgroundColor: swatch.hex }}
                title={swatch.name}
                aria-label={swatch.name}
                aria-pressed={isActive}
                onClick={() => onSelectColor(swatch.hex)}
              >
                {isActive && <span className="cosmetics-color-swatch__dot" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
