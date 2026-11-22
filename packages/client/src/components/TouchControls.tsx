import { useEffect, useRef, useState } from "react";
import { touchInput, type TouchActionName } from "../input/touchInput";
import { useGameStore } from "../store/gameStore";
import { useSettingsStore } from "../store/settingsStore";
import { commsStore, useCommsStore } from "./comms";
import {
  ControlIconById,
  HUD_CONTROL_META,
  SprintLockIcon,
  useHudLayoutStore,
  type HudControlId,
  type HudControlPlacement,
} from "./mobile";

const BASE_JOYSTICK_RADIUS = 52;
const SPRINT_THRESHOLD = 0.85;
const SPRINT_LOCK_RATIO = 1.18;
const SPRINT_LOCK_MAX_LATERAL = 0.55;
const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface JoystickVisual {
  active: boolean;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
  sprinting: boolean;
  lockArmed: boolean;
}

const INITIAL_JOYSTICK: JoystickVisual = {
  active: false,
  originX: 0,
  originY: 0,
  knobX: 0,
  knobY: 0,
  sprinting: false,
  lockArmed: false,
};

function CooldownRing({ ratio }: { ratio: number }) {
  if (ratio <= 0.01) return null;
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, ratio)));
  return (
    <svg className="touch-btn-ring" viewBox="0 0 50 50" aria-hidden="true">
      <circle cx="25" cy="25" r={RING_RADIUS} fill="none" stroke="rgba(15,23,42,0.55)" strokeWidth="3.5" />
      <circle
        cx="25"
        cy="25"
        r={RING_RADIUS}
        fill="none"
        stroke="#facc15"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 25 25)"
      />
    </svg>
  );
}

interface CombatIconButtonProps {
  id: Exclude<HudControlId, "joystick">;
  placement: HudControlPlacement;
  action?: TouchActionName;
  sourceId?: string;
  dragLook?: boolean;
  cooldownRatio?: number;
  spinning?: boolean;
  onTap?: () => void;
}

