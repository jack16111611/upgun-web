import type { Vec3 } from "@upgun/shared";

interface PositionSample {
  timeSec: number;
  x: number;
  y: number;
  z: number;
}

const DEFAULT_BUFFER_CAPACITY = 48;
const TELEPORT_RESET_DIST_SQ = 16 * 16;

/**
 * Fixed-capacity ring buffer storing timestamped enemy positions so bots aim at
 * where a target was `reactionLagMs` ago instead of instant zero-lag tracking.
 */
export class TargetHistoryBuffer {
  private readonly capacity: number;
  private readonly samples: (PositionSample | undefined)[];
  private head = 0;
  private count = 0;

  constructor(capacity = DEFAULT_BUFFER_CAPACITY) {
    this.capacity = Math.max(8, capacity);
    this.samples = new Array<PositionSample | undefined>(this.capacity);
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
  }

  push(timeSec: number, pos: Vec3): void {
    if (this.count > 0) {
      const latestIdx = (this.head - 1 + this.capacity) % this.capacity;
      const latest = this.samples[latestIdx];
      if (latest) {
        const dx = pos.x - latest.x;
        const dy = pos.y - latest.y;
        const dz = pos.z - latest.z;
        if (dx * dx + dy * dy + dz * dz > TELEPORT_RESET_DIST_SQ || timeSec < latest.timeSec) {
          this.clear();
        }
      }
    }

    const slot = this.samples[this.head];
    if (slot) {
      slot.timeSec = timeSec;
      slot.x = pos.x;
      slot.y = pos.y;
      slot.z = pos.z;
    } else {
      this.samples[this.head] = {
        timeSec,
        x: pos.x,
        y: pos.y,
        z: pos.z,
      };
    }

    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count += 1;
    }
  }

  sampleDelayed(nowSec: number, lagSec: number, fallback: Vec3): Vec3 {
    if (this.count === 0) {
      return fallback;
    }

    const targetTime = nowSec - Math.max(0, lagSec);
    const oldestIndex = (this.head - this.count + this.capacity) % this.capacity;
    const oldest = this.samples[oldestIndex];
    if (!oldest) {
      return fallback;
    }

    if (this.count === 1 || targetTime <= oldest.timeSec) {
      return { x: oldest.x, y: oldest.y, z: oldest.z };
    }

    let prev = oldest;
    for (let i = 1; i < this.count; i++) {
      const idx = (oldestIndex + i) % this.capacity;
      const curr = this.samples[idx];
      if (!curr) {
        continue;
      }
      if (curr.timeSec >= targetTime) {
        const span = curr.timeSec - prev.timeSec;
        const alpha = span > 1e-5 ? Math.max(0, Math.min(1, (targetTime - prev.timeSec) / span)) : 1;
        return {
          x: prev.x + (curr.x - prev.x) * alpha,
          y: prev.y + (curr.y - prev.y) * alpha,
          z: prev.z + (curr.z - prev.z) * alpha,
        };
      }
      prev = curr;
    }

    return { x: prev.x, y: prev.y, z: prev.z };
  }
}

export function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function moveAngleToward(current: number, target: number, maxStep: number): number {
  const diff = wrapAngle(target - current);
  if (Math.abs(diff) <= maxStep) {
    return wrapAngle(target);
  }
  return wrapAngle(current + Math.sign(diff) * maxStep);
}

export function randomRange(min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return min + Math.random() * (max - min);
}
