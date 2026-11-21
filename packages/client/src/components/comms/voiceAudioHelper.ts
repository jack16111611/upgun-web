import { useCommsStore } from "./commsStore";

const VAD_INTERVAL_MS = 60;
const VAD_SPEAK_THRESHOLD = 0.026;
const VAD_HOLD_TICKS = 4;

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function isSdpInit(value: unknown): value is RTCSessionDescriptionInit {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const rec = value as Record<string, unknown>;
  return typeof rec["type"] === "string" && typeof rec["sdp"] === "string";
}

export function isIceCandidateInit(value: unknown): value is RTCIceCandidateInit {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const rec = value as Record<string, unknown>;
  return typeof rec["candidate"] === "string";
}

/**
 * Local microphone Voice Activity Detector (AudioContext + AnalyserNode).
 */
export class LocalSpeakingDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private buffer: Uint8Array<ArrayBuffer> | null = null;
  private speaking = false;
  private silenceTicks = 0;

  public start(
    stream: MediaStream,
    isTransmitting: () => boolean,
    onSpeakingChange: (speaking: boolean) => void,
  ): void {
    this.stop(onSpeakingChange);
    if (typeof window === "undefined" || typeof AudioContext === "undefined") {
      return;
    }

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      this.audioCtx = ctx;
      this.analyser = analyser;
      this.buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      this.silenceTicks = 0;

      this.timer = setInterval(() => {
        this.sample(isTransmitting(), onSpeakingChange);
      }, VAD_INTERVAL_MS);
    } catch {
      // Speaking detector is optional if AudioContext cannot start.
    }
  }

  private sample(
    transmitting: boolean,
    onSpeakingChange: (speaking: boolean) => void,
  ): void {
    if (!this.analyser || !this.buffer || !transmitting) {
      this.silenceTicks = 0;
      this.setSpeaking(false, onSpeakingChange);
      return;
    }
    if (this.audioCtx?.state === "suspended") {
      void this.audioCtx.resume().catch(() => undefined);
    }

    this.analyser.getByteTimeDomainData(this.buffer);
    let sumSq = 0;
    const len = this.buffer.length;
    for (let i = 0; i < len; i += 1) {
      const sample = ((this.buffer[i] ?? 128) - 128) / 128;
      sumSq += sample * sample;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, len));

    if (rms >= VAD_SPEAK_THRESHOLD) {
      this.silenceTicks = 0;
      this.setSpeaking(true, onSpeakingChange);
    } else if (this.speaking) {
      this.silenceTicks += 1;
      if (this.silenceTicks >= VAD_HOLD_TICKS) {
        this.setSpeaking(false, onSpeakingChange);
      }
    }
  }

  public forceSilent(onSpeakingChange: (speaking: boolean) => void): void {
    this.silenceTicks = 0;
    this.setSpeaking(false, onSpeakingChange);
  }

  private setSpeaking(
    next: boolean,
    onSpeakingChange: (speaking: boolean) => void,
  ): void {
    if (this.speaking === next) {
      return;
    }
    this.speaking = next;
    onSpeakingChange(next);
  }

  public stop(onSpeakingChange: (speaking: boolean) => void): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.analyser = null;
    this.buffer = null;
    if (this.audioCtx) {
      void this.audioCtx.close().catch(() => undefined);
      this.audioCtx = null;
    }
    this.setSpeaking(false, onSpeakingChange);
  }
}

/**
 * Attaches global Push-to-Talk (Hold T) key listeners and returns a cleanup callback.
 */
export function attachPushToTalkKey(
  isPttEnabled: () => boolean,
  onPttActiveChange: (active: boolean) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== "KeyT" || e.repeat || !isPttEnabled()) {
      return;
    }
    if (useCommsStore.getState().chatInputOpen || isEditableElement(e.target)) {
      return;
    }
    onPttActiveChange(true);
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "KeyT") {
      onPttActiveChange(false);
    }
  };

  const onBlur = () => {
    onPttActiveChange(false);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}
