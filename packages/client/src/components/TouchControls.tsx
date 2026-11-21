import { useEffect, useRef, useState } from "react";
import { touchInput, type TouchActionName } from "../input/touchInput";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { useCommsStore } from "./comms";

const JOYSTICK_MAX_RADIUS = 52;

interface JoystickVisual {
  active: boolean;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
}

const INITIAL_JOYSTICK: JoystickVisual = {
  active: false,
  originX: 0,
  originY: 0,
  knobX: 0,
  knobY: 0,
};

function TouchActionButton({
  action,
  label,
  className,
  subLabel,
  onPressStart,
  onPressEnd,
}: {
  action: TouchActionName;
  label: string;
  className: string;
  subLabel?: string;
  onPressStart: (action: TouchActionName) => void;
  onPressEnd: (action: TouchActionName) => void;
}) {
  const pointerIdRef = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);

  const release = (target: HTMLButtonElement, pointerId: number) => {
    if (pointerIdRef.current !== pointerId) {
      return;
    }
    pointerIdRef.current = null;
    setPressed(false);
    onPressEnd(action);
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  };

  return (
    <button
      type="button"
      className={`touch-btn ${className} ${pressed ? "touch-btn--pressed" : ""}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (pointerIdRef.current !== null) {
          return;
        }
        pointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        setPressed(true);
        onPressStart(action);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        release(e.currentTarget, e.pointerId);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        release(e.currentTarget, e.pointerId);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="touch-btn-label">{label}</span>
      {subLabel && <span className="touch-btn-sub">{subLabel}</span>}
    </button>
  );
}

export function TouchControls() {
  const showTouchControls = useSettingsStore((s) => s.showTouchControls);
  const lobbyOpen = useGameStore((s) => s.lobbyOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const sandboxOpen = useGameStore((s) => s.sandboxOpen);
  const isAlive = useGameStore((s) => s.isAlive);
  const phase = useGameStore((s) => s.phase);
  const status = useGameStore((s) => s.status);
  const chatInputOpen = useCommsStore((s) => s.chatInputOpen);
  const quickChatOpen = useCommsStore((s) => s.quickChatOpen);
  const dashCooldown = useGameStore((s) => s.dashCooldown);
  const grenadeCooldown = useGameStore((s) => s.grenadeCooldown);
  const isReloading = useGameStore((s) => s.isReloading);

  const joyPointerIdRef = useRef<number | null>(null);
  const aimPointerIdRef = useRef<number | null>(null);
  const aimLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystick, setJoystick] = useState<JoystickVisual>(INITIAL_JOYSTICK);

  const enabled =
    showTouchControls &&
    isAlive &&
    !lobbyOpen &&
    !settingsOpen &&
    !sandboxOpen &&
    !chatInputOpen &&
    !quickChatOpen &&
    phase !== "drafting" &&
    phase !== "match_over" &&
    status === "connected";

  useEffect(() => {
    if (!enabled) {
      joyPointerIdRef.current = null;
      aimPointerIdRef.current = null;
      setJoystick(INITIAL_JOYSTICK);
      touchInput.reset();
    }
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const updateJoystick = (clientX: number, clientY: number, originX: number, originY: number) => {
    let dx = clientX - originX;
    let dy = clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
      dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
      dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
    }
    setJoystick({
      active: true,
      originX,
      originY,
      knobX: dx,
      knobY: dy,
    });
    touchInput.setMove(dx / JOYSTICK_MAX_RADIUS, -dy / JOYSTICK_MAX_RADIUS);
  };

  return (
    <div className="touch-layer" aria-label="Touch controls">
      <div className="rotate-banner" role="status">
        Rotate device to landscape for best controls
      </div>

      {/* Left Zone: Floating Virtual Joystick */}
      <div
        className="touch-zone touch-zone--left"
        onPointerDown={(e) => {
          if (joyPointerIdRef.current !== null) {
            return;
          }
          e.preventDefault();
          joyPointerIdRef.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateJoystick(e.clientX, e.clientY, e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (joyPointerIdRef.current !== e.pointerId) {
            return;
          }
          updateJoystick(e.clientX, e.clientY, joystick.originX, joystick.originY);
        }}
        onPointerUp={(e) => {
          if (joyPointerIdRef.current !== e.pointerId) {
            return;
          }
          joyPointerIdRef.current = null;
          setJoystick(INITIAL_JOYSTICK);
          touchInput.setMove(0, 0);
        }}
        onPointerCancel={(e) => {
          if (joyPointerIdRef.current !== e.pointerId) {
            return;
          }
          joyPointerIdRef.current = null;
          setJoystick(INITIAL_JOYSTICK);
          touchInput.setMove(0, 0);
        }}
      >
        {joystick.active ? (
          <div
            className="joystick-base joystick-base--floating"
            style={{
              left: `${joystick.originX}px`,
              top: `${joystick.originY}px`,
            }}
          >
            <div
              className="joystick-knob"
              style={{
                transform: `translate(calc(-50% + ${joystick.knobX}px), calc(-50% + ${joystick.knobY}px))`,
              }}
            />
          </div>
        ) : (
          <div className="joystick-base joystick-base--idle" aria-hidden="true">
            <div className="joystick-knob joystick-knob--idle" />
          </div>
        )}
      </div>

      {/* Right Zone: Camera Aim Drag + Thumb Action Buttons */}
      <div
        className="touch-zone touch-zone--right"
        onPointerDown={(e) => {
          if (aimPointerIdRef.current !== null) {
            return;
          }
          e.preventDefault();
          aimPointerIdRef.current = e.pointerId;
          aimLastPosRef.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          touchInput.setAimDragging(true);
        }}
        onPointerMove={(e) => {
          if (aimPointerIdRef.current !== e.pointerId) {
            return;
          }
          const dx = e.clientX - aimLastPosRef.current.x;
          const dy = e.clientY - aimLastPosRef.current.y;
          aimLastPosRef.current = { x: e.clientX, y: e.clientY };
          touchInput.addLookDelta(dx, dy);
        }}
        onPointerUp={(e) => {
          if (aimPointerIdRef.current !== e.pointerId) {
            return;
          }
          aimPointerIdRef.current = null;
          touchInput.setAimDragging(false);
        }}
        onPointerCancel={(e) => {
          if (aimPointerIdRef.current !== e.pointerId) {
            return;
          }
          aimPointerIdRef.current = null;
          touchInput.setAimDragging(false);
        }}
      >
        <div className="touch-actions">
          <TouchActionButton
            action="reload"
            label={isReloading ? "..." : "R"}
            className="touch-btn--reload"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
          <TouchActionButton
            action="grenade"
            label="NADE"
            subLabel={grenadeCooldown > 0 ? `${grenadeCooldown.toFixed(1)}s` : undefined}
            className="touch-btn--grenade"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
          <TouchActionButton
            action="dash"
            label="DASH"
            subLabel={dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : undefined}
            className="touch-btn--dash"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
          <TouchActionButton
            action="jump"
            label="JUMP"
            className="touch-btn--jump"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
          <TouchActionButton
            action="melee"
            label="MELEE"
            className="touch-btn--dash"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
          <TouchActionButton
            action="fire"
            label="FIRE"
            className="touch-btn--fire"
            onPressStart={(a) => touchInput.setAction(a, true)}
            onPressEnd={(a) => touchInput.setAction(a, false)}
          />
        </div>
      </div>
    </div>
  );
}
