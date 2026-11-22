import { useRef } from "react";
import {
  HUD_CONTROL_IDS,
  HUD_CONTROL_META,
  useHudLayoutStore,
  type HudControlId,
  type HudLayoutPreset,
} from "./hudLayoutStore";
import { ControlIconById } from "./MobileCombatIcons";

const PRESET_LABELS: readonly { id: HudLayoutPreset; label: string }[] = [
  { id: "two_thumb", label: "2-Thumb" },
  { id: "three_claw", label: "3-Claw" },
  { id: "four_claw", label: "4-Claw" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function HudLayoutEditor() {
  const editorOpen = useHudLayoutStore((s) => s.editorOpen);
  const preset = useHudLayoutStore((s) => s.preset);
  const controls = useHudLayoutStore((s) => s.controls);
  const selectedControl = useHudLayoutStore((s) => s.selectedControl);
  const setEditorOpen = useHudLayoutStore((s) => s.setEditorOpen);
  const setSelectedControl = useHudLayoutStore((s) => s.setSelectedControl);
  const updateControl = useHudLayoutStore((s) => s.updateControl);
  const applyPreset = useHudLayoutStore((s) => s.applyPreset);
  const resetLayout = useHudLayoutStore((s) => s.resetLayout);

  const dragRef = useRef<{
    id: HudControlId;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  if (!editorOpen) {
    return null;
  }

  const activeId: HudControlId = selectedControl ?? "firePrimary";
  const activePlacement = controls[activeId];
  const activeMeta = HUD_CONTROL_META[activeId];

  const handleControlPointerDown = (
    id: HudControlId,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedControl(id);

    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const current = controls[id];
    const centerX = (current.x / 100) * vw;
    const centerY = (current.y / 100) * vh;

    dragRef.current = {
      id,
      pointerId: e.pointerId,
      offsetX: e.clientX - centerX,
      offsetY: e.clientY - centerY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleControlPointerMove = (
    id: HudControlId,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== e.pointerId) {
      return;
    }
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const nextX = clamp(((e.clientX - drag.offsetX) / vw) * 100, 4, 96);
    const nextY = clamp(((e.clientY - drag.offsetY) / vh) * 100, 8, 92);
    updateControl(id, { x: nextX, y: nextY });
  };

  const handleControlPointerUp = (
    id: HudControlId,
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== e.pointerId) {
      return;
    }
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className="hud-editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="HUD Controls Layout Editor"
    >
      <div className="hud-editor-grid" aria-hidden="true" />

      {/* Top Glassmorphism Customization Dock */}
      <div className="hud-editor-dock" onPointerDown={(e) => e.stopPropagation()}>
        <div className="hud-editor-row">
          <div className="hud-editor-presets" role="group" aria-label="Control presets">
            {PRESET_LABELS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`hud-editor-pill ${preset === item.id ? "hud-editor-pill--active" : ""}`}
                onClick={() => applyPreset(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hud-editor-actions">
            <button
              type="button"
              className="hud-editor-btn hud-editor-btn--ghost"
              onClick={() => resetLayout()}
            >
              Reset
            </button>
            <button
              type="button"
              className="hud-editor-btn hud-editor-btn--primary"
              onClick={() => setEditorOpen(false)}
            >
              Save &amp; Done
            </button>
          </div>
        </div>

        <div className="hud-editor-tune">
          <span className="hud-editor-selected-tag">{activeMeta.name}</span>

          <label className="hud-editor-slider">
            <span>Scale {Math.round(activePlacement.scale * 100)}%</span>
            <input
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={activePlacement.scale}
              onChange={(e) =>
                updateControl(activeId, { scale: Number.parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="hud-editor-slider">
            <span>Opacity {Math.round(activePlacement.opacity * 100)}%</span>
            <input
              type="range"
              min={0.3}
              max={1.0}
              step={0.05}
              value={activePlacement.opacity}
              onChange={(e) =>
                updateControl(activeId, { opacity: Number.parseFloat(e.target.value) })
              }
            />
          </label>
        </div>
      </div>

      {/* Draggable Live Control Handles */}
      {HUD_CONTROL_IDS.map((id) => {
        const meta = HUD_CONTROL_META[id];
        const p = controls[id];
        const isSelected = activeId === id;
        const sizePx = Math.round(meta.baseSize * p.scale);
        const iconSize = Math.round(sizePx * (id === "joystick" ? 0.42 : 0.46));

        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            aria-label={`Drag ${meta.name}`}
            className={`hud-editor-handle ${meta.variantClass} ${isSelected ? "hud-editor-handle--selected" : ""}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${sizePx}px`,
              height: `${sizePx}px`,
              opacity: p.opacity,
            }}
            onPointerDown={(e) => handleControlPointerDown(id, e)}
            onPointerMove={(e) => handleControlPointerMove(id, e)}
            onPointerUp={(e) => handleControlPointerUp(id, e)}
            onPointerCancel={(e) => handleControlPointerUp(id, e)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedControl(id);
              }
            }}
          >
            <ControlIconById id={id} size={iconSize} />
            <span className="hud-editor-handle-tag">{meta.name}</span>
          </div>
        );
      })}
    </div>
  );
}
