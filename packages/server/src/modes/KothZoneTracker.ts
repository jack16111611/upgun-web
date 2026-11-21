import { getArenaMap, SUNLIT_COURTYARD_MAP, type Vec3 } from "@upgun/shared";
import type { PlayerEntity } from "../systems/PlayerEntity";

export const KOTH_ROTATION_INTERVAL_SEC = 30;
export const KOTH_ZONE_RADIUS = 4.2;
export const KOTH_CAPTURE_RATE_PER_SEC = 12;
export const KOTH_OVERTIME_HOLD_PERCENT = 99;

const ZONE_VERTICAL_BELOW_TOLERANCE = 1.2;
const ZONE_VERTICAL_ABOVE_TOLERANCE = 4.2;

const MAP_KOTH_WAYPOINTS: Readonly<Record<string, readonly Vec3[]>> = {
  neon_foundry: [
    { x: 0, y: 0, z: -5.5 },
    { x: -11.5, y: 2.8, z: 0 },
    { x: 0, y: 0, z: 5.5 },
    { x: 11.5, y: 2.8, z: 0 },
    { x: 0, y: 5.1, z: 0 },
  ],
  cyber_colosseum: [
    { x: 0, y: 1.4, z: 0 },
    { x: 0, y: 0, z: -8.0 },
    { x: 8.0, y: 0, z: 0 },
    { x: 0, y: 0, z: 8.0 },
    { x: -8.0, y: 0, z: 0 },
  ],
  skyline_rooftops: [
    { x: 0, y: 3.0, z: 0 },
    { x: -10.5, y: 0, z: -10.5 },
    { x: 10.5, y: 0, z: 10.5 },
    { x: 10.5, y: 0, z: -10.5 },
    { x: -10.5, y: 0, z: 10.5 },
  ],
};

const DEFAULT_WAYPOINTS: readonly Vec3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: -8.0 },
  { x: 8.0, y: 0, z: 0 },
  { x: 0, y: 0, z: 8.0 },
  { x: -8.0, y: 0, z: 0 },
];

export interface KothZoneSnapshot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  radius: number;
  ownerId: string;
  contested: boolean;
  overtime: boolean;
  rotationTimer: number;
  progress: number;
  captureProgress: Record<string, number>;
}

export interface KothStepResult {
  roundWinnerId: string | null;
  rotated: boolean;
  snapshot: KothZoneSnapshot;
}

export class KothZoneTracker {
  private mapId = "neon_foundry";
  private waypointIndex = 0;
  private active = false;

  x = 0;
  y = 0;
  z = -5.5;
  readonly radius = KOTH_ZONE_RADIUS;
  ownerId = "";
  contested = false;
  overtime = false;
  rotationTimer = KOTH_ROTATION_INTERVAL_SEC;

  readonly captureProgress = new Map<string, number>();

  constructor(initialMapId = SUNLIT_COURTYARD_MAP.id) {
    this.configureForMap(initialMapId);
  }

  private getWaypoints(): readonly Vec3[] {
    const mapZones = getArenaMap(this.mapId).kothZones;
    if (mapZones && mapZones.length > 0) {
      return mapZones.map(([x, y, z]) => ({ x, y, z }));
    }
    return MAP_KOTH_WAYPOINTS[this.mapId] ?? DEFAULT_WAYPOINTS;
  }

  private applyWaypoint(index: number): void {
    const waypoints = this.getWaypoints();
    const safeIdx = waypoints.length > 0 ? ((index % waypoints.length) + waypoints.length) % waypoints.length : 0;
    this.waypointIndex = safeIdx;
    const wp = waypoints[safeIdx] ?? DEFAULT_WAYPOINTS[0]!;
    this.x = wp.x;
    this.y = wp.y;
    this.z = wp.z;
  }

  configureForMap(mapId: string): void {
    this.mapId = mapId;
    this.applyWaypoint(0);
    this.rotationTimer = KOTH_ROTATION_INTERVAL_SEC;
  }

  resetRound(mapId?: string): void {
    if (mapId) {
      this.mapId = mapId;
    }
    this.captureProgress.clear();
    this.ownerId = "";
    this.contested = false;
    this.overtime = false;
    this.active = false;
    this.rotationTimer = KOTH_ROTATION_INTERVAL_SEC;
    this.applyWaypoint(0);
  }

