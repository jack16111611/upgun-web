import { SynthAudioBus } from "./synthVoices";

export type SoundCardRarity = "common" | "rare" | "epic";

export class SoundEngine {
  private readonly bus = new SynthAudioBus();
  private autoUnlockCleanup: (() => void) | null = null;

  constructor() {
    this.attachAutoUnlock();
  }

  public unlock(): void {
    this.bus.unlock();
  }

  public attachAutoUnlock(): () => void {
    if (typeof window === "undefined") {
      return () => undefined;
    }
    if (this.autoUnlockCleanup) {
      return this.autoUnlockCleanup;
    }

    const onGesture = () => {
      this.bus.unlock();
      if (this.bus.isRunning()) {
        cleanup();
      }
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      if (this.autoUnlockCleanup === cleanup) {
        this.autoUnlockCleanup = null;
      }
    };

    window.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
    window.addEventListener("keydown", onGesture, { capture: true, passive: true });
    this.autoUnlockCleanup = cleanup;
    return cleanup;
  }

  public setVolume(v: number): void {
    this.bus.setVolume(v);
  }

  public setMuted(m: boolean): void {
    this.bus.setMuted(m);
  }

  public getVolume(): number {
    return this.bus.getVolume();
  }

  public isMuted(): boolean {
    return this.bus.isMuted();
  }

  public playRifleShot(isLocal = true): void {
    const scale = isLocal ? 1 : 0.42;
    const j = 0.96 + Math.random() * 0.08;
    // Punchy low-mid transient + high-mid snap + filtered crack burst
    this.bus.playTone({
      type: "triangle",
      f0: (isLocal ? 310 : 250) * j,
      f1: 54,
      dur: 0.075,
      gain: 0.34 * scale,
      attack: 0.002,
    });
    this.bus.playTone({
      type: "sawtooth",
      f0: 1350 * j,
      f1: 240,
      dur: 0.042,
      gain: 0.14 * scale,
      attack: 0.001,
      filterType: "bandpass",
      filterFreq: 1800,
    });
    this.bus.playNoise({
      dur: isLocal ? 0.095 : 0.075,
      gain: 0.38 * scale,
      attack: 0.002,
      filterType: "bandpass",
      f0: (isLocal ? 2600 : 1700) * j,
      f1: 520,
      q: 1.1,
    });
  }

  public playReload(): void {
    // Magazine release click, metallic slide, crisp lock-in click
    this.bus.playTone({ type: "triangle", f0: 980, f1: 420, dur: 0.045, gain: 0.18, attack: 0.002 });
    this.bus.playNoise({ dur: 0.06, gain: 0.14, filterType: "highpass", f0: 2200, q: 1.4 });
    this.bus.playNoise({
      delay: 0.09,
      dur: 0.11,
      gain: 0.11,
      attack: 0.015,
      filterType: "bandpass",
      f0: 1400,
      f1: 2600,
      q: 2.2,
    });
    this.bus.playTone({ delay: 0.2, type: "triangle", f0: 1520, f1: 760, dur: 0.055, gain: 0.22, attack: 0.002 });
    this.bus.playTone({ delay: 0.215, type: "sine", f0: 2450, f1: 1800, dur: 0.04, gain: 0.12, attack: 0.002 });
  }

  public playDash(): void {
    this.bus.playNoise({
      dur: 0.23,
      gain: 0.34,
      attack: 0.018,
      filterType: "bandpass",
      f0: 480,
      f1: 2400,
      q: 1.6,
    });
    this.bus.playTone({ type: "sine", f0: 240, f1: 92, dur: 0.16, gain: 0.2, attack: 0.008 });
  }

  public playJumpPad(): void {
    this.bus.playTone({ type: "triangle", f0: 190, f1: 880, dur: 0.32, gain: 0.22, attack: 0.015 });
    this.bus.playTone({ type: "sine", f0: 380, f1: 1320, dur: 0.28, gain: 0.15, delay: 0.03, attack: 0.015 });
    this.bus.playNoise({
      dur: 0.26,
      gain: 0.16,
      attack: 0.02,
      filterType: "bandpass",
      f0: 700,
      f1: 3600,
      q: 2.0,
    });
  }

  public playGrenadeThrow(): void {
    this.bus.playTone({ type: "sine", f0: 2900, f1: 1850, dur: 0.032, gain: 0.16, attack: 0.001 });
    this.bus.playNoise({
      delay: 0.035,
      dur: 0.14,
      gain: 0.2,
      attack: 0.02,
      filterType: "bandpass",
      f0: 650,
      f1: 1950,
      q: 1.5,
    });
  }

