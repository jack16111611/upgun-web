import type { Room } from "@colyseus/sdk";
import {
  NET_MSG,
  type AnnouncementEvent,
  type ChatMessageEvent,
  type DeflectEvent,
  type ExplosionEvent,
  type HitEvent,
  type JumpPadEvent,
  type KillerHighlightEvent,
  type MeleeSwingEvent,
  type OrbPickupEvent,
  type QuickChatEvent,
  type ShotEvent,
  type TeleportEvent,
  type VoiceSpeakingEvent,
  type WebRTCSignalPayload,
} from "@upgun/shared";
import { soundEngine } from "../audio/soundEngine";
import { pushTeleportFlash } from "../components/arena";
import { commsStore, voiceChatManager } from "../components/comms";
import { pushAnnouncementBanner } from "../components/match";
import { useSpectatorStore } from "../components/spectator";
import { juiceBus } from "../effects";
import { triggerLocalMeleeSlash } from "../effects/MeleeSlashEffect";
import { worldRuntime } from "../game/worldRuntime";
import { useGameStore } from "../store/gameStore";

export function attachRoomEventListeners(room: Room): void {
  voiceChatManager.setCallbacks(
    {
      sendOffer: (to, sdp) => {
        room.send(NET_MSG.WEBRTC_OFFER, { from: room.sessionId, to, sdp });
      },
      sendAnswer: (to, sdp) => {
        room.send(NET_MSG.WEBRTC_ANSWER, { from: room.sessionId, to, sdp });
      },
      sendIceCandidate: (to, candidate) => {
        room.send(NET_MSG.WEBRTC_ICE, { from: room.sessionId, to, candidate });
      },
      onSpeakingChange: (speaking) => {
        room.send(NET_MSG.VOICE_SPEAKING, { speaking });
      },
    },
    room.sessionId,
  );

  room.onMessage<ShotEvent>(NET_MSG.SHOT_EVENT, (event) => {
    const isLocal = event.shooterId === room.sessionId;
    juiceBus.pushNeonTracer(event.origin, event.end, event.hit);
    soundEngine.playRifleShot(isLocal);
    if (isLocal) {
      juiceBus.triggerViewmodelRecoil();
    }
  });

  room.onMessage<HitEvent>(NET_MSG.HIT_EVENT, (event) => {
    juiceBus.pushDamageNumber(
      event.point.x,
      event.point.y + 0.35,
      event.point.z,
      event.damage,
      event.killed,
      Boolean(event.crit),
    );
    if (event.shooterId === room.sessionId) {
      useGameStore.getState().triggerHitmarker(event.killed);
      soundEngine.playHitmarker(event.killed);
      if (event.killed) {
        soundEngine.playElimination();
      }
    }
    if (event.targetId === room.sessionId) {
      juiceBus.triggerScreenShake(event.killed ? 0.55 : 0.25);
    }
  });

  room.onMessage<ExplosionEvent>(NET_MSG.EXPLOSION_EVENT, (event) => {
    juiceBus.pushShockwaveRing(event.position, event.radius);
    const localSnap = worldRuntime.players.get(room.sessionId);
    let dist = 12;
    if (localSnap) {
      dist = Math.hypot(
        localSnap.x - event.position.x,
        localSnap.y - event.position.y,
        localSnap.z - event.position.z,
      );
    }
    soundEngine.playExplosion(dist);
    if (dist < event.radius * 2.5) {
      const shake = Math.max(0.15, (1 - dist / (event.radius * 2.5)) * 0.85);
      juiceBus.triggerScreenShake(shake);
    }
  });

  room.onMessage<JumpPadEvent>(NET_MSG.JUMP_PAD_EVENT, (event) => {
    if (event.sessionId !== room.sessionId) {
      soundEngine.playJumpPad();
    }
  });

  room.onMessage<MeleeSwingEvent>(NET_MSG.MELEE_SWING_EVENT, (event) => {
    if (event.attackerId === room.sessionId) {
      triggerLocalMeleeSlash(event.deflected);
    }
    soundEngine.playMeleeSlash(event.deflected);
  });

  room.onMessage<DeflectEvent>(NET_MSG.DEFLECT_EVENT, (event) => {
    soundEngine.playMeleeSlash(true);
    if (event.deflectorId === room.sessionId) {
      juiceBus.triggerScreenShake(0.32);
    }
  });

  room.onMessage<AnnouncementEvent>(NET_MSG.ANNOUNCEMENT_EVENT, (event) => {
    pushAnnouncementBanner(event);
  });

  room.onMessage<TeleportEvent>(NET_MSG.TELEPORT_EVENT, (event) => {
    pushTeleportFlash(event.from, event.color);
    pushTeleportFlash(event.to, event.color);
    soundEngine.playJumpPad();
  });

  room.onMessage<OrbPickupEvent>(NET_MSG.ORB_PICKUP_EVENT, () => {
    soundEngine.playOrbPickup();
  });

  room.onMessage<ChatMessageEvent>(NET_MSG.CHAT_MESSAGE, (event) => {
    commsStore.getState().addChatMessage(event);
  });

  room.onMessage<QuickChatEvent>(NET_MSG.QUICK_CHAT, (event) => {
    const senderColor = worldRuntime.players.get(event.senderId)?.color ?? "#38bdf8";
    commsStore.getState().addQuickChat(event, senderColor);
  });

  room.onMessage<VoiceSpeakingEvent>(NET_MSG.VOICE_SPEAKING, (event) => {
    commsStore.getState().setPeerSpeaking(event.sessionId, event.speaking);
  });

  room.onMessage<{ peers?: string[]; sessionId?: string }>(NET_MSG.WEBRTC_JOIN, (event) => {
    if (Array.isArray(event.peers)) {
      void voiceChatManager.handlePeersList(event.peers);
    } else if (typeof event.sessionId === "string" && event.sessionId !== room.sessionId) {
      void voiceChatManager.handlePeersList([event.sessionId]);
    }
  });

  room.onMessage<WebRTCSignalPayload>(NET_MSG.WEBRTC_OFFER, (event) => {
    if (event.from) {
      void voiceChatManager.handleOffer(event.from, event.sdp);
    }
  });

  room.onMessage<WebRTCSignalPayload>(NET_MSG.WEBRTC_ANSWER, (event) => {
    if (event.from) {
      void voiceChatManager.handleAnswer(event.from, event.sdp);
    }
  });

  room.onMessage<WebRTCSignalPayload>(NET_MSG.WEBRTC_ICE, (event) => {
    if (event.from) {
      void voiceChatManager.handleIceCandidate(event.from, event.candidate);
    }
  });

  room.onMessage<{ sessionId?: string }>(NET_MSG.WEBRTC_LEAVE, (event) => {
    if (typeof event.sessionId === "string") {
      voiceChatManager.handlePeerLeft(event.sessionId);
    }
  });

  room.onMessage<KillerHighlightEvent>(NET_MSG.KILLER_HIGHLIGHT, (event) => {
    if (event.victimId === room.sessionId) {
      useSpectatorStore.getState().triggerKillerHighlight(event);
    }
  });
}
