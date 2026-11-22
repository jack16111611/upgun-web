import type RAPIER from "@dimforge/rapier3d-compat";
import type {
  Collider,
  KinematicCharacterController,
  RigidBody,
  World,
} from "@dimforge/rapier3d-compat";
import {
  buildMapColliders,
  createInitialMovementState,
  createPlayerBodyAndCollider,
  createPlayerCharacterController,
  FIXED_DT_SEC,
  getArenaMap,
  initRapier,
  PLAYER_SPAWN_Y,
  stepPlayerMovement,
  SUNLIT_COURTYARD_MAP,
  type ArenaMapDefinition,
  type InputFrame,
  type JumpPadDefinition,
  type PlayerComputedStats,
  type PlayerMovementState,
  type Vec3,
} from "@upgun/shared";
import type { SyncedPlayerSnapshot } from "./worldRuntime";

const HARD_SNAP_DISTANCE = 2.5;
const RECONCILE_DRIFT_THRESHOLD = 0.35;
const RECONCILE_BLEND = 0.18;

export interface LocalStepCallbacks {
  onDash?: (dirX: number, dirZ: number) => void;
  onJumpPad?: (pad: JumpPadDefinition) => void;
  gravityMultiplier?: number;
  dashCooldownMultiplier?: number;
  extraJumpsBonus?: number;
  airControlMultiplier?: number;
  infiniteCooldowns?: boolean;
}

export class LocalPlayerPhysics {
  private rapier: typeof RAPIER | null = null;
  private world: World | null = null;
  private body: RigidBody | null = null;
  private collider: Collider | null = null;
  private controller: KinematicCharacterController | null = null;
  private staticColliders: Collider[] = [];
  private activeMap: ArenaMapDefinition = SUNLIT_COURTYARD_MAP;
  private disposed = false;

  readonly state: PlayerMovementState = createInitialMovementState(0, PLAYER_SPAWN_Y, 0);

  get isReady(): boolean {
    return this.world !== null && this.body !== null && this.collider !== null;
  }

  async init(initialMapId = SUNLIT_COURTYARD_MAP.id): Promise<void> {
    const rapier = await initRapier();
    if (this.disposed) {
      return;
    }

    const world = new rapier.World({ x: 0, y: -18.0, z: 0 });
    world.timestep = FIXED_DT_SEC;
    this.activeMap = getArenaMap(initialMapId);
    this.staticColliders = buildMapColliders(rapier, world, this.activeMap);

    const { body, collider } = createPlayerBodyAndCollider(
      rapier,
      world,
      this.state.x,
      this.state.y,
      this.state.z,
    );
    const controller = createPlayerCharacterController(world);

    world.propagateModifiedBodyPositionsToColliders();
    world.step();

    this.rapier = rapier;
    this.world = world;
    this.body = body;
    this.collider = collider;
    this.controller = controller;
  }

  syncMap(mapId: string): void {
    if (!this.rapier || !this.world || mapId === this.activeMap.id) {
      return;
    }
    for (const col of this.staticColliders) {
      this.world.removeCollider(col, false);
    }
    this.activeMap = getArenaMap(mapId);
    this.staticColliders = buildMapColliders(this.rapier, this.world, this.activeMap);
  }

  snapTo(x: number, y: number, z: number, vx = 0, vy = 0, vz = 0): void {
    this.state.x = x;
    this.state.y = y;
    this.state.z = z;
    this.state.vx = vx;
    this.state.vy = vy;
    this.state.vz = vz;
    this.state.isGrounded = false;
    this.state.dashTimeLeft = 0;

    if (this.body && this.world) {
      this.body.setTranslation({ x, y, z }, true);
      this.world.propagateModifiedBodyPositionsToColliders();
    }
  }

  step(
    input: InputFrame,
    dt: number,
    allowMovement: boolean,
    stats?: PlayerComputedStats,
    callbacks?: LocalStepCallbacks,
  ): void {
    if (!allowMovement || !this.world || !this.body || !this.collider || !this.controller) {
      return;
    }

    stepPlayerMovement({
      state: this.state,
      input,
      dt,
      controller: this.controller,
      collider: this.collider,
      body: this.body,
      world: this.world,
      stats,
      gravityMultiplier: callbacks?.gravityMultiplier ?? 1,
      dashCooldownMultiplier: callbacks?.dashCooldownMultiplier ?? 1,
      extraJumpsBonus: callbacks?.extraJumpsBonus ?? 0,
      airControlMultiplier: callbacks?.airControlMultiplier ?? 1,
      infiniteCooldowns: callbacks?.infiniteCooldowns ?? false,
      map: this.activeMap,
      onDash: callbacks?.onDash,
      onJumpPad: callbacks?.onJumpPad,
    });
    this.world.step();
  }

  reconcile(authoritative: SyncedPlayerSnapshot): void {
    const dx = authoritative.x - this.state.x;
    const dy = authoritative.y - this.state.y;
    const dz = authoritative.z - this.state.z;
    const horizDist = Math.hypot(dx, dz);
    const vertDist = Math.abs(dy);

    if (horizDist >= HARD_SNAP_DISTANCE || vertDist >= HARD_SNAP_DISTANCE) {
      this.snapTo(
        authoritative.x,
        authoritative.y,
        authoritative.z,
        authoritative.vx,
        authoritative.vy,
        authoritative.vz,
      );
      return;
    }

    let adjusted = false;
    let nextX = this.state.x;
    let nextY = this.state.y;
    let nextZ = this.state.z;

    if (horizDist > RECONCILE_DRIFT_THRESHOLD) {
      nextX += dx * RECONCILE_BLEND;
      nextZ += dz * RECONCILE_BLEND;
      adjusted = true;
    }

    if (vertDist > RECONCILE_DRIFT_THRESHOLD) {
      nextY += dy * RECONCILE_BLEND;
      adjusted = true;
    }

    if (adjusted) {
      this.state.x = nextX;
      this.state.y = nextY;
      this.state.z = nextZ;

      if (this.body && this.world) {
        this.body.setTranslation({ x: nextX, y: nextY, z: nextZ }, true);
        this.world.propagateModifiedBodyPositionsToColliders();
      }
    }
  }

  hasLineOfSight(from: Vec3, to: Vec3): boolean {
    if (!this.rapier || !this.world || !this.collider) {
      return true;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dy, dz);
    if (!Number.isFinite(dist) || dist <= 0.25) {
      return true;
    }
    const inv = 1 / dist;
    const ray = new this.rapier.Ray(
      { x: from.x, y: from.y, z: from.z },
      { x: dx * inv, y: dy * inv, z: dz * inv },
    );
    const hit = this.world.castRay(
      ray,
      Math.max(0.05, dist - 0.15),
      true,
      undefined,
      undefined,
      this.collider,
    );
    return hit === null;
  }

  dispose(): void {
    this.disposed = true;
    if (this.world) {
      this.world.free();
      this.world = null;
      this.rapier = null;
      this.body = null;
      this.collider = null;
      this.controller = null;
      this.staticColliders = [];
    }
  }
}