  activate(mapId?: string): void {
    if (mapId && mapId !== this.mapId) {
      this.configureForMap(mapId);
    }
    this.active = true;
  }

  removePlayer(sessionId: string): void {
    this.captureProgress.delete(sessionId);
    if (this.ownerId === sessionId) {
      this.ownerId = "";
    }
  }

  getZonePosition(): Vec3 {
    return { x: this.x, y: this.y, z: this.z };
  }

  isPlayerInside(player: PlayerEntity): boolean {
    if (!player.schema.isAlive) {
      return false;
    }
    const dx = player.movement.x - this.x;
    const dz = player.movement.z - this.z;
    if (dx * dx + dz * dz > this.radius * this.radius) {
      return false;
    }
    const dy = player.movement.y - this.y;
    return dy >= -ZONE_VERTICAL_BELOW_TOLERANCE && dy <= ZONE_VERTICAL_ABOVE_TOLERANCE;
  }

  step(
    players: Map<string, PlayerEntity>,
    dt: number,
    isCombatActive = true,
  ): KothStepResult {
    this.active = isCombatActive;
    if (!isCombatActive || !Number.isFinite(dt) || dt <= 0) {
      return {
        roundWinnerId: null,
        rotated: false,
        snapshot: this.getSnapshot(),
      };
    }

    const insidePlayers: PlayerEntity[] = [];
    for (const player of players.values()) {
      if (this.isPlayerInside(player)) {
        insidePlayers.push(player);
      }
    }

    // Check overtime/contested state first so rotation pauses during overtime
    let roundWinnerId: string | null = null;
    if (insidePlayers.length === 0) {
      this.contested = false;
      this.overtime = false;
      this.ownerId = "";
    } else if (insidePlayers.length > 1) {
      this.contested = true;
      let leadId = "";
      let leadProgress = -1;
      let anyNearWin = false;

      for (const occupant of insidePlayers) {
        const current = this.captureProgress.get(occupant.sessionId) ?? 0;
        if (current >= KOTH_OVERTIME_HOLD_PERCENT) {
          this.captureProgress.set(occupant.sessionId, KOTH_OVERTIME_HOLD_PERCENT);
          anyNearWin = true;
        }
        if (current > leadProgress) {
          leadProgress = current;
          leadId = occupant.sessionId;
        }
      }

      if (!anyNearWin) {
        for (const progress of this.captureProgress.values()) {
          if (progress >= KOTH_OVERTIME_HOLD_PERCENT) {
            anyNearWin = true;
            break;
          }
        }
      }

      this.overtime = anyNearWin;
      this.ownerId = leadProgress > 0 ? leadId : "";
    } else {
      const capturer = insidePlayers[0]!;
      this.contested = false;
      this.overtime = false;
      this.ownerId = capturer.sessionId;

      const prev = this.captureProgress.get(capturer.sessionId) ?? 0;
      const next = Math.min(100, prev + KOTH_CAPTURE_RATE_PER_SEC * dt);
      this.captureProgress.set(capturer.sessionId, next);
      if (next >= 100) {
        roundWinnerId = capturer.sessionId;
      }
    }

    let rotated = false;
    if (!this.overtime && roundWinnerId === null) {
      this.rotationTimer = Math.max(0, this.rotationTimer - dt);
      if (this.rotationTimer <= 0) {
        this.applyWaypoint(this.waypointIndex + 1);
        this.rotationTimer = KOTH_ROTATION_INTERVAL_SEC;
        rotated = true;
      }
    }

    return {
      roundWinnerId,
      rotated,
      snapshot: this.getSnapshot(),
    };
  }

  getSnapshot(): KothZoneSnapshot {
    const progressRecord: Record<string, number> = {};
    let maxProgress = 0;

    for (const [id, value] of this.captureProgress.entries()) {
      const rounded = Math.round(value * 10) / 10;
      progressRecord[id] = rounded;
      if (rounded > maxProgress) {
        maxProgress = rounded;
      }
    }

    const ownerProgress = this.ownerId
      ? (progressRecord[this.ownerId] ?? 0)
      : maxProgress;

    return {
      active: this.active,
      x: this.x,
      y: this.y,
      z: this.z,
      radius: this.radius,
      ownerId: this.ownerId,
      contested: this.contested,
      overtime: this.overtime,
      rotationTimer: Math.round(this.rotationTimer * 10) / 10,
      progress: ownerProgress,
      captureProgress: progressRecord,
    };
  }
}
