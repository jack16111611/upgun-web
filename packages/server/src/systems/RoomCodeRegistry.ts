import type { Presence } from "colyseus";
import { ROOM_CODE_LENGTH } from "@upgun/shared";

const ROOM_CODES_SET_KEY = "upgun:room_codes";
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_ALLOCATE_ATTEMPTS = 64;

function generateRandomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx] ?? "A";
  }
  return code;
}

export async function allocateRoomCode(presence: Presence): Promise<string> {
  for (let attempt = 0; attempt < MAX_ALLOCATE_ATTEMPTS; attempt++) {
    const candidate = generateRandomCode();
    const inUse = Boolean(await presence.sismember(ROOM_CODES_SET_KEY, candidate));
    if (!inUse) {
      await presence.sadd(ROOM_CODES_SET_KEY, candidate);
      return candidate;
    }
  }
  throw new Error("Unable to allocate unique 4-letter room code");
}

export async function releaseRoomCode(
  presence: Presence,
  code: string,
): Promise<void> {
  if (!code) {
    return;
  }
  await presence.srem(ROOM_CODES_SET_KEY, code);
}
