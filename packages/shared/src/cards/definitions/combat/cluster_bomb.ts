import { MAX_RECURSION_DEPTH } from "../../../constants";
import type { CardDefinition } from "../../types";

export const clusterBombCard: CardDefinition = {
  id: "cluster_bomb",
  name: "Cluster Bomb",
  category: "grenade",
  rarity: "epic",
  maxLevel: 5,
  icon: "🧨",
  description: (level) =>
    `Detonating grenades burst into ${2 + level} micro-bomblets radially (0.45s fuse, 40% damage each).`,
  statSummary: (level) => `+${2 + level} Micro-Bomblets • 0.45s Fuse • 40% DMG`,
  onGrenadeExplode: (ctx, level) => {
    if (ctx.recursionDepth >= MAX_RECURSION_DEPTH) {
      return;
    }

    const count = 2 + level;
    const angleOffset = (ctx.recursionDepth + 1) * 0.5;
    const spreadSpeed = 7.4;
    const childMaxDamage = Math.max(1, Math.round(ctx.maxDamage * 0.4));
    const childSplashRadius = Math.max(2.0, ctx.radius * 0.6);

    for (let i = 0; i < count; i++) {
      const angle = angleOffset + (i / count) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      ctx.spawnChildGrenade({
        origin: {
          x: ctx.position.x + cosA * 0.28,
          y: ctx.position.y + 0.22,
          z: ctx.position.z + sinA * 0.28,
        },
        velocity: {
          x: cosA * spreadSpeed,
          y: 4.8,
          z: sinA * spreadSpeed,
        },
        fuseSec: 0.45,
        maxDamage: childMaxDamage,
        splashRadius: childSplashRadius,
        radius: 0.11,
        restitution: 0.55,
        sticky: false,
      });
    }
  },
};
