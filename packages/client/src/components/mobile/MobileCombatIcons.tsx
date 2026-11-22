import type { HudControlId } from "./hudLayoutStore";

interface IconProps {
  size?: number;
  className?: string;
}

export function FireIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <path d="M12 2.2V6.2M12 17.8V21.8M2.2 12H6.2M17.8 12H21.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function ClawFireIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.5 17.5L13.2 10.8M13.2 10.8L16.5 7.5C17.8 6.2 19.6 5.6 20.6 5.5C20.5 6.5 19.9 8.3 18.6 9.6L15.3 12.9L13.2 10.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 15.5L8.5 19.5M9.5 14.5L11.5 16.5M3.5 19.5L5.5 21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="16.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function JumpIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 14.5L12 8.5L18 14.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 19L12 15.5L15.5 19" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5.5H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function DashIcon({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13.5 3L5.5 13.5H12L10.5 21L18.5 10.5H12L13.5 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function GrenadeIcon({ size = 25, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9.5" y="4" width="5" height="3" rx="1" fill="currentColor" />
      <path d="M14.5 5.2H17.2C18.3 5.2 19 6 19 7V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17.8" cy="4.2" r="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.2 11.2C7.2 8.9 9.2 7.4 12 7.4C14.8 7.4 16.8 8.9 16.8 11.2V15.4C16.8 18.2 14.7 20.5 12 20.5C9.3 20.5 7.2 18.2 7.2 15.4V11.2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M7.6 12.2H16.4M7.6 16H16.4M12 7.8V20.2" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
    </svg>
  );
}

export function MeleeIcon({ size = 25, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19.5 4.5C15.8 5.2 12.2 7.8 8.6 11.4L12.6 15.4C16.2 11.8 18.8 8.2 19.5 4.5Z" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7.4 12.6L11.4 16.6M5.2 18.8L8.8 15.2M4.2 17.8L6.2 19.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function ReloadIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19.5 12A7.5 7.5 0 1 1 17.2 6.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.8 4.2V8.4H15.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuickChatIcon({ size = 21, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 6.8C4.5 5.3 5.7 4.2 7.2 4.2H16.8C18.3 4.2 19.5 5.3 19.5 6.8V13.8C19.5 15.3 18.3 16.4 16.8 16.4H10.2L6.2 19.8V16.4H7.2C5.7 16.4 4.5 15.3 4.5 13.8V6.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9.2" cy="10.3" r="1.2" fill="currentColor" />
      <circle cx="12" cy="10.3" r="1.2" fill="currentColor" />
      <circle cx="14.8" cy="10.3" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function SprintLockIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 16L12 10.5L17.5 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5L12 5L17.5 10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JoystickIcon({ size = 34, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.65" />
      <circle cx="12" cy="12" r="3.6" fill="currentColor" />
      <path d="M12 4.8V6.8M12 17.2V19.2M4.8 12H6.8M17.2 12H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FullscreenEnterIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 9V4H9M20 9V4H15M4 15V20H9M20 15V20H15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FullscreenExitIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 4V9H4M15 4V9H20M9 20V15H4M15 20V15H20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RotateDeviceIcon({ size = 64, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="20" y="10" width="24" height="44" rx="4" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="48" r="2" fill="currentColor" />
      <path d="M49 20C53 24 55 30 53 36" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 36L54 38L56 33.5" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareIosIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3V15M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V12" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function AddHomeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8.2V15.8M8.2 12H15.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function ControlIconById({
  id,
  size,
  className,
}: {
  id: HudControlId;
  size?: number;
  className?: string;
}) {
  switch (id) {
    case "firePrimary":
      return <FireIcon size={size} className={className} />;
    case "fireClaw":
      return <ClawFireIcon size={size} className={className} />;
    case "jump":
      return <JumpIcon size={size} className={className} />;
    case "dash":
      return <DashIcon size={size} className={className} />;
    case "grenade":
      return <GrenadeIcon size={size} className={className} />;
    case "melee":
      return <MeleeIcon size={size} className={className} />;
    case "reload":
      return <ReloadIcon size={size} className={className} />;
    case "quickChat":
      return <QuickChatIcon size={size} className={className} />;
    case "joystick":
      return <JoystickIcon size={size} className={className} />;
  }
}
