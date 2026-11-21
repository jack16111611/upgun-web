import { WEAPON_GRENADE } from "../../../constants";
import type { CardDefinition } from "../../types";

export const martyrdomCard: CardDefinition = {
  id: "martyrdom",
  name: "Martyrdom",
  category: "survival",
  rarity: "common",
  maxLevel: 5,
  icon: "☠️",
  description: (level) =>
    `Upon death, drop ${level} live frag ${level === 1 ? "grenade" : "grenades"} (1.35s fuse) at your position.`,
  statSummary: (level) =>
    `Drop ${level} ${level === 1 ? "Grenade" : "Grenades"} on Death • 1.35s Fuse`,
  onDeath: (ctx, level) => {
    const count = Math.max(1, level);
    const maxDamage = Math.round(WEAPON_GRENADE.maxDamage * ctx.stats.damageMultiplier);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const cosA = count > 1 ? Math.cos(angle) : 0;
      const sinA = count > 1 ? Math.sin(angle) : 0;
      const spreadOffset = count > 1 ? 0.35 : 0;
      const spreadSpeed = count > 1 ? 3.8 : 0;

      ctx.spawnGrenadeAtDeath({
        origin: {
          x: ctx.position.x + cosA * spreadOffset,
          y: ctx.position.y + 0.35,
          z: ctx.position.z + sinA * spreadOffset,
        },
        velocity: {
          x: cosA * spreadSpeed,
          y: count > 1 ? 4.0 : 3.2,
          z: sinA * spreadSpeed,
        },
        fuseSec: 1.35,
        maxDamage,
        splashRadius: WEAPON_GRENADE.splashRadius,
        radius: WEAPON_GRENADE.radius,
        restitution: WEAPON_GRENADE.restitution,
        sticky: false,
      });
    }
  },
};
