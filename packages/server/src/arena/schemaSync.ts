import type { ArenaPropsSnapshot } from "./propTypes";
import { BarrelState, OrbState, type ArenaState } from "../schema/ArenaState";

export function syncArenaPropsToSchema(
  state: ArenaState,
  snapshots: ArenaPropsSnapshot,
): void {
  const seenBarrels = new Set<string>();
  for (const b of snapshots.barrels) {
    seenBarrels.add(b.id);
    let schema = state.barrels.get(b.id);
    if (!schema) {
      schema = new BarrelState();
      schema.id = b.id;
      state.barrels.set(b.id, schema);
    }
    schema.x = b.x;
    schema.y = b.y;
    schema.z = b.z;
    schema.hp = b.hp;
    schema.maxHp = b.maxHp;
    schema.alive = b.isIntact;
  }
  for (const key of [...state.barrels.keys()]) {
    if (!seenBarrels.has(key)) {
      state.barrels.delete(key);
    }
  }

  const seenOrbs = new Set<string>();
  for (const o of snapshots.orbs) {
    seenOrbs.add(o.id);
    let schema = state.orbs.get(o.id);
    if (!schema) {
      schema = new OrbState();
      schema.id = o.id;
      state.orbs.set(o.id, schema);
    }
    schema.x = o.x;
    schema.y = o.y;
    schema.z = o.z;
    schema.active = o.isActive;
    schema.respawnTimer = o.respawnTimer;
  }
  for (const key of [...state.orbs.keys()]) {
    if (!seenOrbs.has(key)) {
      state.orbs.delete(key);
    }
  }
}
