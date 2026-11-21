import type { CSSProperties } from "react";
import { computePlayerStats, getGunGameTier } from "@upgun/shared";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";

export function HudCombatBar() {
  const gameMode = useGameStore((s) => s.gameMode);
  const weaponTier = useGameStore((s) => s.weaponTier);
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const overshield = useGameStore((s) => s.overshield);
  const ammo = useGameStore((s) => s.ammo);
  const magSize = useGameStore((s) => s.magSize);
  const isReloading = useGameStore((s) => s.isReloading);
  const dashCooldown = useGameStore((s) => s.dashCooldown);
  const grenadeCooldown = useGameStore((s) => s.grenadeCooldown);
  const meleeCooldown = useGameStore((s) => s.meleeCooldown);
  const godMode = useGameStore((s) => s.godMode);
  const infiniteMode = useGameStore((s) => s.infiniteMode);
  const ownedCards = useGameStore((s) => s.ownedCards);
  const showTouchControls = useSettingsStore((s) => s.showTouchControls);

  const localStats = computePlayerStats(ownedCards);
  const hpRatio = maxHp > 0 ? hp / maxHp : 0;
  const hpBarColor = hpRatio > 0.55 ? "#4ade80" : hpRatio > 0.25 ? "#facc15" : "#f87171";
  const dashReadyFraction = 1 - Math.min(1, dashCooldown / Math.max(0.1, localStats.dashCooldown));
  const grenadeReadyFraction =
    1 - Math.min(1, grenadeCooldown / Math.max(0.1, localStats.grenadeCooldown));
  const meleeReadyFraction =
    1 - Math.min(1, meleeCooldown / Math.max(0.1, localStats.meleeCooldown));

  const weaponLabel =
    gameMode === "gun_game"
      ? getGunGameTier(weaponTier).name.toUpperCase()
      : gameMode === "instagib"
        ? "INSTAGIB RAILGUN"
        : infiniteMode
          ? "RIFLE (∞)"
          : "RIFLE";

  return (
    <section className="hud-bottom" aria-label="Player combat status">
      <div className="hud-card hud-card--hp">
        <div className="hud-card-header">
          <label htmlFor="hud-hp-meter" className="hud-label">
            {godMode ? "HP (GOD)" : "HP"}
          </label>
          <span className="hud-value">
            {hp} / {maxHp}
            {overshield > 0 ? ` +${overshield}🛡` : ""}
          </span>
        </div>
        <progress
          id="hud-hp-meter"
          className="hud-progress"
          value={hp}
          max={maxHp}
          style={{ "--progress-bar-fill": overshield > 0 ? "#38bdf8" : hpBarColor } as CSSProperties}
        />
      </div>

      {!showTouchControls && (
        <div className="hud-abilities">
          <div className={`hud-pill ${dashCooldown <= 0 ? "hud-pill--ready" : "hud-pill--cooling"}`}>
            <div className="hud-pill-row">
              <span className="hud-key">SHIFT</span>
              <span className="hud-pill-name">Dash</span>
              <span className="hud-pill-timer">
                {dashCooldown <= 0 ? "READY" : `${dashCooldown.toFixed(1)}s`}
              </span>
            </div>
            <progress
              aria-label="Dash cooldown"
              className="hud-progress hud-progress--slim"
              value={dashReadyFraction}
              max={1}
              style={{ "--progress-bar-fill": "#38bdf8" } as CSSProperties}
            />
          </div>

          <div className={`hud-pill ${meleeCooldown <= 0 ? "hud-pill--ready" : "hud-pill--cooling"}`}>
            <div className="hud-pill-row">
              <span className="hud-key">V / E</span>
              <span className="hud-pill-name">Melee</span>
              <span className="hud-pill-timer">
                {meleeCooldown <= 0 ? "READY" : `${meleeCooldown.toFixed(1)}s`}
              </span>
            </div>
            <progress
              aria-label="Melee cooldown"
              className="hud-progress hud-progress--slim"
              value={meleeReadyFraction}
              max={1}
              style={{ "--progress-bar-fill": "#22d3ee" } as CSSProperties}
            />
          </div>

          {gameMode !== "instagib" && (
            <div className={`hud-pill ${grenadeCooldown <= 0 ? "hud-pill--ready" : "hud-pill--cooling"}`}>
              <div className="hud-pill-row">
                <span className="hud-key">G / Q</span>
                <span className="hud-pill-name">Grenade</span>
                <span className="hud-pill-timer">
                  {grenadeCooldown <= 0 ? "READY" : `${grenadeCooldown.toFixed(1)}s`}
                </span>
              </div>
              <progress
                aria-label="Grenade cooldown"
                className="hud-progress hud-progress--slim"
                value={grenadeReadyFraction}
                max={1}
                style={{ "--progress-bar-fill": "#fb923c" } as CSSProperties}
              />
            </div>
          )}
        </div>
      )}

      <div className="hud-card hud-card--ammo">
        <span className="hud-label">{weaponLabel}</span>
        <span className={`hud-ammo-value ${isReloading ? "hud-ammo-value--reloading" : ""}`}>
          {isReloading ? "RELOADING..." : infiniteMode ? `∞ / ${magSize}` : `${ammo} / ${magSize}`}
        </span>
      </div>
    </section>
  );
}
