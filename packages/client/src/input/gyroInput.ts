export type GyroPermissionState = "unknown" | "granted" | "denied" | "unsupported";

export interface GyroConfig {
  enabled: boolean;
  sensitivityX: number;
  sensitivityY: number;
  invertY: boolean;
}

export interface GyroSample {
  deltaYaw: number;
  deltaPitch: number;
  active: boolean;
}

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const DEG_TO_RAD = Math.PI / 180;
const DEADZONE_RAD = 0.0008;
const MAX_EVENT_DELTA_RAD = 0.22;
const MAX_SAMPLE_DELTA_RAD = 0.28;
const MAX_RATE_RAD_PER_SEC = 7.5;
const SMOOTHING_ALPHA = 0.65;
const ZENITH_YAW_MIN_HORIZ = 0.2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function wrapAngleRad(diff: number): number {
  let d = diff;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function getOrientationConstructor(): DeviceOrientationEventWithPermission | null {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return null;
  }
  return window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission;
}

/**
 * Computes world-space look angles from W3C DeviceOrientation Euler angles
 * (intrinsic Z-X'-Y'': R = Rz(alpha) * Rx(beta) * Ry(gamma)) applied to the
 * back-of-device normal (0, 0, -1). Because this projects the screen normal
 * directly into world East-North-Up coordinates, it is naturally compensated
 * for all screen orientations (landscape-left, landscape-right, portrait) and
 * avoids the +/-90 deg gamma sign flip when held vertically in landscape.
 */
function orientationToLookAngles(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
): { yaw: number; pitch: number; horizMag: number } {
  const a = alphaDeg * DEG_TO_RAD;
  const b = betaDeg * DEG_TO_RAD;
  const g = gammaDeg * DEG_TO_RAD;

  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  const cosB = Math.cos(b);
  const sinB = Math.sin(b);
  const cosG = Math.cos(g);
  const sinG = Math.sin(g);

  // R * (0, 0, -1)
  const x1 = -sinG;
  const y1 = sinB * cosG;
  const z1 = -cosB * cosG;

  const wx = cosA * x1 - sinA * y1;
  const wy = sinA * x1 + cosA * y1;
  const wz = clamp(z1, -1, 1);

  const horizMag = Math.hypot(wx, wy);
  const yaw = Math.atan2(-wx, wy);
  const pitch = Math.asin(wz);
  return { yaw, pitch, horizMag };
}

export class GyroInputController {
  private config: GyroConfig = {
    enabled: false,
    sensitivityX: 1.0,
    sensitivityY: 1.0,
    invertY: false,
  };

  private permissionState: GyroPermissionState = "unknown";
  private listening = false;
  private hasBaseline = false;
  private lastYaw = 0;
  private lastPitch = 0;
  private smoothDeltaYaw = 0;
  private smoothDeltaPitch = 0;
  private pendingYaw = 0;
  private pendingPitch = 0;
  private lastEventAt = 0;

  private readonly handleOrientation = (event: DeviceOrientationEvent): void => {
    if (!this.config.enabled) {
      return;
    }
    if (event.alpha === null || event.beta === null || event.gamma === null) {
      return;
    }
    if (
      !Number.isFinite(event.alpha) ||
      !Number.isFinite(event.beta) ||
      !Number.isFinite(event.gamma)
    ) {
      return;
    }

    const now = performance.now();
    const { yaw, pitch, horizMag } = orientationToLookAngles(
      event.alpha,
      event.beta,
      event.gamma,
    );

    // Re-baseline after pauses or first event to prevent angle jumps
    if (!this.hasBaseline || now - this.lastEventAt > 350) {
      this.hasBaseline = true;
      this.lastYaw = yaw;
      this.lastPitch = pitch;
      this.lastEventAt = now;
      return;
    }

    let rawYaw = wrapAngleRad(yaw - this.lastYaw);
    let rawPitch = pitch - this.lastPitch;
    this.lastYaw = yaw;
    this.lastPitch = pitch;
    this.lastEventAt = now;

    // Dampen yaw near zenith/nadir where horizontal projection shrinks
    if (horizMag < ZENITH_YAW_MIN_HORIZ) {
      rawYaw *= horizMag / ZENITH_YAW_MIN_HORIZ;
    }

    // Clamp sudden orientation jumps (e.g. screen flip or sensor hiccup)
    rawYaw = clamp(rawYaw, -MAX_EVENT_DELTA_RAD, MAX_EVENT_DELTA_RAD);
    rawPitch = clamp(rawPitch, -MAX_EVENT_DELTA_RAD, MAX_EVENT_DELTA_RAD);

    if (Math.abs(rawYaw) < DEADZONE_RAD) rawYaw = 0;
    if (Math.abs(rawPitch) < DEADZONE_RAD) rawPitch = 0;

    this.smoothDeltaYaw =
      this.smoothDeltaYaw * (1 - SMOOTHING_ALPHA) + rawYaw * SMOOTHING_ALPHA;
    this.smoothDeltaPitch =
      this.smoothDeltaPitch * (1 - SMOOTHING_ALPHA) + rawPitch * SMOOTHING_ALPHA;

    const pitchSign = this.config.invertY ? -1 : 1;
    this.pendingYaw = clamp(
      this.pendingYaw + this.smoothDeltaYaw * this.config.sensitivityX,
      -MAX_SAMPLE_DELTA_RAD,
      MAX_SAMPLE_DELTA_RAD,
    );
    this.pendingPitch = clamp(
      this.pendingPitch + this.smoothDeltaPitch * this.config.sensitivityY * pitchSign,
      -MAX_SAMPLE_DELTA_RAD,
      MAX_SAMPLE_DELTA_RAD,
    );
  };

