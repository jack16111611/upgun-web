import { useEffect, useRef } from "react";
import type { CheatCodeId } from "@upgun/shared";

export const VALID_CHEAT_CODES: readonly CheatCodeId[] = [
  "IDDQD",
  "INFINITE",
  "UPGUNMAX",
  "MOON",
  "BIGHEAD",
  "BOTARMY",
] as const;

const CHEAT_BUFFER_MAX_LEN = 16;
const VALID_CHEAT_CODE_SET: ReadonlySet<string> = new Set(VALID_CHEAT_CODES);

export function parseCheatCodeInput(raw: string): CheatCodeId | null {
  const normalized = raw.trim().toUpperCase();
  if (!VALID_CHEAT_CODE_SET.has(normalized)) {
    return null;
  }
  return normalized as CheatCodeId;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  return target.isContentEditable || target.closest("[contenteditable='true']") !== null;
}

export function useCheatCodeListener(
  enabled: boolean,
  onTriggerCheat: (code: CheatCodeId) => void,
): void {
  const onTriggerRef = useRef(onTriggerCheat);
  onTriggerRef.current = onTriggerCheat;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let buffer = "";

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isEditableElement(event.target) || isEditableElement(document.activeElement)) {
        return;
      }
      if (event.key.length !== 1 || !/^[a-zA-Z]$/.test(event.key)) {
        return;
      }

      buffer = (buffer + event.key.toUpperCase()).slice(-CHEAT_BUFFER_MAX_LEN);

      for (const code of VALID_CHEAT_CODES) {
        if (buffer.endsWith(code)) {
          buffer = "";
          onTriggerRef.current(code);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
