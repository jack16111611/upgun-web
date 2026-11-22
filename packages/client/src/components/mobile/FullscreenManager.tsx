import { useCallback, useEffect, useState } from "react";
import {
  AddHomeIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  RotateDeviceIcon,
  ShareIosIcon,
} from "./MobileCombatIcons";

interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface ScreenOrientationWithLock {
  lock?: (orientation: string) => Promise<void>;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true
  );
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
    window.matchMedia?.("(pointer: coarse)").matches === true
  );
}

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") {
    return null;
  }
  const doc = document as WebkitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function tryLockLandscape(): Promise<void> {
  try {
    const orientation = window.screen?.orientation as
      | (ScreenOrientation & ScreenOrientationWithLock)
      | undefined;
    if (orientation && typeof orientation.lock === "function") {
      await orientation.lock("landscape");
    }
  } catch {
    // Orientation lock is best-effort and restricted on some browsers/desktops
  }
}

export interface FullscreenButtonProps {
  className?: string;
  showLabel?: boolean;
}

export function FullscreenButton({
  className = "",
  showLabel = false,
}: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(getFullscreenElement()));
  const [iosImmersive, setIosImmersive] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const handleToggle = useCallback(async () => {
    const doc = document as WebkitDocument;
    const root = document.documentElement as WebkitElement;
    const activeFs = getFullscreenElement();

    if (activeFs) {
      try {
        if (typeof doc.exitFullscreen === "function") {
          await doc.exitFullscreen();
        } else if (typeof doc.webkitExitFullscreen === "function") {
          await doc.webkitExitFullscreen();
        }
      } catch {
        // Ignore exit failures
      }
      return;
    }

    const canNativeFullscreen =
      !isIosDevice() &&
      (typeof root.requestFullscreen === "function" ||
        typeof root.webkitRequestFullscreen === "function");

    if (canNativeFullscreen) {
      try {
        if (typeof root.requestFullscreen === "function") {
          await root.requestFullscreen();
        } else if (typeof root.webkitRequestFullscreen === "function") {
          await root.webkitRequestFullscreen();
        }
        await tryLockLandscape();
        return;
      } catch {
        // Fall through to immersive fallback on restricted Safari/iPad contexts
      }
    }

    // iOS Safari (iPhone / iPad) immersive 100dvh toggle + Add-to-Home-Screen guide
    const nextImmersive = !iosImmersive;
    setIosImmersive(nextImmersive);
    document.documentElement.classList.toggle("ios-immersive-mode", nextImmersive);
    if (nextImmersive) {
      window.scrollTo(0, 1);
      if (!isStandalonePwa()) {
        setShowIosGuide(true);
      }
    } else {
      setShowIosGuide(false);
    }
  }, [iosImmersive]);

  const active = isFullscreen || iosImmersive;

  return (
    <>
      <button
        type="button"
        className={`mobile-fs-btn ${active ? "mobile-fs-btn--active" : ""} ${className}`}
        onClick={() => void handleToggle()}
        aria-label={active ? "Exit Fullscreen" : "Enter Fullscreen"}
        title={active ? "Exit Fullscreen" : "Fullscreen"}
      >
        {active ? <FullscreenExitIcon size={18} /> : <FullscreenEnterIcon size={18} />}
        {showLabel && <span>{active ? "Exit Fullscreen" : "Fullscreen"}</span>}
      </button>

      {showIosGuide && (
        <div
          className="ios-a2hs-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Add UpGun to Home Screen for true fullscreen"
          onClick={() => setShowIosGuide(false)}
        >
          <div className="ios-a2hs-card" onClick={(e) => e.stopPropagation()}>
            <div className="ios-a2hs-header">
              <span className="ios-a2hs-badge">iOS FULLSCREEN</span>
              <button
                type="button"
                className="ios-a2hs-close"
                aria-label="Dismiss fullscreen guide"
                onClick={() => setShowIosGuide(false)}
              >
                ×
              </button>
            </div>
            <h3 className="ios-a2hs-title">Play Fullscreen on iPhone &amp; iPad</h3>
            <p className="ios-a2hs-sub">
              Install UpGun to your Home Screen to hide Safari bars completely:
            </p>
            <ol className="ios-a2hs-steps">
              <li>
                <span className="ios-a2hs-icon">
                  <ShareIosIcon size={18} />
                </span>
                <span>
                  Tap the <strong>Share</strong> icon in Safari&apos;s toolbar
                </span>
              </li>
              <li>
                <span className="ios-a2hs-icon">
                  <AddHomeIcon size={18} />
                </span>
                <span>
                  Choose <strong>Add to Home Screen</strong>, then launch UpGun
                </span>
              </li>
            </ol>
            <button
              type="button"
              className="ios-a2hs-done"
              onClick={() => setShowIosGuide(false)}
            >
              Got it — Continue in Immersive View
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function LandscapeGuardOverlay() {
  const [isPortraitTouch, setIsPortraitTouch] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return isTouchDevice() && window.innerHeight > window.innerWidth;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = isTouchDevice() && window.innerHeight > window.innerWidth;
      setIsPortraitTouch(portrait);
      if (!portrait) {
        setDismissed(false);
      }
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    window.screen?.orientation?.addEventListener?.("change", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      window.screen?.orientation?.removeEventListener?.("change", check);
    };
  }, []);

  if (!isPortraitTouch || dismissed) {
    return null;
  }

  return (
    <div
      className="landscape-guard-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Rotate Device to Landscape"
    >
      <div className="landscape-guard-card">
        <div className="landscape-guard-phone">
          <RotateDeviceIcon size={72} />
        </div>
        <h2 className="landscape-guard-title">Rotate Device to Landscape</h2>
        <p className="landscape-guard-desc">
          Turn your phone or tablet sideways for full dual-thumb &amp; claw combat controls.
        </p>
        <button
          type="button"
          className="landscape-guard-dismiss"
          onClick={() => setDismissed(true)}
        >
          Continue in Portrait
        </button>
      </div>
    </div>
  );
}
