import { useEffect, useRef, useState } from "react";
import { Billboard, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { useCommsStore } from "./commsStore";
import "./comms.css";

export interface PlayerSpeechVisualsProps {
  sessionId: string;
  yOffset?: number;
}

/**
 * R3F component mounted inside a remote player's <group>.
 * Displays:
 * - A pulsing green glowing speaking-indicator ring above the robot head
 * - A floating 3-second speech bubble when a Quick-Chat callout arrives
 */
export function PlayerSpeechVisuals({
  sessionId,
  yOffset = 1.62,
}: PlayerSpeechVisualsProps) {
  const isSpeaking = useCommsStore((s) => Boolean(s.speakingPeers[sessionId]));
  const bubble = useCommsStore((s) => s.activeSpeechBubbles[sessionId] ?? null);
  const pruneExpiredBubbles = useCommsStore((s) => s.pruneExpiredBubbles);

  const [bubbleVisible, setBubbleVisible] = useState(false);

  const innerRingRef = useRef<Mesh>(null);
  const outerRingRef = useRef<Mesh>(null);
  const outerMatRef = useRef<MeshBasicMaterial>(null);
  const beaconMatRef = useRef<MeshBasicMaterial>(null);
  const pulseClockRef = useRef(0);

  useEffect(() => {
    if (!bubble) {
      setBubbleVisible(false);
      return;
    }
    const remaining = bubble.expiresAt - Date.now();
    if (remaining <= 0) {
      setBubbleVisible(false);
      return;
    }
    setBubbleVisible(true);
    const timer = setTimeout(() => {
      setBubbleVisible(false);
      pruneExpiredBubbles();
    }, remaining);
    return () => clearTimeout(timer);
  }, [bubble, pruneExpiredBubbles]);

  useFrame((_, delta) => {
    if (!isSpeaking) {
      pulseClockRef.current = 0;
      return;
    }

    pulseClockRef.current += delta;
    const t = pulseClockRef.current;

    if (innerRingRef.current) {
      const innerScale = 1 + Math.sin(t * 9) * 0.08;
      innerRingRef.current.scale.set(innerScale, innerScale, 1);
    }

    const wave = (t * 1.8) % 1;
    if (outerRingRef.current) {
      const outerScale = 1 + wave * 0.85;
      outerRingRef.current.scale.set(outerScale, outerScale, 1);
    }
    if (outerMatRef.current) {
      outerMatRef.current.opacity = Math.max(0, (1 - wave) * 0.78);
    }
    if (beaconMatRef.current) {
      beaconMatRef.current.opacity = 0.72 + Math.sin(t * 10) * 0.25;
    }
  });

  if (!isSpeaking && !bubbleVisible) {
    return null;
  }

  return (
    <group position={[0, yOffset, 0]}>
      {isSpeaking && (
        <group>
          {/* Horizontal halo rings above robot head */}
          <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.24, 0.31, 32]} />
            <meshBasicMaterial
              color="#4ade80"
              transparent
              opacity={0.95}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.36, 32]} />
            <meshBasicMaterial
              ref={outerMatRef}
              color="#86efac"
              transparent
              opacity={0.7}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>

          {/* Camera-facing glowing voice beacon ring so speaking is visible at eye level */}
          <Billboard position={[0, 0.14, 0]}>
            <mesh>
              <ringGeometry args={[0.07, 0.11, 24]} />
              <meshBasicMaterial
                ref={beaconMatRef}
                color="#4ade80"
                transparent
                opacity={0.9}
                toneMapped={false}
              />
            </mesh>
          </Billboard>
        </group>
      )}

      {bubbleVisible && bubble && (
        <Billboard position={[0, isSpeaking ? 0.42 : 0.26, 0]}>
          <Html
            center
            distanceFactor={10}
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="comms-speech-bubble" role="status">
              <span className="comms-speech-bubble-text">{bubble.text}</span>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