  public playGrenadeBounce(): void {
    const j = 0.94 + Math.random() * 0.12;
    this.bus.playTone({ type: "triangle", f0: 1460 * j, f1: 1120 * j, dur: 0.065, gain: 0.16, attack: 0.001 });
    this.bus.playTone({ type: "sine", f0: 2580 * j, f1: 2150 * j, dur: 0.05, gain: 0.11, attack: 0.001 });
  }

  public playExplosion(distance = 0): void {
    const dist = Math.max(0, Number.isFinite(distance) ? distance : 0);
    if (dist > 60) {
      return;
    }
    const att = 1 / (1 + dist * 0.085);
    this.bus.playTone({ type: "sine", f0: 118, f1: 30, dur: 0.48, gain: 0.52 * att, attack: 0.005 });
    this.bus.playTone({ type: "triangle", f0: 185, f1: 42, dur: 0.34, gain: 0.28 * att, attack: 0.003 });
    this.bus.playNoise({
      dur: 0.52,
      gain: 0.46 * att,
      attack: 0.004,
      filterType: "lowpass",
      f0: Math.max(420, 2400 * att),
      f1: 180,
      q: 0.9,
    });
    this.bus.playNoise({
      delay: 0.025,
      dur: 0.28,
      gain: 0.22 * att,
      attack: 0.005,
      filterType: "bandpass",
      f0: 1900,
      f1: 680,
      q: 1.8,
    });
  }

  public playHitmarker(killed = false): void {
    this.bus.playTone({ type: "triangle", f0: 2850, f1: 1650, dur: 0.042, gain: 0.24, attack: 0.001 });
    this.bus.playTone({ type: "sine", f0: 4300, f1: 3100, dur: 0.032, gain: 0.14, attack: 0.001 });
    if (killed) {
      this.bus.playTone({ delay: 0.032, type: "sine", f0: 1318.5, dur: 0.14, gain: 0.2, attack: 0.004 });
      this.bus.playTone({ delay: 0.072, type: "triangle", f0: 1760, dur: 0.18, gain: 0.18, attack: 0.005 });
    }
  }

  public playElimination(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const isLast = idx === notes.length - 1;
      this.bus.playTone({
        delay: idx * 0.055,
        type: isLast ? "triangle" : "sine",
        f0: freq,
        f1: freq * 1.005,
        dur: isLast ? 0.3 : 0.16,
        gain: isLast ? 0.22 : 0.16,
        attack: 0.006,
      });
    });
  }

  public playCardHover(): void {
    this.bus.playTone({ type: "sine", f0: 760, f1: 960, dur: 0.038, gain: 0.09, attack: 0.003 });
  }

  public playCardSelect(rarity: SoundCardRarity = "common"): void {
    if (rarity === "epic") {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        this.bus.playTone({
          delay: idx * 0.045,
          type: idx >= 3 ? "triangle" : "sine",
          f0: freq,
          dur: 0.34,
          gain: 0.18,
          attack: 0.006,
        });
      });
      return;
    }
    if (rarity === "rare") {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        this.bus.playTone({
          delay: idx * 0.048,
          type: "triangle",
          f0: freq,
          dur: 0.26,
          gain: 0.16,
          attack: 0.005,
        });
      });
      return;
    }
    this.bus.playTone({ type: "sine", f0: 493.88, f1: 523.25, dur: 0.12, gain: 0.16, attack: 0.004 });
    this.bus.playTone({ delay: 0.05, type: "triangle", f0: 659.25, dur: 0.18, gain: 0.16, attack: 0.004 });
  }

  public playMeleeSlash(deflected = false): void {
    this.bus.playNoise({
      dur: 0.14,
      gain: 0.24,
      filterType: "bandpass",
      f0: deflected ? 1800 : 1200,
      f1: deflected ? 4200 : 2800,
      q: 2.2,
    });
    this.bus.playTone({
      type: "sawtooth",
      f0: deflected ? 920 : 540,
      f1: deflected ? 1760 : 180,
      dur: deflected ? 0.18 : 0.12,
      gain: deflected ? 0.24 : 0.16,
      attack: 0.003,
    });
  }

  public playOrbPickup(): void {
    [523.25, 659.25, 1046.5].forEach((freq, idx) => {
      this.bus.playTone({
        delay: idx * 0.04,
        type: "triangle",
        f0: freq,
        f1: freq * 1.03,
        dur: 0.22,
        gain: 0.18,
        attack: 0.004,
      });
    });
  }
}

export const soundEngine = new SoundEngine();
