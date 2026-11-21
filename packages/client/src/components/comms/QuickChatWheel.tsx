import { useCallback, useEffect, useRef, useState } from "react";
import { QUICK_CHAT_CALLOUTS } from "@upgun/shared";
import { useCommsStore } from "./commsStore";
import "./comms.css";

export interface QuickChatWheelProps {
  enabled: boolean;
  showTouchButton?: boolean;
  onSelectCallout: (calloutId: string) => void;
}

const SLICE_COUNT = QUICK_CHAT_CALLOUTS.length;
const WHEEL_SIZE = 288;
const CENTER = WHEEL_SIZE / 2;
const OUTER_RADIUS = 134;
const INNER_RADIUS = 46;
const LABEL_RADIUS = 92;
const DEADZONE_PX = 20;

let chimeCtx: AudioContext | null = null;

function playQuickChatChime(): void {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return;
  }
  try {
    if (!chimeCtx || chimeCtx.state === "closed") {
      chimeCtx = new AudioContext();
    }
    if (chimeCtx.state === "suspended") {
      void chimeCtx.resume().catch(() => undefined);
    }
    const now = chimeCtx.currentTime;
    const notes = [659.25, 987.77];
    notes.forEach((freq, idx) => {
      if (!chimeCtx) {
        return;
      }
      const osc = chimeCtx.createOscillator();
      const gain = chimeCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(chimeCtx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.15);
    });
  } catch {
    // Audio playback may be blocked prior to gesture.
  }
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function describeSlicePath(index: number): string {
  const step = (Math.PI * 2) / SLICE_COUNT;
  const start = -Math.PI / 2 - step / 2 + index * step;
  const end = start + step;
  const ox1 = CENTER + OUTER_RADIUS * Math.cos(start);
  const oy1 = CENTER + OUTER_RADIUS * Math.sin(start);
  const ox2 = CENTER + OUTER_RADIUS * Math.cos(end);
  const oy2 = CENTER + OUTER_RADIUS * Math.sin(end);
  const ix1 = CENTER + INNER_RADIUS * Math.cos(end);
  const iy1 = CENTER + INNER_RADIUS * Math.sin(end);
  const ix2 = CENTER + INNER_RADIUS * Math.cos(start);
  const iy2 = CENTER + INNER_RADIUS * Math.sin(start);
  return [
    `M ${ox1.toFixed(2)} ${oy1.toFixed(2)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)}`,
    `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function getSliceIndexFromVector(dx: number, dy: number): number | null {
  if (Math.hypot(dx, dy) < DEADZONE_PX) {
    return null;
  }
  const step = (Math.PI * 2) / SLICE_COUNT;
  let angle = Math.atan2(dy, dx) + Math.PI / 2 + step / 2;
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return Math.floor(angle / step) % SLICE_COUNT;
}

export function QuickChatWheel({
  enabled,
  showTouchButton = false,
  onSelectCallout,
}: QuickChatWheelProps) {
  const quickChatOpen = useCommsStore((s) => s.quickChatOpen);
  const setQuickChatOpen = useCommsStore((s) => s.setQuickChatOpen);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedRef = useRef<number | null>(null);
  const openRef = useRef(false);
  const lockedDeltaRef = useRef({ x: 0, y: 0 });
  const holdKeyOpenRef = useRef(false);

  const updateSelected = useCallback((idx: number | null) => {
    selectedRef.current = idx;
    setSelectedIndex(idx);
  }, []);

  const closeWheel = useCallback(() => {
    openRef.current = false;
    holdKeyOpenRef.current = false;
    lockedDeltaRef.current = { x: 0, y: 0 };
    updateSelected(null);
    setQuickChatOpen(false);
  }, [setQuickChatOpen, updateSelected]);

  const commitSlice = useCallback(
    (index: number | null) => {
      if (index !== null) {
        const callout = QUICK_CHAT_CALLOUTS[index];
        if (callout) {
          playQuickChatChime();
          onSelectCallout(callout.id);
        }
      }
      closeWheel();
    },
    [closeWheel, onSelectCallout],
  );

  useEffect(() => {
    openRef.current = quickChatOpen;
    if (!quickChatOpen) {
      updateSelected(null);
      lockedDeltaRef.current = { x: 0, y: 0 };
    }
  }, [quickChatOpen, updateSelected]);

  useEffect(() => {
    if (!enabled && openRef.current) {
      closeWheel();
    }
  }, [enabled, closeWheel]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (useCommsStore.getState().chatInputOpen || isEditableElement(e.target)) {
        return;
      }

      if (e.code === "KeyC" && !e.repeat) {
        e.preventDefault();
        holdKeyOpenRef.current = true;
        openRef.current = true;
        lockedDeltaRef.current = { x: 0, y: 0 };
        updateSelected(null);
        setQuickChatOpen(true);
        return;
      }

      if (!openRef.current) {
        return;
      }

      if (e.code === "Escape") {
        e.preventDefault();
        closeWheel();
        return;
      }

      if (e.key >= "1" && e.key <= String(SLICE_COUNT)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        commitSlice(idx);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyC" && holdKeyOpenRef.current) {
        e.preventDefault();
        commitSlice(selectedRef.current);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!openRef.current) {
        return;
      }
      if (document.pointerLockElement) {
        const nextX = Math.max(-140, Math.min(140, lockedDeltaRef.current.x + e.movementX));
        const nextY = Math.max(-140, Math.min(140, lockedDeltaRef.current.y + e.movementY));
        lockedDeltaRef.current = { x: nextX, y: nextY };
        updateSelected(getSliceIndexFromVector(nextX, nextY));
      } else {
        const dx = e.clientX - window.innerWidth / 2;
        const dy = e.clientY - window.innerHeight / 2;
        updateSelected(getSliceIndexFromVector(dx, dy));
      }
    };

    const onBlur = () => {
      if (openRef.current) {
        closeWheel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, setQuickChatOpen, updateSelected, closeWheel, commitSlice]);

  if (!enabled) {
    return null;
  }

  const activeCallout =
    selectedIndex !== null ? QUICK_CHAT_CALLOUTS[selectedIndex] ?? null : null;

  return (
    <>
      {showTouchButton && (
        <button
          type="button"
          className={`comms-touch-qc-btn ${quickChatOpen ? "comms-touch-qc-btn--active" : ""}`}
          aria-label="Toggle Quick Chat wheel"
          aria-expanded={quickChatOpen}
          onClick={() => {
            holdKeyOpenRef.current = false;
            setQuickChatOpen(!quickChatOpen);
          }}
        >
          <span aria-hidden="true">💬</span>
          <span className="comms-touch-qc-label">PING</span>
        </button>
      )}

      {quickChatOpen && (
        <div
          className="comms-wheel-backdrop"
          role="dialog"
          aria-label="Quick Chat callout wheel"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeWheel();
            }
          }}
        >
          <div className="comms-wheel-container">
            <svg
              className="comms-wheel-svg"
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
            >
              {QUICK_CHAT_CALLOUTS.map((callout, idx) => {
                const step = (Math.PI * 2) / SLICE_COUNT;
                const midAngle = -Math.PI / 2 + idx * step;
                const lx = CENTER + LABEL_RADIUS * Math.cos(midAngle);
                const ly = CENTER + LABEL_RADIUS * Math.sin(midAngle);
                const isSelected = selectedIndex === idx;

                return (
                  <g
                    key={callout.id}
                    className={`comms-wheel-slice ${isSelected ? "comms-wheel-slice--active" : ""}`}
                    onMouseEnter={() => updateSelected(idx)}
                    onClick={() => commitSlice(idx)}
                  >
                    <path d={describeSlicePath(idx)} />
                    <text x={lx} y={ly - 7} className="comms-wheel-icon" textAnchor="middle">
                      {callout.icon}
                    </text>
                    <text x={lx} y={ly + 11} className="comms-wheel-text" textAnchor="middle">
                      {callout.label.length > 12
                        ? `${callout.label.slice(0, 11)}…`
                        : callout.label}
                    </text>
                    <text x={lx} y={ly + 23} className="comms-wheel-key" textAnchor="middle">
                      [{idx + 1}]
                    </text>
                  </g>
                );
              })}
            </svg>

            <button
              type="button"
              className="comms-wheel-center"
              onClick={() => closeWheel()}
              aria-label="Cancel quick chat"
            >
              {activeCallout ? (
                <>
                  <span className="comms-wheel-center-icon">{activeCallout.icon}</span>
                  <span className="comms-wheel-center-label">{activeCallout.label}</span>
                </>
              ) : (
                <>
                  <span className="comms-wheel-center-title">QUICK CHAT</span>
                  <span className="comms-wheel-center-hint">
                    {showTouchButton ? "Tap slice" : "Release C / 1-8"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
