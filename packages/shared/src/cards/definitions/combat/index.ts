import type { CardDefinition } from "../../types";
import { bigBadaBoomCard } from "./big_bada_boom";
import { clusterBombCard } from "./cluster_bomb";
import { frostRoundsCard } from "./frost_rounds";
import { grapplingPulseCard } from "./grappling_pulse";
import { gravityWellCard } from "./gravity_well";
import { heavyCaliberCard } from "./heavy_caliber";
import { incendiaryCoreCard } from "./incendiary_core";
import { lastChamberCard } from "./last_chamber";
import { multishotCard } from "./multishot";
import { quickPinCard } from "./quick_pin";
import { railPiercerCard } from "./rail_piercer";
import { rapidBoltCard } from "./rapid_bolt";
import { ricochetRoundsCard } from "./ricochet_rounds";
import { stickyGrenadeCard } from "./sticky_grenade";

export {
  bigBadaBoomCard,
  clusterBombCard,
  frostRoundsCard,
  grapplingPulseCard,
  gravityWellCard,
  heavyCaliberCard,
  incendiaryCoreCard,
  lastChamberCard,
  multishotCard,
  quickPinCard,
  railPiercerCard,
  rapidBoltCard,
  ricochetRoundsCard,
  stickyGrenadeCard,
};

export const COMBAT_CARDS: readonly CardDefinition[] = [
  multishotCard,
  ricochetRoundsCard,
  lastChamberCard,
  heavyCaliberCard,
  rapidBoltCard,
  frostRoundsCard,
  railPiercerCard,
  stickyGrenadeCard,
  clusterBombCard,
  gravityWellCard,
  bigBadaBoomCard,
  quickPinCard,
  incendiaryCoreCard,
  grapplingPulseCard,
];
