import type { DamageSource, KillerHighlightEvent, MatchPhase } from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";

const HAZARD_KILLER_NAME = "Arena Hazard";

export class SpectatorTracker {
  /**
   * Build the killer highlight payload sent to an eliminated player so the client
   * can display "Eliminated by [Name] ([HP] HP left)" and pan toward their killer for 1.5s.
   */
  public buildKillerHighlight(
    victim: PlayerEntity,
    killer: PlayerEntity | null,
    source: DamageSource,
  ): KillerHighlightEvent {
    if (!killer) {
      return {
        victimId: victim.sessionId,
        killerId: "",
        killerName: HAZARD_KILLER_NAME,
        killerHp: 0,
        killerMaxHp: 0,
        weaponSource: source,
      };
    }

    const killerName = killer.schema.displayName.trim() || killer.sessionId;
    const killerMaxHp = Math.max(1, Math.round(killer.schema.maxHp));
    const killerHp = Math.max(0, Math.min(killerMaxHp, Math.round(killer.schema.hp)));

    return {
      victimId: victim.sessionId,
      killerId: killer.sessionId,
      killerName,
      killerHp,
      killerMaxHp,
      weaponSource: source,
    };
  }

  /**
   * Returns true when a player joining the room mid-round should spawn eliminated
   * (isAlive = false, hp = 0) and enter Spectator Mode without disrupting active combat.
   */
  public shouldJoinAsSpectator(phase: MatchPhase): boolean {
    return phase === "combat" || phase === "round_over";
  }

  /**
   * Marks a late-joining player entity as eliminated so they immediately spectate
   * until the next round spawns everyone normally.
   */
  public applySpectatorJoinState(player: PlayerEntity): void {
    player.schema.isAlive = false;
    player.schema.hp = 0;
  }
}
