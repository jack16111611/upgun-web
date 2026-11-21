import type RAPIER from "@dimforge/rapier3d-compat";
import type { Collider, World } from "@dimforge/rapier3d-compat";
import {
  buildMapColliders,
  getArenaMap,
  NEON_FOUNDRY_MAP,
  type ArenaMapDefinition,
} from "@upgun/shared";

export class MapManager {
  private activeMap: ArenaMapDefinition = NEON_FOUNDRY_MAP;
  private staticColliders: Collider[] = [];

  get currentMap(): ArenaMapDefinition {
    return this.activeMap;
  }

  loadMap(rapier: typeof RAPIER, world: World, mapId: string): ArenaMapDefinition {
    for (const collider of this.staticColliders) {
      world.removeCollider(collider, false);
    }
    this.activeMap = getArenaMap(mapId);
    this.staticColliders = buildMapColliders(rapier, world, this.activeMap);
    return this.activeMap;
  }
}
