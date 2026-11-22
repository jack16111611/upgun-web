import type { Vec3 } from "@upgun/shared";

export interface DamageNumberEvent {
  x: number;
  y: number;
  z: number;
  amount: number;
  isKill: boolean;
  isCrit: boolean;
  createdAt: number;
}

export interface NeonTracerEvent {
  origin: Vec3;
  end: Vec3;
  hit: boolean;
  createdAt: number;
  durationMs: number;
}

export interface ShockwaveRingEvent {
  origin: Vec3;
  radius: number;
  createdAt: number;
  durationMs: number;
}

export interface ImpactSparkEvent {
  origin: Vec3;
  dir: Vec3;
  color: string;
  count: number;
  createdAt: number;
}

const MAX_PENDING_DAMAGE_NUMBERS = 48;
const MAX_PENDING_TRACERS = 40;
const MAX_PENDING_SHOCKWAVES = 20;
const MAX_PENDING_SPARKS = 40;

const DEFAULT_TRACER_DURATION_MS = 145;
const DEFAULT_SHOCKWAVE_DURATION_MS = 420;

class JuiceBus {
  private readonly damageQueue: DamageNumberEvent[] = [];
  private readonly tracerQueue: NeonTracerEvent[] = [];
  private readonly shockwaveQueue: ShockwaveRingEvent[] = [];
  private readonly sparkQueue: ImpactSparkEvent[] = [];

  private pendingShakeImpulse = 0;
  private dashPulseSeq = 0;
  private dashTiltDirection = 1;
  private recoilSeq = 0;

  public pushDamageNumber(
    x: number,
    y: number,
    z: number,
    amount: number,
    isKill: boolean,
    isCrit = false,
  ): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    if (this.damageQueue.length >= MAX_PENDING_DAMAGE_NUMBERS) {
      this.damageQueue.shift();
    }
    this.damageQueue.push({
      x,
      y,
      z,
      amount: Math.round(amount),
      isKill,
      isCrit,
      createdAt: performance.now(),
    });
  }

  public triggerDashFovKick(tiltDirection = 1): void {
    this.dashPulseSeq += 1;
    if (Number.isFinite(tiltDirection) && Math.abs(tiltDirection) > 0.05) {
      this.dashTiltDirection = Math.sign(tiltDirection);
    } else {
      this.dashTiltDirection = this.dashPulseSeq % 2 === 0 ? 1 : -1;
    }
  }

  public triggerScreenShake(intensity: number): void {
    if (!Number.isFinite(intensity) || intensity <= 0) {
      return;
    }
    this.pendingShakeImpulse = Math.min(1.2, this.pendingShakeImpulse + intensity);
  }

  public triggerViewmodelRecoil(): void {
    this.recoilSeq += 1;
  }

  public pushImpactSparks(
    origin: Vec3,
    dir: Vec3 = { x: 0, y: 1, z: 0 },
    color = "#fbbf24",
    count = 8,
  ): void {
    if (this.sparkQueue.length >= MAX_PENDING_SPARKS) {
      this.sparkQueue.shift();
    }
    this.sparkQueue.push({
      origin: { x: origin.x, y: origin.y, z: origin.z },
      dir: { x: dir.x, y: dir.y, z: dir.z },
      color,
      count: Math.max(1, Math.min(20, Math.round(count))),
      createdAt: performance.now(),
    });
  }

  public pushNeonTracer(origin: Vec3, end: Vec3, hit: boolean): void {
    if (this.tracerQueue.length >= MAX_PENDING_TRACERS) {
      this.tracerQueue.shift();
    }
    const now = performance.now();
    this.tracerQueue.push({
      origin: { x: origin.x, y: origin.y, z: origin.z },
      end: { x: end.x, y: end.y, z: end.z },
      hit,
      createdAt: now,
      durationMs: DEFAULT_TRACER_DURATION_MS,
    });

    // Spawn metallic hit sparks at the impact endpoint
    const dx = origin.x - end.x;
    const dy = origin.y - end.y;
    const dz = origin.z - end.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const reflectDir: Vec3 = { x: dx / len, y: dy / len, z: dz / len };
    if (hit) {
      this.pushImpactSparks(end, reflectDir, "#fbbf24", 10);
    } else {
      this.pushImpactSparks(end, reflectDir, "#7dd3fc", 4);
    }
  }

  public pushShockwaveRing(origin: Vec3, radius: number): void {
    if (this.shockwaveQueue.length >= MAX_PENDING_SHOCKWAVES) {
      this.shockwaveQueue.shift();
    }
    this.shockwaveQueue.push({
      origin: { x: origin.x, y: origin.y, z: origin.z },
      radius: Math.max(1, Number.isFinite(radius) ? radius : 4),
      createdAt: performance.now(),
      durationMs: DEFAULT_SHOCKWAVE_DURATION_MS,
    });
    this.pushImpactSparks(origin, { x: 0, y: 1, z: 0 }, "#fb923c", 16);
  }

  public drainDamageNumbers(out: DamageNumberEvent[]): number {
    const count = this.damageQueue.length;
    for (let i = 0; i < count; i++) {
      const item = this.damageQueue[i];
      if (item) {
        out.push(item);
      }
    }
    this.damageQueue.length = 0;
    return count;
  }

  public drainNeonTracers(out: NeonTracerEvent[]): number {
    const count = this.tracerQueue.length;
    for (let i = 0; i < count; i++) {
      const item = this.tracerQueue[i];
      if (item) {
        out.push(item);
      }
    }
    this.tracerQueue.length = 0;
    return count;
  }

  public drainShockwaveRings(out: ShockwaveRingEvent[]): number {
    const count = this.shockwaveQueue.length;
    for (let i = 0; i < count; i++) {
      const item = this.shockwaveQueue[i];
      if (item) {
        out.push(item);
      }
    }
    this.shockwaveQueue.length = 0;
    return count;
  }

  public drainImpactSparks(out: ImpactSparkEvent[]): number {
    const count = this.sparkQueue.length;
    for (let i = 0; i < count; i++) {
      const item = this.sparkQueue[i];
      if (item) {
        out.push(item);
      }
    }
    this.sparkQueue.length = 0;
    return count;
  }

  public consumeShakeImpulse(): number {
    const impulse = this.pendingShakeImpulse;
    this.pendingShakeImpulse = 0;
    return impulse;
  }

  public getDashPulseSeq(): number {
    return this.dashPulseSeq;
  }

  public getDashTiltDirection(): number {
    return this.dashTiltDirection;
  }

  public getRecoilSeq(): number {
    return this.recoilSeq;
  }

  public reset(): void {
    this.damageQueue.length = 0;
    this.tracerQueue.length = 0;
    this.shockwaveQueue.length = 0;
    this.sparkQueue.length = 0;
    this.pendingShakeImpulse = 0;
  }
}

export const juiceBus = new JuiceBus();

export function resetJuiceBus(): void {
  juiceBus.reset();
}
