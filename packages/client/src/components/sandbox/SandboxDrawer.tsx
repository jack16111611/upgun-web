import { useEffect, useState, type FormEvent } from "react";
import { MAX_COMBAT_BOTS, type CheatCodeId, type OwnedCard } from "@upgun/shared";
import { CardArmoryPicker } from "./CardArmoryPicker";
import { parseCheatCodeInput } from "./cheatCodeListener";
import "./sandbox.css";

export interface SandboxDrawerProps {
  cheatsEnabled: boolean;
  isOpen: boolean;
  onClose: () => void;
  godMode: boolean;
  infiniteMode: boolean;
  moonGravity: boolean;
  bigHead: boolean;
  botCount: number;
  ownedCards: readonly OwnedCard[];
  onSendCheat: (code: CheatCodeId) => void;
  onGrantCard: (cardId: string) => void;
  onAddBot: () => void;
}

interface CheatTileConfig {
  code: CheatCodeId;
  label: string;
  description: string;
  mode: "toggle" | "action";
  active: boolean;
  disabled?: boolean;
  badgeText?: string;
}

interface FeedbackToast {
  tone: "ok" | "err";
  text: string;
}

export function SandboxDrawer({
  cheatsEnabled,
  isOpen,
  onClose,
  godMode,
  infiniteMode,
  moonGravity,
  bigHead,
  botCount,
  ownedCards,
  onSendCheat,
  onGrantCard,
  onAddBot,
}: SandboxDrawerProps) {
  const [codeInput, setCodeInput] = useState("");
  const [toast, setToast] = useState<FeedbackToast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!cheatsEnabled || !isOpen) {
    return null;
  }

  const botsFull = botCount >= MAX_COMBAT_BOTS;

  const cheatTiles: readonly CheatTileConfig[] = [
    {
      code: "IDDQD",
      label: "God Mode",
      description: "Invincible HP & no damage",
      mode: "toggle",
      active: godMode,
    },
    {
      code: "INFINITE",
      label: "Infinite Power",
      description: "Unlimited ammo & zero CDs",
      mode: "toggle",
      active: infiniteMode,
    },
    {
      code: "UPGUNMAX",
      label: "UpGun Max",
      description: "Max owned cards (or 5 Epics)",
      mode: "action",
      active: false,
      badgeText: "BOOST",
    },
    {
      code: "MOON",
      label: "Moon Gravity",
      description: "Low-gravity 0.35x jumps",
      mode: "toggle",
      active: moonGravity,
    },
    {
      code: "BIGHEAD",
      label: "Big Head Mode",
      description: "Giant 2.5x robot heads",
      mode: "toggle",
      active: bigHead,
    },
    {
      code: "BOTARMY",
      label: "Bot Army",
      description: "Deploy extra AI combat bot",
      mode: "action",
      active: botCount > 0,
      disabled: botsFull,
      badgeText: botsFull ? "MAX" : `${botCount}/${MAX_COMBAT_BOTS}`,
    },
  ];

  const triggerCheat = (code: CheatCodeId): void => {
    onSendCheat(code);
    setToast({ tone: "ok", text: `Activated cheat: ${code}` });
  };

  const handleSubmitCode = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsed = parseCheatCodeInput(codeInput);
    if (!parsed) {
      setToast({
        tone: "err",
        text: `Unknown code "${codeInput.trim() || "(empty)"}". Try IDDQD, INFINITE, UPGUNMAX, MOON, BIGHEAD, BOTARMY.`,
      });
      return;
    }
    triggerCheat(parsed);
    setCodeInput("");
  };

  return (
    <div
      className="sandbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sandbox-drawer-title"
      onClick={onClose}
    >
      <div className="sandbox-panel" onClick={(e) => e.stopPropagation()}>
        <header className="sandbox-header">
          <div>
            <p className="sandbox-kicker">SOLO SANDBOX CONSOLE</p>
            <h2 id="sandbox-drawer-title" className="sandbox-title">
              Cheats &amp; Card Armory
            </h2>
          </div>
          <div className="sandbox-header-actions">
            <button
              type="button"
              className="btn btn--practice sandbox-bot-btn"
              disabled={botsFull}
              onClick={onAddBot}
            >
              + Bot ({botCount}/{MAX_COMBAT_BOTS})
            </button>
            <button
              type="button"
              className="btn btn--secondary sandbox-close-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <section className="sandbox-section" aria-label="Cheat Code Input">
          <form className="sandbox-code-form" onSubmit={handleSubmitCode}>
            <input
              type="text"
              className="text-input sandbox-code-input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter cheat code (IDDQD, INFINITE, UPGUNMAX, MOON, BIGHEAD, BOTARMY)"
              aria-label="Cheat code"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn btn--primary sandbox-submit-btn">
              Submit
            </button>
          </form>
          {toast && (
            <p
              className={`sandbox-toast sandbox-toast--${toast.tone}`}
              role="status"
              aria-live="polite"
            >
              {toast.text}
            </p>
          )}
        </section>

        <section className="sandbox-section" aria-label="Quick Cheat Toggles">
          <div className="sandbox-section-head">
            <h3 className="sandbox-section-title">Quick Cheats</h3>
            <span className="sandbox-section-hint">
              Or type any code directly during gameplay
            </span>
          </div>
          <div className="sandbox-cheat-grid">
            {cheatTiles.map((tile) => {
              const badge = tile.badgeText ?? (tile.active ? "ON" : "OFF");
              const isToggleOn = tile.mode === "toggle" && tile.active;
              return (
                <button
                  key={tile.code}
                  type="button"
                  className={`sandbox-cheat-btn ${isToggleOn ? "sandbox-cheat-btn--on" : ""}`}
                  disabled={tile.disabled}
                  aria-pressed={tile.mode === "toggle" ? tile.active : undefined}
                  onClick={() => triggerCheat(tile.code)}
                >
                  <div className="sandbox-cheat-top">
                    <span className="sandbox-cheat-code">{tile.code}</span>
                    <span
                      className={`sandbox-badge ${
                        isToggleOn
                          ? "sandbox-badge--on"
                          : tile.mode === "action"
                            ? "sandbox-badge--action"
                            : "sandbox-badge--off"
                      }`}
                    >
                      {badge}
                    </span>
                  </div>
                  <strong className="sandbox-cheat-label">{tile.label}</strong>
                  <span className="sandbox-cheat-desc">{tile.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        <CardArmoryPicker ownedCards={ownedCards} onGrantCard={onGrantCard} />
      </div>
    </div>
  );
}
