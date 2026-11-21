import type { CSSProperties } from "react";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";

const DEVICE_LABELS = {
  desktop: "Desktop (Mouse + Keyboard)",
  mobile: "Mobile Touch",
  gamepad: "Gamepad Controller",
} as const;

export function SettingsDrawer() {
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const activeDevice = useGameStore((s) => s.activeDevice);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);

  const mouseSensitivity = useSettingsStore((s) => s.mouseSensitivity);
  const showTouchControls = useSettingsStore((s) => s.showTouchControls);
  const audioVolume = useSettingsStore((s) => s.audioVolume);
  const audioMuted = useSettingsStore((s) => s.audioMuted);
  const setMouseSensitivity = useSettingsStore((s) => s.setMouseSensitivity);
  const setShowTouchControls = useSettingsStore((s) => s.setShowTouchControls);
  const setAudioVolume = useSettingsStore((s) => s.setAudioVolume);
  const setAudioMuted = useSettingsStore((s) => s.setAudioMuted);

  if (!settingsOpen) {
    return null;
  }

  const sliderStyle = {
    "--attr-min": "0.25",
    "--attr-max": "3",
    "--control-value": String(mouseSensitivity),
  } as CSSProperties;

  const volumeSliderStyle = {
    "--attr-min": "0",
    "--attr-max": "1",
    "--control-value": String(audioVolume),
  } as CSSProperties;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="panel-card settings-card">
        <div className="panel-header">
          <h2 id="settings-title" className="panel-title">
            Controls & Settings
          </h2>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setSettingsOpen(false)}
          >
            Done
          </button>
        </div>

        <div className="field-group">
          <div className="slider-header">
            <label htmlFor="mouse-sensitivity" className="field-label">
              Mouse / Aim Sensitivity
            </label>
            <span className="slider-readout">{mouseSensitivity.toFixed(2)}x</span>
          </div>
          <input
            id="mouse-sensitivity"
            type="range"
            className="range-slider"
            min="0.25"
            max="3"
            step="0.05"
            value={mouseSensitivity}
            aria-valuetext={`${mouseSensitivity.toFixed(2)}x sensitivity`}
            style={sliderStyle}
            onChange={(e) => setMouseSensitivity(Number(e.target.value))}
          />
        </div>

        <div className="field-group">
          <div className="slider-header">
            <label htmlFor="audio-volume" className="field-label">
              Master Sound Volume
            </label>
            <span className="slider-readout">
              {audioMuted ? "Muted" : `${Math.round(audioVolume * 100)}%`}
            </span>
          </div>
          <input
            id="audio-volume"
            type="range"
            className="range-slider"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            disabled={audioMuted}
            aria-valuetext={`${Math.round(audioVolume * 100)}% volume`}
            style={volumeSliderStyle}
            onChange={(e) => setAudioVolume(Number(e.target.value))}
          />
        </div>

        <label className="settings-toggle-row" htmlFor="mute-audio-toggle">
          <span className="settings-toggle-text">
            <span className="field-label">Mute All Audio</span>
            <span className="field-hint">
              Silence procedural rifle, explosion, dash, and draft SFX
            </span>
          </span>
          <input
            id="mute-audio-toggle"
            type="checkbox"
            className="settings-checkbox"
            checked={audioMuted}
            onChange={(e) => setAudioMuted(e.target.checked)}
          />
        </label>

        <label className="settings-toggle-row" htmlFor="show-touch-toggle">
          <span className="settings-toggle-text">
            <span className="field-label">Show Touch Controls</span>
            <span className="field-hint">
              Enable virtual joystick and thumb action buttons on desktop
            </span>
          </span>
          <input
            id="show-touch-toggle"
            type="checkbox"
            className="settings-checkbox"
            checked={showTouchControls}
            onChange={(e) => setShowTouchControls(e.target.checked)}
          />
        </label>

        <div className="settings-device-info">
          <span className="field-label">Active Input Device</span>
          <span className="settings-device-value">{DEVICE_LABELS[activeDevice]}</span>
        </div>

        <div className="settings-bindings">
          <p className="field-hint">
            Desktop: WASD Move • Space Double-Jump • Shift / RMB Dash • LMB Fire • G / Q Grenade • R Reload • Tab Scoreboard
          </p>
          <p className="field-hint">
            Gamepad: Left Stick Move • Right Stick Aim • RT Fire • LT / RB Dash • LB Grenade • A Jump • X Reload
          </p>
        </div>
      </div>
    </div>
  );
}
