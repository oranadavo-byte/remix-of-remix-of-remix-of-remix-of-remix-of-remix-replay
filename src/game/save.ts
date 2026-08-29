/**
 * Persistent player progress + settings (localStorage).
 * Everything the player unlocks survives a reload: skills, masks, soul,
 * room progress and the last lit shrine.
 */

export type ActionName =
  | "left"
  | "right"
  | "jump"
  | "attack"
  | "dash"
  | "spell"
  | "focus"
  | "pause";

export type Binds = Record<ActionName, string>;

export const DEFAULT_BINDS: Binds = {
  left: "A",
  right: "D",
  jump: "SPACE",
  attack: "J",
  dash: "K",
  spell: "L",
  focus: "S",
  pause: "ESC",
};

export const ACTION_LABELS: Array<[ActionName, string]> = [
  ["left", "Move left"],
  ["right", "Move right"],
  ["jump", "Jump"],
  ["attack", "Strike"],
  ["dash", "Dash"],
  ["spell", "Spirit blast"],
  ["focus", "Focus / mend"],
  ["pause", "Pause"],
];

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  screenShake: number;
  binds: Binds;
}

export interface SaveData {
  version: number;
  maxHp: number;
  soul: number;
  kills: number;
  deaths: number;
  points: number;
  spent: number;
  ranks: Record<string, number>;
  shrineLit: boolean;
  bossDefeated: boolean;
  room: number;
  checkpoint: { x: number; y: number } | null;
  playMs: number;
  updatedAt: number;
}

const SAVE_KEY = "noct_save_v1";
const SET_KEY = "noct_settings_v1";

export const DEFAULT_SETTINGS: Settings = {
  master: 0.7,
  music: 0.6,
  sfx: 0.85,
  screenShake: 1,
  binds: { ...DEFAULT_BINDS },
};

export function emptySave(): SaveData {
  return {
    version: 1,
    maxHp: 5,
    soul: 0,
    kills: 0,
    deaths: 0,
    points: 0,
    spent: 0,
    ranks: {},
    shrineLit: false,
    bossDefeated: false,
    room: 0,
    checkpoint: null,
    playMs: 0,
    updatedAt: 0,
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — play on without saving */
  }
}

/* ---------- settings ---------- */

let settingsCache: Settings | null = null;

export function getSettings(): Settings {
  if (!settingsCache) {
    const s = read<Settings>(SET_KEY, DEFAULT_SETTINGS);
    s.binds = { ...DEFAULT_BINDS, ...(s.binds ?? {}) };
    settingsCache = s;
  }
  return settingsCache;
}

export function saveSettings(patch: Partial<Settings>) {
  const s = { ...getSettings(), ...patch };
  settingsCache = s;
  write(SET_KEY, s);
  return s;
}

export function resetBinds() {
  return saveSettings({ binds: { ...DEFAULT_BINDS } });
}

/* ---------- save game ---------- */

let saveCache: SaveData | null = null;

export function getSave(): SaveData {
  if (!saveCache) saveCache = read<SaveData>(SAVE_KEY, emptySave());
  return saveCache;
}

export function hasSave() {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function writeSave(patch: Partial<SaveData>) {
  const s = { ...getSave(), ...patch, updatedAt: Date.now() };
  saveCache = s;
  write(SAVE_KEY, s);
  return s;
}

export function clearSave() {
  saveCache = emptySave();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
  return saveCache;
}

export function formatPlayTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
