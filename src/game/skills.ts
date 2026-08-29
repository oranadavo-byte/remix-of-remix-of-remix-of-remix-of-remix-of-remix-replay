import { TUNE } from "./config";
import { getSave, writeSave } from "./save";
import { track } from "./analytics";

export interface SkillDef {
  id: string;
  name: string;
  blurb: string;
  maxRank: number;
  cost: number;
  requires?: string;
  /** grid position in the tree UI */
  col: number;
  row: number;
  tint: number;
  effect: (rank: number) => string;
}

export const SKILLS: SkillDef[] = [
  {
    id: "leap",
    name: "Lantern Leap",
    blurb: "The lantern lightens you; each rank pushes your jump higher.",
    maxRank: 3,
    cost: 1,
    col: 0,
    row: 0,
    tint: 0xffb347,
    effect: (r) => `+${r * 7}% jump height`,
  },
  {
    id: "updraft",
    name: "Updraft",
    blurb: "Your second wing beats harder and floats you longer.",
    maxRank: 2,
    cost: 2,
    requires: "leap",
    col: 0,
    row: 1,
    tint: 0xffd89b,
    effect: (r) => `+${r * 9}% air-jump, ${r * 6}% slower fall`,
  },
  {
    id: "edge",
    name: "Keen Edge",
    blurb: "Sharpen the nail. Every strike bites deeper.",
    maxRank: 3,
    cost: 1,
    col: 1,
    row: 0,
    tint: 0x8fd8d2,
    effect: (r) => `+${r} strike damage`,
  },
  {
    id: "tempo",
    name: "Quickening",
    blurb: "Chain strikes faster and recover sooner.",
    maxRank: 2,
    cost: 2,
    requires: "edge",
    col: 1,
    row: 1,
    tint: 0x6fb3ad,
    effect: (r) => `-${r * 12}% attack recovery`,
  },
  {
    id: "swiftwind",
    name: "Swiftwind",
    blurb: "The shade dash returns to you sooner.",
    maxRank: 3,
    cost: 1,
    col: 2,
    row: 0,
    tint: 0xa89bc4,
    effect: (r) => `-${r * 18}% dash cooldown`,
  },
  {
    id: "focusflow",
    name: "Soulflow",
    blurb: "Focus and spirit blast cost less soul.",
    maxRank: 2,
    cost: 2,
    requires: "swiftwind",
    col: 2,
    row: 1,
    tint: 0xa89bc4,
    effect: (r) => `-${r * 6} soul per cast`,
  },
  {
    id: "reaper",
    name: "Soul Reaper",
    blurb: "Slain creatures give up more of their light.",
    maxRank: 3,
    cost: 1,
    col: 3,
    row: 0,
    tint: 0xffe9c4,
    effect: (r) => `+${r} drop, +${r * 8}% shard chance`,
  },
  {
    id: "vitality",
    name: "Carved Mask",
    blurb: "Bind another mask to your face.",
    maxRank: 2,
    cost: 3,
    requires: "reaper",
    col: 3,
    row: 1,
    tint: 0xffb347,
    effect: (r) => `+${r} maximum mask`,
  },
];

export interface Mods {
  jumpVel: number;
  airJumpVel: number;
  jumpHoldGravityMult: number;
  attackRecoverMs: number;
  comboWindowMs: number;
  attackDamage: number;
  dashCooldownMs: number;
  soulCost: number;
  bonusMaxHp: number;
  dropBonus: number;
  shardChance: number;
}

export function ranksOf(): Record<string, number> {
  return getSave().ranks ?? {};
}

export function rankOf(id: string) {
  return ranksOf()[id] ?? 0;
}

export function computeMods(ranks: Record<string, number> = ranksOf()): Mods {
  const r = (id: string) => ranks[id] ?? 0;
  return {
    jumpVel: TUNE.jumpVel * (1 + r("leap") * 0.07),
    airJumpVel: TUNE.airJumpVel * (1 + r("updraft") * 0.09),
    jumpHoldGravityMult: TUNE.jumpHoldGravityMult * (1 - r("updraft") * 0.06),
    attackRecoverMs: TUNE.attackRecoverMs * (1 - r("tempo") * 0.12),
    comboWindowMs: TUNE.comboWindowMs * (1 + r("tempo") * 0.12),
    attackDamage: 1 + r("edge"),
    dashCooldownMs: TUNE.dashCooldownMs * (1 - r("swiftwind") * 0.18),
    soulCost: Math.max(12, 33 - r("focusflow") * 6),
    bonusMaxHp: r("vitality"),
    dropBonus: r("reaper"),
    shardChance: 0.06 + r("reaper") * 0.08,
  };
}

export function canUnlock(def: SkillDef) {
  const save = getSave();
  const rank = rankOf(def.id);
  if (rank >= def.maxRank) return { ok: false, why: "mastered" };
  if (def.requires && rankOf(def.requires) < 1) {
    const req = SKILLS.find((s) => s.id === def.requires);
    return { ok: false, why: `needs ${req?.name ?? def.requires}` };
  }
  if (save.points < def.cost) return { ok: false, why: `needs ${def.cost} ember` };
  return { ok: true, why: "" };
}

export function unlock(def: SkillDef) {
  const check = canUnlock(def);
  if (!check.ok) return false;
  const save = getSave();
  const ranks = { ...(save.ranks ?? {}) };
  ranks[def.id] = (ranks[def.id] ?? 0) + 1;
  writeSave({ ranks, points: save.points - def.cost, spent: save.spent + def.cost });
  track("skill_unlock", { skill: def.id, rank: ranks[def.id] ?? 1 });
  return true;
}

export function respec() {
  const save = getSave();
  writeSave({ ranks: {}, points: save.points + save.spent, spent: 0 });
}

/** Embers (skill points) are earned steadily from kills. */
export const KILLS_PER_POINT = 4;