function CombatIconButton({
  id,
  placement,
  action,
  sourceId,
  dragLook = false,
  cooldownRatio = 0,
  spinning = false,
  onTap,
}: CombatIconButtonProps) {
  const meta = HUD_CONTROL_META[id];
  const pointerIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  const sizePx = Math.round(meta.baseSize * placement.scale);
  const iconSize = Math.round(sizePx * 0.48);

  const release = (target: HTMLButtonElement, pointerId: number) => {
    if (pointerIdRef.current !== pointerId) return;
    pointerIdRef.current = null;
    setPressed(false);
    if (action) touchInput.setActionSource(action, sourceId ?? id, false);
    if (dragLook) touchInput.setAimDragging(false);
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
  };

  return (
    <button
      type="button"
      aria-label={meta.name}
      className={`touch-btn ${meta.variantClass} ${pressed ? "touch-btn--pressed" : ""} ${cooldownRatio > 0.01 ? "touch-btn--cooldown" : ""}`}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        opacity: placement.opacity,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (pointerIdRef.current !== null) return;
        pointerIdRef.current = e.pointerId;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        setPressed(true);
        if (action) touchInput.setActionSource(action, sourceId ?? id, true);
        if (dragLook) touchInput.setAimDragging(true);
        onTap?.();
      }}
      onPointerMove={(e) => {
        if (!dragLook || pointerIdRef.current !== e.pointerId) return;
        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        touchInput.addLookDelta(dx, dy);
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
      <CooldownRing ratio={cooldownRatio} />
      <ControlIconById id={id} size={iconSize} className={spinning ? "touch-btn-icon--spin" : undefined} />
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
  const dashCooldown = useGameStore((s) => s.dashCooldown);
  const grenadeCooldown = useGameStore((s) => s.grenadeCooldown);
  const meleeCooldown = useGameStore((s) => s.meleeCooldown);
  const isReloading = useGameStore((s) => s.isReloading);
  const chatInputOpen = useCommsStore((s) => s.chatInputOpen);
  const quickChatOpen = useCommsStore((s) => s.quickChatOpen);
  const controls = useHudLayoutStore((s) => s.controls);
  const editorOpen = useHudLayoutStore((s) => s.editorOpen);

  const joyPointerIdRef = useRef<number | null>(null);
  const joyOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimPointerIdRef = useRef<number | null>(null);
  const aimLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystick, setJoystick] = useState<JoystickVisual>(INITIAL_JOYSTICK);
  const [autoSprintLocked, setAutoSprintLocked] = useState(false);

  const enabled =
    showTouchControls &&
    !editorOpen &&
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
      setAutoSprintLocked(false);
      touchInput.reset();
    }
  }, [enabled]);

  if (!enabled) return null;

  const joyCfg = controls.joystick;
  const maxRadius = Math.round(BASE_JOYSTICK_RADIUS * joyCfg.scale);
  const baseSizePx = Math.round(HUD_CONTROL_META.joystick.baseSize * joyCfg.scale);

  const updateJoystick = (clientX: number, clientY: number, originX: number, originY: number) => {
    const rawDx = clientX - originX;
    const rawDy = clientY - originY;
    const dist = Math.hypot(rawDx, rawDy);
    const ratio = dist > 0.001 ? Math.min(dist, maxRadius) / dist : 0;
    const knobX = rawDx * ratio;
    const knobY = rawDy * ratio;
    const normX = knobX / maxRadius;
    const normZ = -knobY / maxRadius;
    const sprinting = normZ >= SPRINT_THRESHOLD;
    const lockArmed =
      -rawDy / maxRadius >= SPRINT_LOCK_RATIO &&
      Math.abs(rawDx) / maxRadius <= SPRINT_LOCK_MAX_LATERAL;

    setJoystick({ active: true, originX, originY, knobX, knobY, sprinting, lockArmed });
    touchInput.setMove(normX, sprinting ? 1 : normZ);
  };

  const releaseJoystick = (pointerId: number, armLock: boolean) => {
    if (joyPointerIdRef.current !== pointerId) return;
    joyPointerIdRef.current = null;
    setJoystick(INITIAL_JOYSTICK);
    setAutoSprintLocked(armLock);
    touchInput.setMove(0, armLock ? 1 : 0);
  };

  const releaseAim = (pointerId: number) => {
    if (aimPointerIdRef.current !== pointerId) return;
    aimPointerIdRef.current = null;
    touchInput.setAimDragging(false);
  };

  return (
    <div className="touch-layer" aria-label="Touch controls">
      <div
        className="touch-zone touch-zone--left"
        onPointerDown={(e) => {
          if (joyPointerIdRef.current !== null) return;
          e.preventDefault();
          joyPointerIdRef.current = e.pointerId;
          joyOriginRef.current = { x: e.clientX, y: e.clientY };
          setAutoSprintLocked(false);
          e.currentTarget.setPointerCapture(e.pointerId);
          updateJoystick(e.clientX, e.clientY, e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (joyPointerIdRef.current !== e.pointerId) return;
          updateJoystick(e.clientX, e.clientY, joyOriginRef.current.x, joyOriginRef.current.y);
        }}
        onPointerUp={(e) => releaseJoystick(e.pointerId, joystick.lockArmed)}
        onPointerCancel={(e) => releaseJoystick(e.pointerId, false)}
      >
        {joystick.active ? (
          <div
            className={`joystick-base joystick-base--floating ${joystick.sprinting ? "joystick-base--sprint" : ""}`}
            style={{
              left: `${joystick.originX}px`,
              top: `${joystick.originY}px`,
              width: `${baseSizePx}px`,
              height: `${baseSizePx}px`,
              opacity: joyCfg.opacity,
            }}
          >
            {joystick.sprinting && (
              <div className={`joystick-sprint-lock ${joystick.lockArmed ? "joystick-sprint-lock--armed" : ""}`} aria-hidden="true">
                <SprintLockIcon size={18} />
              </div>
            )}
            <div
              className="joystick-knob"
              style={{ transform: `translate(calc(-50% + ${joystick.knobX}px), calc(-50% + ${joystick.knobY}px))` }}
            />
          </div>
        ) : (
          <div
            className={`joystick-base joystick-base--idle ${autoSprintLocked ? "joystick-base--sprint" : ""}`}
            style={{
              left: `${joyCfg.x}%`,
              top: `${joyCfg.y}%`,
              width: `${baseSizePx}px`,
              height: `${baseSizePx}px`,
              opacity: joyCfg.opacity * 0.78,
            }}
            aria-hidden="true"
          >
            <div className="joystick-knob joystick-knob--idle" />
          </div>
        )}
      </div>

      {autoSprintLocked && !joystick.active && (
        <button
          type="button"
          className="touch-autosprint-pill"
          aria-label="Cancel Auto-Sprint"
          style={{ left: `${joyCfg.x}%`, top: `${Math.max(12, joyCfg.y - 16)}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setAutoSprintLocked(false);
            touchInput.setMove(0, 0);
          }}
        >
          <SprintLockIcon size={18} />
        </button>
      )}

      <div
        className="touch-zone touch-zone--right"
        onPointerDown={(e) => {
          if (aimPointerIdRef.current !== null) return;
          e.preventDefault();
          aimPointerIdRef.current = e.pointerId;
          aimLastPosRef.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          touchInput.setAimDragging(true);
        }}
        onPointerMove={(e) => {
          if (aimPointerIdRef.current !== e.pointerId) return;
          const dx = e.clientX - aimLastPosRef.current.x;
          const dy = e.clientY - aimLastPosRef.current.y;
          aimLastPosRef.current = { x: e.clientX, y: e.clientY };
          touchInput.addLookDelta(dx, dy);
        }}
        onPointerUp={(e) => releaseAim(e.pointerId)}
        onPointerCancel={(e) => releaseAim(e.pointerId)}
      />

      <CombatIconButton id="firePrimary" placement={controls.firePrimary} action="fire" sourceId="primary" dragLook />
      <CombatIconButton id="fireClaw" placement={controls.fireClaw} action="fire" sourceId="claw" />
      <CombatIconButton id="jump" placement={controls.jump} action="jump" />
      <CombatIconButton id="dash" placement={controls.dash} action="dash" cooldownRatio={dashCooldown > 0 ? Math.min(1, dashCooldown / 2.5) : 0} />
      <CombatIconButton id="grenade" placement={controls.grenade} action="grenade" cooldownRatio={grenadeCooldown > 0 ? Math.min(1, grenadeCooldown / 6) : 0} />
      <CombatIconButton id="melee" placement={controls.melee} action="melee" cooldownRatio={meleeCooldown > 0 ? Math.min(1, meleeCooldown / 0.9) : 0} />
      <CombatIconButton id="reload" placement={controls.reload} action="reload" spinning={isReloading} />
      <CombatIconButton id="quickChat" placement={controls.quickChat} onTap={() => commsStore.getState().setQuickChatOpen(true)} />
    </div>
  );
}
