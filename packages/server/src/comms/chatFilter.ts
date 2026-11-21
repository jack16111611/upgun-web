import { MAX_CHAT_LENGTH } from "@upgun/shared";

const CONTROL_AND_BIDI_RE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g;
const WHITESPACE_RUN_RE = /\s+/g;

const PROFANITY_WORDS: readonly string[] = [
  "fuck",
  "fucker",
  "fucking",
  "fucked",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "bitches",
  "asshole",
  "bastard",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "fag",
  "faggot",
  "retard",
  "retarded",
  "nigger",
  "nigga",
  "motherfucker",
  "dumbass",
  "jackass",
  "wanker",
  "twat",
  "prick",
];

const PROFANITY_RE = new RegExp(`\\b(?:${PROFANITY_WORDS.join("|")})\\b`, "gi");

/**
 * Sanitizes raw chat input from a client:
 * - Rejects non-strings
 * - Strips control / invisible bidirectional characters
 * - Collapses whitespace runs and trims
 * - Enforces MAX_CHAT_LENGTH (120)
 * - Masks common profanity words case-insensitively with "***"
 * - Returns null if empty after sanitization
 */
export function sanitizeChatText(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const collapsed = raw
    .replace(CONTROL_AND_BIDI_RE, "")
    .replace(WHITESPACE_RUN_RE, " ")
    .trim();

  if (collapsed.length === 0) {
    return null;
  }

  const clamped = collapsed.slice(0, MAX_CHAT_LENGTH).trim();
  if (clamped.length === 0) {
    return null;
  }

  const masked = clamped.replace(PROFANITY_RE, "***").trim();
  return masked.length > 0 ? masked : null;
}
