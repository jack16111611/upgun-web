import type { Room } from "@colyseus/sdk";
import {
  computePlayerStats,
  DEFAULT_BODY_COLOR,
  DEFAULT_HAT_ID,
  DUMMY_SESSION_ID,
  INITIAL_DRAFT_REROLLS,
  PLAYER_MAX_HP,
  PLAYER_SPAWN_Y,
  sanitizeBodyColor,
  sanitizeBotDifficulty,
  sanitizeDeviceType,
  sanitizeGameMode,
  sanitizeHatId,
  SUNLIT_COURTYARD_MAP,
  WEAPON_RIFLE,
  type MatchPhase,
  type OwnedCard,
} from "@upgun/shared";
import { soundEngine } from "../audio/soundEngine";
import {
  arenaPropsRuntime,
  getDefaultTeleportersForMap,
  type SyncedBarrel,
  type SyncedOrb,
} from "../components/arena";
import type { MatchVictoryPlayer } from "../components/match";
import {
  worldRuntime,
  type SyncedGrenadeSnapshot,
  type SyncedPlayerSnapshot,
} from "../game/worldRuntime";
import {
  useGameStore,
  type DraftPlayerStatus,
  type ScoreboardRow,
} from "../store/gameStore";
import type { RawArenaState, RawOwnedCard, RawPlayerState } from "./rawStateTypes";

export type { RawArenaState, RawOwnedCard, RawPlayerState } from "./rawStateTypes";

function readOwnedCards(raw?: Iterable<RawOwnedCard>): OwnedCard[] {
  if (!raw) return [];
  const result: OwnedCard[] = [];
  for (const item of raw) {
    if (item && typeof item.cardId === "string" && item.cardId.length > 0) {
      result.push({ cardId: item.cardId, level: item.level ?? 1 });
    }
  }
  return result;
}

function readDraftChoices(raw?: Iterable<string>): string[] {
  if (!raw) return [];
  const result: string[] = [];
  for (const id of raw) {
    if (typeof id === "string" && id.length > 0) result.push(id);
  }
  return result;
}

export class ArenaStateSync {
  private prevRoundNumber = -1;
  private prevPhase: MatchPhase | null = null;
  private prevLocalAlive = false;
  private prevLocalReloading = false;
  private prevGrenadeCooldown = 0;
  private hasInitialLocalSnap = false;
  private prevRemoteKey = "";

  reset(): void {
    this.prevRoundNumber = -1;
    this.prevPhase = null;
    this.prevLocalAlive = false;
    this.prevLocalReloading = false;
    this.prevGrenadeCooldown = 0;
    this.hasInitialLocalSnap = false;
    this.prevRemoteKey = "";
  }

