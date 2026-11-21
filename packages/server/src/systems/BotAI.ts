import type { ArenaState } from "../schema/ArenaState";
import type { PlayerEntity } from "./PlayerEntity";

export function updateBotInput(
  bot: PlayerEntity,
  players: Map<string, PlayerEntity>,
  state: ArenaState,
  dt: number,
): void {
  bot.botElapsedSec += dt;

  let nearestHuman: PlayerEntity | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;
  for (const player of players.values()) {
    if (player.isBot || !player.schema.isAlive) {
      continue;
    }
    const dx = player.movement.x - bot.movement.x;
    const dz = player.movement.z - bot.movement.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < nearestDistSq) {
      nearestDistSq = d2;
      nearestHuman = player;
    }
  }

  if (nearestHuman) {
    const dx = nearestHuman.movement.x - bot.movement.x;
    const dz = nearestHuman.movement.z - bot.movement.z;
    bot.latestInput.yaw = Math.atan2(-dx, -dz);
  }

  bot.latestInput.pitch = 0;
  bot.latestInput.moveX =
    state.phase === "combat" ? Math.sin(bot.botElapsedSec * 1.4) * 0.65 : 0;
  bot.latestInput.moveZ = 0;
  bot.latestInput.jump = false;
  bot.latestInput.dash = false;
  bot.latestInput.fire = false;
  bot.latestInput.grenade = false;
  bot.latestInput.reload = false;
}
