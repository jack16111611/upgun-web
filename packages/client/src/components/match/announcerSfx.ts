interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface ToneStep {
  delaySec: number;
  freqStart: number;
  freqEnd?: number;
  durationSec: number;
  type: OscillatorType;
  volume: number;
  attackSec?: number;
}

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!sharedCtx) {
      const AudioCtor =
        window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      sharedCtx = new AudioCtor();
    }
    if (sharedCtx.state === "suspended") {
      void sharedCtx.resume().catch(() => undefined);
    }
    return sharedCtx.state === "closed" ? null : sharedCtx;
  } catch {
    return null;
  }
}

function scheduleTones(steps: readonly ToneStep[], masterGain: number): void {
  if (masterGain <= 0 || !Number.isFinite(masterGain)) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  try {
    const baseTime = ctx.currentTime + 0.01;
    const clampedMaster = Math.min(1, Math.max(0, masterGain));

    for (const step of steps) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const startTime = baseTime + step.delaySec;
      const attack = step.attackSec ?? 0.008;
      const peak = Math.max(0.0001, step.volume * clampedMaster);

      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freqStart, startTime);
      if (step.freqEnd !== undefined && step.freqEnd !== step.freqStart) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, step.freqEnd),
          startTime + step.durationSec,
        );
      }

      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(peak, startTime + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + step.durationSec);

      osc.connect(env);
      env.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + step.durationSec + 0.02);
    }
  } catch {
    // AudioContext may be locked prior to user gesture
  }
}

export function playAnnouncementChime(banner: string, gain = 0.28): void {
  const key = banner.trim().toUpperCase();

  if (key.includes("GODLIKE")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 523.25, durationSec: 0.22, type: "triangle", volume: 0.7 },
        { delaySec: 0.07, freqStart: 659.25, durationSec: 0.24, type: "triangle", volume: 0.75 },
        { delaySec: 0.14, freqStart: 783.99, durationSec: 0.28, type: "sawtooth", volume: 0.5 },
        { delaySec: 0.22, freqStart: 1046.5, durationSec: 0.45, type: "triangle", volume: 0.85 },
        { delaySec: 0.22, freqStart: 1567.98, durationSec: 0.42, type: "sine", volume: 0.45 },
      ],
      gain,
    );
    return;
  }

  if (key.includes("RAMPAGE") || key.includes("MEGA")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 220, freqEnd: 110, durationSec: 0.2, type: "sawtooth", volume: 0.55 },
        { delaySec: 0.04, freqStart: 440, durationSec: 0.18, type: "triangle", volume: 0.75 },
        { delaySec: 0.11, freqStart: 587.33, durationSec: 0.22, type: "triangle", volume: 0.8 },
        { delaySec: 0.19, freqStart: 880, durationSec: 0.36, type: "triangle", volume: 0.85 },
      ],
      gain,
    );
    return;
  }

  if (key.includes("PARRY") || key.includes("DEFLECT")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 1480, freqEnd: 2217.46, durationSec: 0.12, type: "sine", volume: 0.8, attackSec: 0.002 },
        { delaySec: 0.03, freqStart: 2960, freqEnd: 2637, durationSec: 0.26, type: "triangle", volume: 0.65, attackSec: 0.003 },
        { delaySec: 0.06, freqStart: 3951, durationSec: 0.22, type: "sine", volume: 0.4, attackSec: 0.004 },
      ],
      gain,
    );
    return;
  }

  if (key.includes("SEISMIC") || key.includes("SLAM")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 160, freqEnd: 42, durationSec: 0.36, type: "sine", volume: 0.95, attackSec: 0.003 },
        { delaySec: 0.015, freqStart: 240, freqEnd: 65, durationSec: 0.26, type: "triangle", volume: 0.7, attackSec: 0.003 },
        { delaySec: 0.08, freqStart: 523.25, durationSec: 0.2, type: "triangle", volume: 0.45 },
      ],
      gain,
    );
    return;
  }

  if (key.includes("TRIPLE")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 523.25, durationSec: 0.14, type: "triangle", volume: 0.7 },
        { delaySec: 0.07, freqStart: 659.25, durationSec: 0.16, type: "triangle", volume: 0.75 },
        { delaySec: 0.14, freqStart: 987.77, durationSec: 0.3, type: "triangle", volume: 0.85 },
      ],
      gain,
    );
    return;
  }

  if (key.includes("DOUBLE")) {
    scheduleTones(
      [
        { delaySec: 0, freqStart: 523.25, durationSec: 0.14, type: "triangle", volume: 0.7 },
        { delaySec: 0.08, freqStart: 783.99, durationSec: 0.26, type: "triangle", volume: 0.85 },
      ],
      gain,
    );
    return;
  }

  scheduleTones(
    [
      { delaySec: 0, freqStart: 587.33, durationSec: 0.14, type: "triangle", volume: 0.7 },
      { delaySec: 0.08, freqStart: 880, durationSec: 0.24, type: "sine", volume: 0.75 },
    ],
    gain,
  );
}

export function playVictoryFanfare(gain = 0.3): void {
  scheduleTones(
    [
      { delaySec: 0, freqStart: 523.25, durationSec: 0.18, type: "triangle", volume: 0.75 },
      { delaySec: 0.11, freqStart: 659.25, durationSec: 0.18, type: "triangle", volume: 0.78 },
      { delaySec: 0.22, freqStart: 783.99, durationSec: 0.2, type: "triangle", volume: 0.82 },
      { delaySec: 0.34, freqStart: 1046.5, durationSec: 0.58, type: "triangle", volume: 0.9 },
      { delaySec: 0.34, freqStart: 523.25, durationSec: 0.55, type: "sine", volume: 0.55 },
      { delaySec: 0.44, freqStart: 1318.51, durationSec: 0.52, type: "sine", volume: 0.65 },
      { delaySec: 0.52, freqStart: 1567.98, durationSec: 0.48, type: "sine", volume: 0.45 },
    ],
    gain,
  );
}
