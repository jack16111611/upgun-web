import type { AnnouncementEvent, DamageSource } from "@upgun/shared";

const MULTIKILL_WINDOW_MS = 4500;

interface SessionStreakState {
  currentStreak: number;
  bestStreak: number;
  meleeKills: number;
  recentKillTimestamps: number[];
}

export class KillstreakTracker {
  private readonly sessions = new Map<string, SessionStreakState>();

  private getOrCreate(sessionId: string): SessionStreakState {
    let state = this.sessions.get(sessionId);
    if (!state) {
      state = {
        currentStreak: 0,
        bestStreak: 0,
        meleeKills: 0,
        recentKillTimestamps: [],
      };
      this.sessions.set(sessionId, state);
    }
    return state;
  }

  public recordKill(
    killerId: string,
    killerName: string,
    source: DamageSource,
    nowMs = Date.now(),
  ): AnnouncementEvent[] {
    const state = this.getOrCreate(killerId);
    const events: AnnouncementEvent[] = [];

    if (source === "melee") {
      state.meleeKills += 1;
    }

    state.currentStreak += 1;
    if (state.currentStreak > state.bestStreak) {
      state.bestStreak = state.currentStreak;
    }

    const cutoff = nowMs - MULTIKILL_WINDOW_MS;
    state.recentKillTimestamps = state.recentKillTimestamps.filter((ts) => ts >= cutoff);
    state.recentKillTimestamps.push(nowMs);

    const multiCount = state.recentKillTimestamps.length;
    if (multiCount === 2) {
      events.push({
        banner: "DOUBLE KILL",
        subtitle: `${killerName} — 2 Rapid Eliminations!`,
        actorId: killerId,
        accent: "#38bdf8",
      });
    } else if (multiCount === 3) {
      events.push({
        banner: "TRIPLE KILL",
        subtitle: `${killerName} — 3 Rapid Eliminations!`,
        actorId: killerId,
        accent: "#a855f7",
      });
    } else if (multiCount >= 4) {
      events.push({
        banner: "MEGA KILL",
        subtitle: `${killerName} — ${multiCount}x Multi-Kill!`,
        actorId: killerId,
        accent: "#ec4899",
      });
    }

    if (state.currentStreak === 3) {
      events.push({
        banner: "RAMPAGE",
        subtitle: `${killerName} — 3 Kill Streak!`,
        actorId: killerId,
        accent: "#f97316",
      });
    } else if (state.currentStreak >= 5 && state.currentStreak % 5 === 0) {
      events.push({
        banner: "GODLIKE",
        subtitle: `${killerName} — ${state.currentStreak} Kill Streak!`,
        actorId: killerId,
        accent: "#fbbf24",
      });
    }

    return events;
  }

  public recordDeath(victimId: string): void {
    const state = this.sessions.get(victimId);
    if (!state) {
      return;
    }
    state.currentStreak = 0;
    state.recentKillTimestamps = [];
  }

  public createParryDeflectAnnouncement(
    deflectorId: string,
    deflectorName: string,
  ): AnnouncementEvent {
    return {
      banner: "PARRY DEFLECT!",
      subtitle: `${deflectorName} reflected incoming fire!`,
      actorId: deflectorId,
      accent: "#22d3ee",
    };
  }

  public createSeismicSlamAnnouncement(
    playerId: string,
    playerName: string,
  ): AnnouncementEvent {
    return {
      banner: "SEISMIC SLAM!",
      subtitle: `${playerName} shook the arena!`,
      actorId: playerId,
      accent: "#f59e0b",
    };
  }

  public getMeleeKills(sessionId: string): number {
    return this.sessions.get(sessionId)?.meleeKills ?? 0;
  }

  public getCurrentStreak(sessionId: string): number {
    return this.sessions.get(sessionId)?.currentStreak ?? 0;
  }

  public getBestStreak(sessionId: string): number {
    return this.sessions.get(sessionId)?.bestStreak ?? 0;
  }

  public removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public resetRoundStreaks(): void {
    for (const state of this.sessions.values()) {
      state.currentStreak = 0;
      state.recentKillTimestamps = [];
    }
  }

  public resetMatch(): void {
    this.sessions.clear();
  }
}