  apply(room: Room, rawState: RawArenaState): void {
    const localId = room.sessionId;
    const nextPlayers = new Map<string, SyncedPlayerSnapshot>();
    const remoteIds: string[] = [];
    const scoreboardRows: ScoreboardRow[] = [];
    const matchStandings: MatchVictoryPlayer[] = [];
    const draftStatuses: DraftPlayerStatus[] = [];
    let humanCount = 0;
    let botCount = 0;
    let hasDummy = false;
    let localRaw: RawPlayerState | null = null;

    rawState.players?.forEach((p, key) => {
      const deviceType = sanitizeDeviceType(p.deviceType);
      const displayName = p.displayName || key;
      const maxHp = p.maxHp ?? PLAYER_MAX_HP;
      const bodyColor = p.bodyColor
        ? sanitizeBodyColor(p.bodyColor)
        : p.color || DEFAULT_BODY_COLOR;
      const hatId = p.hatId ? sanitizeHatId(p.hatId) : DEFAULT_HAT_ID;
      const snap: SyncedPlayerSnapshot = {
        sessionId: p.sessionId || key,
        displayName,
        deviceType,
        color: bodyColor,
        bodyColor,
        hatId,
        isBot: Boolean(p.isBot),
        x: p.x ?? 0,
        y: p.y ?? PLAYER_SPAWN_Y,
        z: p.z ?? 0,
        vx: p.vx ?? 0,
        vy: p.vy ?? 0,
        vz: p.vz ?? 0,
        yaw: p.yaw ?? 0,
        pitch: p.pitch ?? 0,
        hp: p.hp ?? maxHp,
        maxHp,
        isAlive: p.isAlive ?? true,
        kills: p.kills ?? 0,
        score: p.score ?? 0,
      };
      nextPlayers.set(key, snap);

      const playerCards = readOwnedCards(p.ownedCards);
      scoreboardRows.push({
        sessionId: snap.sessionId,
        displayName: snap.displayName,
        deviceType: snap.deviceType,
        isBot: snap.isBot,
        color: snap.color,
        score: snap.score,
        kills: snap.kills,
        hp: snap.hp,
        maxHp: snap.maxHp,
        isAlive: snap.isAlive,
      });
      matchStandings.push({
        sessionId: snap.sessionId,
        displayName: snap.displayName,
        bodyColor: snap.bodyColor,
        hatId: snap.hatId,
        score: snap.score,
        kills: snap.kills,
        meleeKills: p.meleeKills ?? 0,
        cardCount: playerCards.length,
        isBot: snap.isBot,
      });
      draftStatuses.push({
        sessionId: snap.sessionId,
        displayName: snap.displayName,
        hasPicked: Boolean(p.hasPickedDraft),
        isBot: snap.isBot,
      });

      if (snap.isBot || key === DUMMY_SESSION_ID) {
        hasDummy = true;
        botCount += 1;
      } else {
        humanCount += 1;
      }

      if (key === localId) localRaw = p;
      else remoteIds.push(key);
    });

    const sortByRank = <T extends { score: number; kills: number; displayName: string }>(
      a: T,
      b: T,
    ) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.displayName.localeCompare(b.displayName);
    };
    scoreboardRows.sort(sortByRank);
    matchStandings.sort(sortByRank);

    const nextGrenades = new Map<string, SyncedGrenadeSnapshot>();
    rawState.grenades?.forEach((g, key) => {
      nextGrenades.set(key, {
        id: g.id || key,
        ownerId: g.ownerId || "",
        x: g.x ?? 0,
        y: g.y ?? 0,
        z: g.z ?? 0,
        fuseLeft: g.fuseLeft ?? 0,
      });
    });

    const mapId = rawState.mapId || SUNLIT_COURTYARD_MAP.id;
    const nextBarrels = new Map<string, SyncedBarrel>();
    rawState.barrels?.forEach((b, key) => {
      const id = b.id || key;
      nextBarrels.set(id, {
        id,
        x: b.x ?? 0,
        y: b.y ?? 0,
        z: b.z ?? 0,
        hp: b.hp ?? 40,
        maxHp: b.maxHp ?? 40,
        isIntact: Boolean(b.alive),
      });
    });
    const nextOrbs = new Map<string, SyncedOrb>();
    rawState.orbs?.forEach((o, key) => {
      const id = o.id || key;
      nextOrbs.set(id, {
        id,
        x: o.x ?? 0,
        y: o.y ?? 0,
        z: o.z ?? 0,
        isActive: Boolean(o.active),
        respawnTimer: o.respawnTimer ?? 0,
      });
    });

    arenaPropsRuntime.mapId = mapId;
    arenaPropsRuntime.barrels = nextBarrels;
    arenaPropsRuntime.orbs = nextOrbs;
    arenaPropsRuntime.teleporters = [...getDefaultTeleportersForMap(mapId)];

    worldRuntime.players = nextPlayers;
    worldRuntime.grenades = nextGrenades;
    worldRuntime.phase = rawState.phase || "lobby";
    worldRuntime.mapId = mapId;

    const rawLocal = localRaw as RawPlayerState | null;
    if (rawLocal) {
      if (rawLocal.isReloading && !this.prevLocalReloading) soundEngine.playReload();
      const nextGrenadeCd = rawLocal.grenadeCooldown ?? 0;
      if (nextGrenadeCd > this.prevGrenadeCooldown + 0.5) soundEngine.playGrenadeThrow();
      this.prevLocalReloading = Boolean(rawLocal.isReloading);
      this.prevGrenadeCooldown = nextGrenadeCd;
    }

    const ownedCards = readOwnedCards(rawLocal?.ownedCards);
    const draftChoices = readDraftChoices(rawLocal?.draftChoices);
    worldRuntime.localStats = computePlayerStats(ownedCards);

