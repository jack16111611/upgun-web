import type RAPIER from "@dimforge/rapier3d-compat";
import type {
  Collider,
  KinematicCharacterController,
  RigidBody,
  World,
} from "@dimforge/rapier3d-compat";
import {
  computePlayerStats,
  createBasePlayerStats,
  createEmptyInputFrame,
  createInitialMovementState,
  createPlayerBodyAndCollider,
  createPlayerCharacterController,
  DEFAULT_HAT_ID,
  getCardDefinition,
  INITIAL_DRAFT_REROLLS,
  PLAYER_MAX_JUMPS,
  type DeviceType,
  type HatId,
  type InputFrame,
  type OwnedCard,
  type PlayerComputedStats,
  type PlayerMovementState,
  type SpawnPoint,
  type Vec3,
} from "@upgun/shared";
import { OwnedCardState, PlayerState } from "../schema/ArenaState";
import { PlayerStatusEffects } from "./PlayerStatus";

export class PlayerEntity {
  readonly sessionId: string;
  readonly isBot: boolean;
  readonly schema: PlayerState;
  readonly body: RigidBody;
  readonly collider: Collider;
  readonly controller: KinematicCharacterController;
  readonly movement: PlayerMovementState;
  readonly status = new PlayerStatusEffects();

  ownedCards: OwnedCard[] = [];
  temporaryCards: OwnedCard[] = [];
  stats: PlayerComputedStats = createBasePlayerStats();

  latestInput: InputFrame = createEmptyInputFrame();
  fireCooldownSec = 0;
  reloadTimerSec = 0;
  grenadeCooldownSec = 0;
  grenadeHeld = false;
  meleeCooldownSec = 0;
  meleeHeld = false;
  reflectShotsTimerSec = 0;
  seismicSlamPending: { damage: number; radius: number } | null = null;
  botElapsedSec = 0;

  constructor(
    rapier: typeof RAPIER,
    world: World,
    sessionId: string,
    displayName: string,
    deviceType: DeviceType,
    bodyColor: string,
    spawn: SpawnPoint,
    isBot = false,
    hatId: HatId = DEFAULT_HAT_ID,
  ) {
    this.sessionId = sessionId;
    this.isBot = isBot;

    const [sx, sy, sz] = spawn.position;
    const { body, collider } = createPlayerBodyAndCollider(rapier, world, sx, sy, sz);
    this.body = body;
    this.collider = collider;
    this.controller = createPlayerCharacterController(world);
    this.movement = createInitialMovementState(sx, sy, sz);

    this.schema = new PlayerState();
    this.schema.sessionId = sessionId;
    this.schema.displayName = displayName;
    this.schema.deviceType = deviceType;
    this.schema.color = bodyColor;
    this.schema.bodyColor = bodyColor;
    this.schema.hatId = hatId;
    this.schema.isBot = isBot;
    this.latestInput.yaw = spawn.yaw;
    this.recomputeStats();
    this.respawnAt(spawn, world);
  }

  get effectiveCards(): readonly OwnedCard[] {
    return this.temporaryCards.length === 0
      ? this.ownedCards
      : [...this.ownedCards, ...this.temporaryCards];
  }

  get secondWindAvailable(): boolean {
    return this.status.secondWindAvailable;
  }
  set secondWindAvailable(val: boolean) {
    this.status.secondWindAvailable = val;
  }
  get timeSinceDamageSec(): number {
    return this.status.timeSinceDamageSec;
  }
  set timeSinceDamageSec(val: number) {
    this.status.timeSinceDamageSec = val;
  }
  get burnTimerSec(): number {
    return this.status.burnTimerSec;
  }
  set burnTimerSec(val: number) {
    this.status.burnTimerSec = val;
  }
  get burnDps(): number {
    return this.status.burnDps;
  }
  set burnDps(val: number) {
    this.status.burnDps = val;
  }
  get burnAccumDamage(): number {
    return this.status.burnAccumDamage;
  }
  set burnAccumDamage(val: number) {
    this.status.burnAccumDamage = val;
  }
  get burnAttackerId(): string | null {
    return this.status.burnAttackerId;
  }

