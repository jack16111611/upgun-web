import type { CardDefinition } from "../../types";
import { deflectorCoreCard } from "./deflector_core";
import { executionerCard } from "./executioner";
import { plasmaKatanaCard } from "./plasma_katana";
import { seismicSlamCard } from "./seismic_slam";
import { shadowLungeCard } from "./shadow_lunge";
import { vampiricBladeCard } from "./vampiric_blade";

export {
  deflectorCoreCard,
  executionerCard,
  plasmaKatanaCard,
  seismicSlamCard,
  shadowLungeCard,
  vampiricBladeCard,
};

export const MELEE_CARDS: readonly CardDefinition[] = [
  plasmaKatanaCard,
  shadowLungeCard,
  deflectorCoreCard,
  vampiricBladeCard,
  seismicSlamCard,
  executionerCard,
];