  private readonly handleOrientationChange = (): void => {
    this.reset();
  };

  isSupported(): boolean {
    return getOrientationConstructor() !== null;
  }

  isPermissionRequired(): boolean {
    const ctor = getOrientationConstructor();
    return ctor !== null && typeof ctor.requestPermission === "function";
  }

  getPermissionState(): GyroPermissionState {
    if (!this.isSupported()) {
      return "unsupported";
    }
    return this.permissionState;
  }

  getConfig(): GyroConfig {
    return { ...this.config };
  }

  setConfig(partial: Partial<GyroConfig>): void {
    const nextEnabled =
      typeof partial.enabled === "boolean" ? partial.enabled : this.config.enabled;
    const nextSensX =
      typeof partial.sensitivityX === "number" && Number.isFinite(partial.sensitivityX)
        ? clamp(partial.sensitivityX, 0.1, 4.0)
        : this.config.sensitivityX;
    const nextSensY =
      typeof partial.sensitivityY === "number" && Number.isFinite(partial.sensitivityY)
        ? clamp(partial.sensitivityY, 0.1, 4.0)
        : this.config.sensitivityY;
    const nextInvertY =
      typeof partial.invertY === "boolean" ? partial.invertY : this.config.invertY;

    this.config = {
      enabled: nextEnabled,
      sensitivityX: nextSensX,
      sensitivityY: nextSensY,
      invertY: nextInvertY,
    };

    if (this.config.enabled) {
      if (!this.isPermissionRequired() || this.permissionState === "granted") {
        this.attach();
      }
    } else {
      this.detach();
    }
  }

  async requestPermission(): Promise<boolean> {
    const ctor = getOrientationConstructor();
    if (!ctor) {
      this.permissionState = "unsupported";
      return false;
    }

    if (typeof ctor.requestPermission !== "function") {
      // Android Chrome & browsers without explicit permission gate
      this.permissionState = "granted";
      if (this.config.enabled) {
        this.attach();
      }
      return true;
    }

    try {
      const result = await ctor.requestPermission();
      const granted = result === "granted";
      this.permissionState = granted ? "granted" : "denied";
      if (granted && this.config.enabled) {
        this.attach();
      }
      return granted;
    } catch {
      this.permissionState = "denied";
      return false;
    }
  }

  sample(dt: number): GyroSample {
    if (!this.config.enabled || !this.listening) {
      this.pendingYaw = 0;
      this.pendingPitch = 0;
      return { deltaYaw: 0, deltaPitch: 0, active: false };
    }

    const safeDt = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.1) : 1 / 60;
    const maxStep = Math.min(MAX_SAMPLE_DELTA_RAD, MAX_RATE_RAD_PER_SEC * safeDt);

    const deltaYaw = clamp(this.pendingYaw, -maxStep, maxStep);
    const deltaPitch = clamp(this.pendingPitch, -maxStep, maxStep);
    this.pendingYaw = 0;
    this.pendingPitch = 0;

    const active = Math.abs(deltaYaw) > 0.0001 || Math.abs(deltaPitch) > 0.0001;
    return { deltaYaw, deltaPitch, active };
  }

  reset(): void {
    this.hasBaseline = false;
    this.smoothDeltaYaw = 0;
    this.smoothDeltaPitch = 0;
    this.pendingYaw = 0;
    this.pendingPitch = 0;
  }

  dispose(): void {
    this.detach();
  }

  private attach(): void {
    if (this.listening || typeof window === "undefined") {
      return;
    }
    this.reset();
    window.addEventListener("deviceorientation", this.handleOrientation, true);
    window.addEventListener("orientationchange", this.handleOrientationChange);
    this.listening = true;
  }

  private detach(): void {
    if (!this.listening || typeof window === "undefined") {
      return;
    }
    window.removeEventListener("deviceorientation", this.handleOrientation, true);
    window.removeEventListener("orientationchange", this.handleOrientationChange);
    this.listening = false;
    this.reset();
  }
}

export const gyroInput = new GyroInputController();

export async function requestGyroPermission(): Promise<boolean> {
  return gyroInput.requestPermission();
}