  setCosmetics(hatId: HatId, bodyColor: string): void {
    this.schema.hatId = hatId;
    this.schema.bodyColor = bodyColor;
    this.schema.color = bodyColor;
  }

  recomputeStats(): void {
    const prevMaxHp = this.stats.maxHp;
    this.stats = computePlayerStats(this.effectiveCards);
    this.schema.maxHp = this.stats.maxHp;
    this.schema.magSize = this.stats.magSize;

    if (this.schema.isAlive && this.stats.maxHp > prevMaxHp) {
      this.schema.hp = Math.min(
        this.stats.maxHp,
        this.schema.hp + (this.stats.maxHp - prevMaxHp),
      );
    } else if (this.schema.hp > this.stats.maxHp) {
      this.schema.hp = this.stats.maxHp;
    }

    if (this.schema.ammo > this.stats.magSize) {
      this.schema.ammo = this.stats.magSize;
    }
  }

  grantTemporaryCard(cardId: string, level: number): void {
    if (!getCardDefinition(cardId)) return;
    this.temporaryCards.push({ cardId, level });
    this.recomputeStats();
  }

  clearTemporaryCards(): void {
    if (this.temporaryCards.length > 0) {
      this.temporaryCards = [];
      this.recomputeStats();
    }
  }

  addOrUpgradeCard(cardId: string): boolean {
    const def = getCardDefinition(cardId);
    if (!def) return false;

    const existing = this.ownedCards.find((c) => c.cardId === cardId);
    if (existing) {
      if (existing.level >= def.maxLevel) return false;
      existing.level += 1;
      for (const schemaCard of this.schema.ownedCards) {
        if (schemaCard.cardId === cardId) {
          schemaCard.level = existing.level;
          break;
        }
      }
    } else {
      this.ownedCards.push({ cardId, level: 1 });
      const cardSchema = new OwnedCardState();
      cardSchema.cardId = cardId;
      cardSchema.level = 1;
      this.schema.ownedCards.push(cardSchema);
    }

    this.recomputeStats();
    return true;
  }

  resetMatchCards(): void {
    this.ownedCards = [];
    this.temporaryCards = [];
    this.schema.ownedCards.clear();
    this.schema.draftChoices.clear();
    this.schema.hasPickedDraft = false;
    this.schema.rerollsRemaining = INITIAL_DRAFT_REROLLS;
    this.recomputeStats();
  }

  heal(amount: number): void {
    if (!this.schema.isAlive || amount <= 0) return;
    this.schema.hp = Math.min(this.stats.maxHp, this.schema.hp + Math.round(amount));
  }

  reloadBullets(bullets: number): void {
    if (!this.schema.isAlive || bullets <= 0) return;
    const nextAmmo = Math.min(this.stats.magSize, this.schema.ammo + Math.round(bullets));
    this.schema.ammo = nextAmmo;
    if (nextAmmo >= this.stats.magSize && this.schema.isReloading) {
      this.schema.isReloading = false;
      this.reloadTimerSec = 0;
    }
  }

  refillMagazine(): void {
    this.schema.ammo = this.stats.magSize;
    this.schema.isReloading = false;
    this.reloadTimerSec = 0;
  }

  resetCooldowns(): void {
    this.movement.dashCooldown = 0;
    this.grenadeCooldownSec = 0;
  }

  applyExternalImpulse(impulse: Vec3): void {
    const ix = Number.isFinite(impulse.x) ? Math.max(-45, Math.min(45, impulse.x)) : 0;
    const iy = Number.isFinite(impulse.y) ? Math.max(-45, Math.min(45, impulse.y)) : 0;
    const iz = Number.isFinite(impulse.z) ? Math.max(-45, Math.min(45, impulse.z)) : 0;
    this.movement.vx = Math.max(-55, Math.min(55, this.movement.vx + ix));
    this.movement.vy = Math.max(-45, Math.min(45, this.movement.vy + iy));
    this.movement.vz = Math.max(-55, Math.min(55, this.movement.vz + iz));
    if (iy > 0.5) this.movement.isGrounded = false;
  }

