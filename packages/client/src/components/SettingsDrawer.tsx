import { useState, type CSSProperties } from "react";
import type { AimAssistPreset } from "../input/aimAssist";
import { requestGyroPermission } from "../input/gyroInput";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { useHudLayoutStore } from "./mobile";

const DEVICE_LABELS = {
  desktop: "Desktop (Mouse + Keyboard)",
  mobile: "Mobile Touch",
  gamepad: "Gamepad Controller",
} as const;

const AIM_ASSIST_OPTIONS: readonly { id: AimAssistPreset; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "standard", label: "Standard" },
  { id: "strong", label: "Strong" },
];

export function SettingsDrawer() {
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const activeDevice = useGameStore((s) => s.activeDevice);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const setLobbyOpen = useGameStore((s) => s.setLobbyOpen);

  const mouseSensitivity = useSettingsStore((s) => s.mouseSensitivity);
  const showTouchControls = useSettingsStore((s) => s.showTouchControls);
  const audioVolume = useSettingsStore((s) => s.audioVolume);
  const audioMuted = useSettingsStore((s) => s.audioMuted);
  const aimAssistPreset = useSettingsStore((s) => s.aimAssistPreset);
  const autoFireEnabled = useSettingsStore((s) => s.autoFireEnabled);
  const gyroEnabled = useSettingsStore((s) => s.gyroEnabled);
  const gyroSensitivityX = useSettingsStore((s) => s.gyroSensitivityX);
  const gyroSensitivityY = useSettingsStore((s) => s.gyroSensitivityY);
  const gyroInvertY = useSettingsStore((s) => s.gyroInvertY);

  const setMouseSensitivity = useSettingsStore((s) => s.setMouseSensitivity);
  const setShowTouchControls = useSettingsStore((s) => s.setShowTouchControls);
  const setAudioVolume = useSettingsStore((s) => s.setAudioVolume);
  const setAudioMuted = useSettingsStore((s) => s.setAudioMuted);
  const setAimAssistPreset = useSettingsStore((s) => s.setAimAssistPreset);
  const setAutoFireEnabled = useSettingsStore((s) => s.setAutoFireEnabled);
  const setGyroEnabled = useSettingsStore((s) => s.setGyroEnabled);
  const setGyroSensitivityX = useSettingsStore((s) => s.setGyroSensitivityX);
  const setGyroSensitivityY = useSettingsStore((s) => s.setGyroSensitivityY);
  const setGyroInvertY = useSettingsStore((s) => s.setGyroInvertY);
  const setEditorOpen = useHudLayoutStore((s) => s.setEditorOpen);

  const [gyroStatus, setGyroStatus] = useState<string | null>(null);

  if (!settingsOpen) {
    return null;
  }

  const sliderStyle = (val: number, min: number, max: number) =>
    ({
      "--attr-min": String(min),
      "--attr-max": String(max),
      "--control-value": String(val),
    }) as CSSProperties;

  const handleToggleGyro = async (checked: boolean) => {
    if (!checked) {
      setGyroEnabled(false);
      setGyroStatus(null);
      return;
    }
    const granted = await requestGyroPermission();
    if (granted) {
      setGyroEnabled(true);
      setGyroStatus(null);
    } else {
      setGyroEnabled(false);
      setGyroStatus("Motion sensor permission denied or unavailable on this browser.");
    }
  };

  const handleOpenCustomizer = () => {
    setSettingsOpen(false);
    setLobbyOpen(false);
    setEditorOpen(true);
  };

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
            style={sliderStyle(mouseSensitivity, 0.25, 3)}
            onChange={(e) => setMouseSensitivity(Number(e.target.value))}
          />
        </div>

        <div className="field-group">
          <span className="field-label">Magnetic Aim Assist</span>
          <div className="settings-segmented" role="radiogroup" aria-label="Magnetic Aim Assist">
            {AIM_ASSIST_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={aimAssistPreset === opt.id}
                className={`settings-seg-btn ${aimAssistPreset === opt.id ? "settings-seg-btn--active" : ""}`}
                onClick={() => setAimAssistPreset(opt.id, true)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="field-hint">
            Magnetic target pull (12° cone), 45% aim slowdown bubble, and strafe tracking.
          </span>
        </div>

        <label className="settings-toggle-row" htmlFor="auto-fire-toggle">
          <span className="settings-toggle-text">
            <span className="field-label">Auto-Fire on Target Lock</span>
            <span className="field-hint">
              Automatically fire controlled bursts when crosshair locks onto a visible enemy
            </span>
          </span>
          <input
            id="auto-fire-toggle"
            type="checkbox"
            className="settings-checkbox"
            checked={autoFireEnabled}
            onChange={(e) => setAutoFireEnabled(e.target.checked)}
          />
        </label>

        <label className="settings-toggle-row" htmlFor="gyro-toggle">
          <span className="settings-toggle-text">
            <span className="field-label">Gyroscope Aiming (Android / iOS)</span>
            <span className="field-hint">
              Landscape-compensated tilt aiming (requests iOS Motion permission when enabled)
            </span>
          </span>
          <input
            id="gyro-toggle"
            type="checkbox"
            className="settings-checkbox"
            checked={gyroEnabled}
            onChange={(e) => void handleToggleGyro(e.target.checked)}
          />
        </label>
        {gyroStatus && <p className="field-hint settings-warn">{gyroStatus}</p>}

        {gyroEnabled && (
          <div className="settings-gyro-panel">
            <div className="field-group">
              <div className="slider-header">
                <label htmlFor="gyro-sens-x" className="field-label">
                  Gyro Horizontal Sensitivity
                </label>
                <span className="slider-readout">{gyroSensitivityX.toFixed(2)}x</span>
              </div>
              <input
                id="gyro-sens-x"
                type="range"
                className="range-slider"
                min="0.25"
                max="3"
                step="0.05"
                value={gyroSensitivityX}
                style={sliderStyle(gyroSensitivityX, 0.25, 3)}
                onChange={(e) => setGyroSensitivityX(Number(e.target.value))}
              />
            </div>

            <div className="field-group">
              <div className="slider-header">
                <label htmlFor="gyro-sens-y" className="field-label">
                  Gyro Vertical Sensitivity
                </label>
                <span className="slider-readout">{gyroSensitivityY.toFixed(2)}x</span>
              </div>
              <input
                id="gyro-sens-y"
                type="range"
                className="range-slider"
                min="0.25"
                max="3"
                step="0.05"
                value={gyroSensitivityY}
                style={sliderStyle(gyroSensitivityY, 0.25, 3)}
                onChange={(e) => setGyroSensitivityY(Number(e.target.value))}
              />
            </div>

            <label className="settings-toggle-row" htmlFor="gyro-invert-toggle">
              <span className="field-label">Invert Gyro Y-Axis</span>
              <input
                id="gyro-invert-toggle"
                type="checkbox"
                className="settings-checkbox"
                checked={gyroInvertY}
                onChange={(e) => setGyroInvertY(e.target.checked)}
              />
            </label>
          </div>
        )}

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
            style={sliderStyle(audioVolume, 0, 1)}
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
              Enable PUBG-style icon-only mobile controls & virtual joystick
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

        <button type="button" className="btn btn--accent" onClick={handleOpenCustomizer}>
          Customize Controls Layout
        </button>

        <div className="settings-device-info">
          <span className="field-label">Active Input Device</span>
          <span className="settings-device-value">{DEVICE_LABELS[activeDevice]}</span>
        </div>

        <div className="settings-bindings">
          <p className="field-hint">
            Desktop: WASD Move • Space Double-Jump • Shift / RMB Dash • LMB Fire • V / E / MMB Melee • G / Q Grenade • R Reload • Tab Scoreboard
          </p>
          <p className="field-hint">
            Gamepad: Left Stick Move • Right Stick Aim • RT Fire • LT / RB Dash • B Melee • LB Grenade • A Jump • X Reload
          </p>
        </div>
      </div>
    </div>
  );
}
