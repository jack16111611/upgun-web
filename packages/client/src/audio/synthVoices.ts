export interface ToneOpts {
  type: OscillatorType;
  f0: number;
  f1?: number;
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
}

export interface NoiseOpts {
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
  filterType: BiquadFilterType;
  f0: number;
  f1?: number;
  q?: number;
}

type AudioContextCtor = typeof AudioContext;

const MIN_GAIN = 0.0001;
const NOISE_BUFFER_SEC = 1.5;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const win = window as Window & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

export class SynthAudioBus {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.7;
  private muted = false;

  public unlock(): boolean {
    const ctx = this.ensureContext();
    if (!ctx) {
      return false;
    }
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    return ctx.state === "running";
  }

  public isRunning(): boolean {
    return this.ctx?.state === "running";
  }

  public setVolume(v: number): void {
    this.volume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    this.syncGain();
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    this.syncGain();
  }

  public getVolume(): number {
    return this.volume;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playTone(spec: ToneOpts): void {
    const ctx = this.getPlayableContext();
    if (!ctx || !this.masterGain) {
      return;
    }
    const start = ctx.currentTime + (spec.delay ?? 0);
    const attack = Math.min(spec.attack ?? 0.004, spec.dur * 0.4);
    const end = start + spec.dur;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(Math.max(20, spec.f0), start);
    if (spec.f1 !== undefined && spec.f1 !== spec.f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.f1), end);
    }

    gain.gain.setValueAtTime(MIN_GAIN, start);
    gain.gain.linearRampToValueAtTime(Math.max(MIN_GAIN, spec.gain), start + attack);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

    if (spec.filterType && spec.filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = spec.filterType;
      filter.frequency.setValueAtTime(spec.filterFreq, start);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.masterGain);
    osc.start(start);
    osc.stop(end + 0.01);
  }

  public playNoise(spec: NoiseOpts): void {
    const ctx = this.getPlayableContext();
    if (!ctx || !this.masterGain) {
      return;
    }
    const start = ctx.currentTime + (spec.delay ?? 0);
    const attack = Math.min(spec.attack ?? 0.004, spec.dur * 0.4);
    const end = start + spec.dur;

    const source = ctx.createBufferSource();
    source.buffer = this.getNoiseBuffer(ctx);
    const offset = Math.random() * Math.max(0.05, NOISE_BUFFER_SEC - spec.dur - 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = spec.filterType;
    filter.Q.setValueAtTime(spec.q ?? 1, start);
    filter.frequency.setValueAtTime(Math.max(40, spec.f0), start);
    if (spec.f1 !== undefined && spec.f1 !== spec.f0) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, spec.f1), end);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(MIN_GAIN, start);
    gain.gain.linearRampToValueAtTime(Math.max(MIN_GAIN, spec.gain), start + attack);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, end);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(start, offset, spec.dur + 0.02);
    source.stop(end + 0.02);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) {
      return this.ctx;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      return null;
    }
    try {
      const ctx = new Ctor();
      const masterGain = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-8, ctx.currentTime);
      limiter.knee.setValueAtTime(12, ctx.currentTime);
      limiter.ratio.setValueAtTime(6, ctx.currentTime);
      limiter.attack.setValueAtTime(0.003, ctx.currentTime);
      limiter.release.setValueAtTime(0.12, ctx.currentTime);

      masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, ctx.currentTime);
      masterGain.connect(limiter);
      limiter.connect(ctx.destination);

      this.ctx = ctx;
      this.masterGain = masterGain;
      return ctx;
    } catch {
      return null;
    }
  }

  private getPlayableContext(): AudioContext | null {
    if (this.muted || this.volume <= 0.001) {
      return null;
    }
    const ctx = this.ensureContext();
    if (!ctx) {
      return null;
    }
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  }

  private syncGain(): void {
    if (!this.ctx || !this.masterGain) {
      return;
    }
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.015);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const frameCount = Math.floor(ctx.sampleRate * NOISE_BUFFER_SEC);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }
}