  teleportTo(x: number, y: number, z: number, world: World): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    const safeX = Math.max(-60, Math.min(60, x));
    const safeY = Math.max(-5, Math.min(60, y));
    const safeZ = Math.max(-60, Math.min(60, z));
    this.movement.x = safeX;
    this.movement.y = safeY;
    this.movement.z = safeZ;
    this.body.setTranslation({ x: safeX, y: safeY, z: safeZ }, true);
    world.propagateModifiedBodyPositionsToColliders();
  }

  applySlow(factor: number, durationSec: number): void {
    this.status.applySlow(factor, durationSec);
  }
  applySpeedBoost(multiplier: number, durationSec: number): void {
    this.status.applySpeedBoost(multiplier, durationSec);
  }
  applyBurn(dps: number, durationSec: number, attackerId: string | null): void {
    this.status.applyBurn(dps, durationSec, attackerId);
  }
  setInvulnerable(durationSec: number): void {
    this.status.setInvulnerable(durationSec);
  }
  isInvulnerable(): boolean {
    return this.status.isInvulnerable();
  }
  getSpeedMultiplier(): number {
    return this.status.getSpeedMultiplier();
  }

  stepStatusEffects(dt: number): void {
    this.status.step(
      dt,
      this.schema.isAlive,
      this.schema.hp,
      this.stats.maxHp,
      this.stats.regenPerSec,
      this.stats.regenDelaySec,
      (amt) => this.heal(amt),
    );
  }

  respawnAt(spawn: SpawnPoint, world: World): void {
    const [sx, sy, sz] = spawn.position;
    this.movement.x = sx;
    this.movement.y = sy;
    this.movement.z = sz;
    this.movement.vx = 0;
    this.movement.vy = 0;
    this.movement.vz = 0;
    this.movement.isGrounded = false;
    this.movement.groundedTimeSec = 0;
    this.movement.jumpsRemaining = PLAYER_MAX_JUMPS + this.stats.extraJumps;
    this.movement.jumpHeld = false;
    this.movement.dashHeld = false;
    this.movement.dashCooldown = 0;
    this.movement.dashTimeLeft = 0;
    this.movement.jumpPadCooldown = 0;

    this.fireCooldownSec = 0;
    this.reloadTimerSec = 0;
    this.grenadeCooldownSec = 0;
    this.grenadeHeld = false;
    this.meleeCooldownSec = 0;
    this.meleeHeld = false;
    this.reflectShotsTimerSec = 0;
    this.seismicSlamPending = null;
    this.botElapsedSec = 0;
    this.status.reset();

    this.latestInput.yaw = spawn.yaw;
    this.latestInput.pitch = 0;
    this.body.setTranslation({ x: sx, y: sy, z: sz }, true);
    world.propagateModifiedBodyPositionsToColliders();

    this.schema.hp = this.stats.maxHp;
    this.schema.maxHp = this.stats.maxHp;
    this.schema.isAlive = true;
    this.schema.ammo = this.stats.magSize;
    this.schema.magSize = this.stats.magSize;
    this.schema.isReloading = false;
    this.syncToSchema();
  }

  syncToSchema(): void {
    this.schema.x = this.movement.x;
    this.schema.y = this.movement.y;
    this.schema.z = this.movement.z;
    this.schema.vx = this.movement.vx;
    this.schema.vy = this.movement.vy;
    this.schema.vz = this.movement.vz;
    this.schema.yaw = this.latestInput.yaw;
    this.schema.pitch = this.latestInput.pitch;
    this.schema.dashCooldown = Math.max(0, this.movement.dashCooldown);
    this.schema.grenadeCooldown = Math.max(0, this.grenadeCooldownSec);
    this.schema.meleeCooldown = Math.max(0, this.meleeCooldownSec);
  }

  dispose(world: World): void {
    world.removeCharacterController(this.controller);
    world.removeRigidBody(this.body);
  }
}
