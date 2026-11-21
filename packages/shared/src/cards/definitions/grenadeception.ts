import { MAX_RECURSION_DEPTH, WEAPON_GRENADE } from "../../constants";
import type { CardDefinition } from "../types";

export const grenadeceptionCard: CardDefinition = {
  id: "grenadeception",
  name: "Grenadeception",
  category: "grenade",
  rarity: "epic",
  maxLevel: 5,
  icon: "💣",
  description: (level) =>
    `Detonating grenades split into ${1 + level} mini-grenades (0.65s fuse, 50% damage) that inherit all your grenade upgrades.`,
  statSummary: (level) =>
    `+${1 + level} Split Grenades • 0.65s Fuse • 50% DMG`,
  onGrenadeExplode: (ctx, level) => {
    if (ctx.recursionDepth >= MAX_RECURSION_DEPTH) {
      return;
    }

    const count = 1 + level;
    const angleOffset = (ctx.recursionDepth + 1) * 0.65;
    const spreadSpeed = 6.2;
    const childMaxDamage = Math.max(1, Math.round(ctx.maxDamage * 0.5));
    const childSplashRadius = Math.max(2.2, ctx.radius * 0.72);
    const childBodyRadius = Math.max(0.11, WEAPON_GRENADE.radius * 0.72);

    for (let i = 0; i < count; i++) {
      const angle = angleOffset + (i / count) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      ctx.spawnChildGrenade({
        origin: {
          x: ctx.position.x + cosA * 0.32,
          y: ctx.position.y + 0.25,
          z: ctx.position.z + sinA * 0.32,
        },
        velocity: {
          x: cosA * spreadSpeed,
          y: 5.4,
          z: sinA * spreadSpeed,
        },
        fuseSec: 0.65,
        maxDamage: childMaxDamage,
        splashRadius: childSplashRadius,
        radius: childBodyRadius,
        restitution: 0.62,
        sticky: false,
      });
    }
  },
};