    const localPlayer = nextPlayers.get(localId);
    if (localPlayer) {
      const roundReset =
        rawState.roundNumber !== this.prevRoundNumber ||
        (rawState.phase === "countdown" && this.prevPhase !== "countdown") ||
        (localPlayer.isAlive && !this.prevLocalAlive);

      if (!this.hasInitialLocalSnap || roundReset) {
        worldRuntime.needsSpawnSnap = true;
        worldRuntime.pendingSpawnYaw = localPlayer.yaw;
        this.hasInitialLocalSnap = true;
      }
      this.prevLocalAlive = localPlayer.isAlive;
    }

    this.prevRoundNumber = rawState.roundNumber;
    this.prevPhase = rawState.phase;

    remoteIds.sort();
    const remoteKey = remoteIds.join("|");
    const store = useGameStore.getState();
    if (remoteKey !== this.prevRemoteKey) {
      this.prevRemoteKey = remoteKey;
      store.setRemotePlayerIds(remoteIds);
    }

    const winnerName = rawState.winnerSessionId
      ? nextPlayers.get(rawState.winnerSessionId)?.displayName ?? rawState.winnerSessionId
      : "";
    const rawKoth = rawState.kothZone;
    const kothOwnerId = rawKoth?.ownerId ?? "";
    const kothOwnerName = kothOwnerId
      ? nextPlayers.get(kothOwnerId)?.displayName ?? kothOwnerId
      : "";

    store.syncHudSnapshot({
      phase: rawState.phase || "lobby",
      phaseTimer: rawState.phaseTimer ?? 0,
      roundNumber: rawState.roundNumber ?? 0,
      winnerSessionId: rawState.winnerSessionId ?? "",
      winnerName,
      matchChampionId: rawState.matchChampionId ?? "",
      mapId,
      gameMode: sanitizeGameMode(rawState.gameMode),
      botDifficulty: sanitizeBotDifficulty(rawState.botDifficulty),
      weaponTier: rawLocal?.weaponTier ?? 0,
      kothZone: {
        active: Boolean(rawKoth?.active),
        x: rawKoth?.x ?? 0,
        y: rawKoth?.y ?? 0,
        z: rawKoth?.z ?? 0,
        radius: rawKoth?.radius ?? 4.2,
        ownerId: kothOwnerId,
        ownerName: kothOwnerName,
        contested: Boolean(rawKoth?.contested),
        overtime: Boolean(rawKoth?.overtime),
        progress: rawKoth?.progress ?? 0,
        rotationTimer: rawKoth?.rotationTimer ?? 30,
      },
      isPrivateRoom: Boolean(rawState.isPrivate),
      cheatsEnabled: Boolean(rawState.cheatsEnabled),
      moonGravity: Boolean(rawState.moonGravity),
      bigHead: Boolean(rawState.bigHead),
      playerCount: nextPlayers.size,
      humanCount,
      botCount,
      hasDummy,
      hp: rawLocal?.hp ?? PLAYER_MAX_HP,
      maxHp: rawLocal?.maxHp ?? PLAYER_MAX_HP,
      overshield: rawLocal?.overshield ?? 0,
      isAlive: rawLocal?.isAlive ?? true,
      ammo: rawLocal?.ammo ?? WEAPON_RIFLE.magazineSize,
      magSize: rawLocal?.magSize ?? WEAPON_RIFLE.magazineSize,
      isReloading: rawLocal?.isReloading ?? false,
      dashCooldown: rawLocal?.dashCooldown ?? 0,
      grenadeCooldown: rawLocal?.grenadeCooldown ?? 0,
      meleeCooldown: rawLocal?.meleeCooldown ?? 0,
      godMode: Boolean(rawLocal?.godMode),
      infiniteMode: Boolean(rawLocal?.infiniteMode),
      kills: rawLocal?.kills ?? 0,
      score: rawLocal?.score ?? 0,
      ownedCards,
      draftChoices,
      hasPickedDraft: Boolean(rawLocal?.hasPickedDraft),
      rerollsRemaining: rawLocal?.rerollsRemaining ?? INITIAL_DRAFT_REROLLS,
      draftStatuses,
      scoreboardRows,
      matchStandings,
    });
  }
}
