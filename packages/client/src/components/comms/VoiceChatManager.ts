import { commsStore, useCommsStore } from "./commsStore";
import {
  LocalSpeakingDetector,
  attachPushToTalkKey,
  isIceCandidateInit,
  isSdpInit,
} from "./voiceAudioHelper";

export {
  commsStore,
  useCommsStore,
  type CommsChatEntry,
  type CommsStoreState,
  type SpeechBubbleEntry,
} from "./commsStore";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export interface VoiceChatCallbacks {
  sendOffer: (to: string, sdp: RTCSessionDescriptionInit) => void;
  sendAnswer: (to: string, sdp: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (to: string, candidate: RTCIceCandidateInit) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

/**
 * Peer-to-peer WebRTC voice chat controller using Google STUN.
 * Manages mic capture, RTCPeerConnection mesh, local VAD, mute, Push-to-Talk (T), and per-peer mute.
 */
export class VoiceChatManager {
  private callbacks: VoiceChatCallbacks | null = null;
  private localSessionId: string | null = null;
  private localStream: MediaStream | null = null;
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly remoteAudio = new Map<string, HTMLAudioElement>();
  private readonly pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private readonly mutedPeers = new Set<string>();
  private readonly speakingDetector = new LocalSpeakingDetector();
  private micMuted = false;
  private pttEnabled = false;
  private pttHeld = false;
  private pttCleanup: (() => void) | null = null;

  public setCallbacks(callbacks: VoiceChatCallbacks | null, localSessionId?: string | null): void {
    this.callbacks = callbacks;
    if (localSessionId !== undefined) this.localSessionId = localSessionId;
  }

  public isConnected(): boolean {
    return this.localStream !== null;
  }

  private readonly handleSpeakingChange = (speaking: boolean): void => {
    if (this.localSessionId) {
      useCommsStore.getState().setPeerSpeaking(this.localSessionId, speaking);
    }
    this.callbacks?.onSpeakingChange?.(speaking);
  };

  public async connect(callbacks?: VoiceChatCallbacks, localSessionId?: string | null): Promise<boolean> {
    if (callbacks) this.callbacks = callbacks;
    if (localSessionId !== undefined) this.localSessionId = localSessionId;
    if (this.localStream) return true;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      useCommsStore.getState().setMicError("Microphone API unavailable in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = stream;
      this.applyMicTrackState();
      this.speakingDetector.start(stream, () => this.isMicTransmitting(), this.handleSpeakingChange);
      this.pttCleanup?.();
      this.pttCleanup = attachPushToTalkKey(
        () => this.pttEnabled,
        (active) => this.setPushToTalkActive(active),
      );
      useCommsStore.getState().setMicError(null);
      useCommsStore.getState().setMicConnected(true);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone permission denied.";
      useCommsStore.getState().setMicError(msg);
      useCommsStore.getState().setMicConnected(false);
      return false;
    }
  }

  private isMicTransmitting(): boolean {
    return !this.micMuted && (!this.pttEnabled || this.pttHeld);
  }

  private applyMicTrackState(): void {
    const enabled = this.isMicTransmitting();
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = enabled;
      }
    }
    if (!enabled) {
      this.speakingDetector.forceSilent(this.handleSpeakingChange);
    }
  }

  public setMuted(muted: boolean): void {
    this.micMuted = muted;
    useCommsStore.getState().setMicMuted(muted);
    this.applyMicTrackState();
  }

  public isMuted(): boolean {
    return this.micMuted;
  }

  public setPushToTalkMode(enabled: boolean): void {
    this.pttEnabled = enabled;
    this.pttHeld = false;
    useCommsStore.getState().setPttEnabled(enabled);
    useCommsStore.getState().setPttHeld(false);
    this.applyMicTrackState();
  }

  public setPushToTalkActive(active: boolean): void {
    if (this.pttHeld === active) {
      return;
    }
    this.pttHeld = active;
    useCommsStore.getState().setPttHeld(active);
    this.applyMicTrackState();
  }

  public setPeerMuted(sessionId: string, muted: boolean): void {
    if (muted) {
      this.mutedPeers.add(sessionId);
    } else {
      this.mutedPeers.delete(sessionId);
    }
    const audioEl = this.remoteAudio.get(sessionId);
    if (audioEl) {
      audioEl.muted = muted;
    }
    useCommsStore.getState().setPeerMuted(sessionId, muted);
  }

  public isPeerMuted(sessionId: string): boolean {
    return this.mutedPeers.has(sessionId);
  }

  private getOrCreatePeer(peerId: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks?.sendIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream || typeof Audio === "undefined") {
        return;
      }
      let audioEl = this.remoteAudio.get(peerId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        this.remoteAudio.set(peerId, audioEl);
      }
      audioEl.srcObject = stream;
      audioEl.muted = this.mutedPeers.has(peerId);
      void audioEl.play().catch(() => undefined);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.cleanupPeerConnection(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private async flushPendingIce(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const queue = this.pendingIce.get(peerId);
    if (!queue || queue.length === 0) {
      return;
    }
    this.pendingIce.delete(peerId);
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale ICE candidates.
      }
    }
  }

  public async handlePeersList(peerIds: string[]): Promise<void> {
    if (!this.localStream) {
      return;
    }
    for (const peerId of peerIds) {
      if (!peerId || peerId === this.localSessionId || this.peers.has(peerId)) {
        continue;
      }
      try {
        const pc = this.getOrCreatePeer(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.callbacks?.sendOffer(peerId, offer);
      } catch {
        this.cleanupPeerConnection(peerId);
      }
    }
  }

  public async handleOffer(fromId: string, sdp: unknown): Promise<void> {
    if (!this.localStream || !isSdpInit(sdp) || fromId === this.localSessionId) {
      return;
    }
    try {
      const pc = this.getOrCreatePeer(fromId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await this.flushPendingIce(fromId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.callbacks?.sendAnswer(fromId, answer);
    } catch {
      this.cleanupPeerConnection(fromId);
    }
  }

  public async handleAnswer(fromId: string, sdp: unknown): Promise<void> {
    if (!isSdpInit(sdp)) {
      return;
    }
    const pc = this.peers.get(fromId);
    if (!pc) {
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await this.flushPendingIce(fromId, pc);
    } catch {
      // Ignore mismatched renegotiation answers.
    }
  }

  public async handleIceCandidate(fromId: string, candidate: unknown): Promise<void> {
    if (!isIceCandidateInit(candidate)) {
      return;
    }
    const pc = this.peers.get(fromId);
    if (!pc || !pc.remoteDescription) {
      const queue = this.pendingIce.get(fromId) ?? [];
      queue.push(candidate);
      this.pendingIce.set(fromId, queue);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Ignore invalid ICE candidates.
    }
  }

  private cleanupPeerConnection(sessionId: string): void {
    const pc = this.peers.get(sessionId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      this.peers.delete(sessionId);
    }
    const audioEl = this.remoteAudio.get(sessionId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      this.remoteAudio.delete(sessionId);
    }
    this.pendingIce.delete(sessionId);
  }

  public handlePeerLeft(sessionId: string): void {
    this.cleanupPeerConnection(sessionId);
    useCommsStore.getState().removePeer(sessionId);
  }

  public disconnect(): void {
    this.pttCleanup?.();
    this.pttCleanup = null;
    this.speakingDetector.stop(this.handleSpeakingChange);

    for (const peerId of Array.from(this.peers.keys())) {
      this.cleanupPeerConnection(peerId);
    }
    this.pendingIce.clear();

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }

    this.pttHeld = false;
    const store = commsStore.getState();
    store.setMicConnected(false);
    store.setPttHeld(false);
    if (this.localSessionId) {
      store.setPeerSpeaking(this.localSessionId, false);
    }
  }
}

export const voiceChatManager = new VoiceChatManager();
