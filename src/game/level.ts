export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const GROUND_TOP = 1000;
export const WORLD_W = 7800;
export const WORLD_H = 1500;
export const DEATH_Y = 1440;

export const ARENA = { x1: 5560, x2: 7000 };

/** Solid geometry: top-left based rectangles. kind picks the texture. */
export const SOLIDS: Array<Rect & { kind: "ground" | "plat" }> = [
  // R1 Awakening chamber
  { x: -60, y: GROUND_TOP, w: 960, h: 440, kind: "ground" },
  { x: -60, y: 300, w: 60, h: 720, kind: "ground" },
  { x: 320, y: 860, w: 190, h: 28, kind: "plat" },
  { x: 620, y: 780, w: 190, h: 28, kind: "plat" },

  // R2 Broken passage
  { x: 900, y: GROUND_TOP, w: 400, h: 440, kind: "ground" },
  { x: 1400, y: GROUND_TOP, w: 520, h: 440, kind: "ground" },
  { x: 1290, y: 1120, w: 120, h: 320, kind: "ground" },
  { x: 1120, y: 850, w: 170, h: 28, kind: "plat" },
  { x: 1420, y: 830, w: 200, h: 28, kind: "plat" },

  // R3 Lantern shaft (vertical)
  { x: 1920, y: GROUND_TOP, w: 700, h: 440, kind: "ground" },
  { x: 1990, y: 880, w: 170, h: 28, kind: "plat" },
  { x: 2250, y: 760, w: 170, h: 28, kind: "plat" },
  { x: 2000, y: 640, w: 170, h: 28, kind: "plat" },
  { x: 2280, y: 520, w: 210, h: 28, kind: "plat" },
  { x: 2520, y: 640, w: 180, h: 28, kind: "plat" },

  // R4 Shattered gap (dash required) - raised ledges
  { x: 2620, y: 880, w: 430, h: 560, kind: "ground" },
  { x: 3300, y: 880, w: 510, h: 560, kind: "ground" },

  // R5 Sentinel hall
  { x: 3810, y: GROUND_TOP, w: 900, h: 440, kind: "ground" },
  { x: 3810, y: 880, w: 90, h: 130, kind: "ground" },
  { x: 4000, y: 830, w: 180, h: 28, kind: "plat" },
  { x: 4320, y: 760, w: 200, h: 28, kind: "plat" },

  // R6 Lantern shrine
  { x: 4710, y: GROUND_TOP, w: 620, h: 440, kind: "ground" },

  // R7 Rootbound gate corridor
  { x: 5330, y: GROUND_TOP, w: 300, h: 440, kind: "ground" },
  { x: 5150, y: 700, w: 170, h: 28, kind: "plat" },

  // R8 Guardian arena
  { x: 5630, y: GROUND_TOP, w: 1400, h: 440, kind: "ground" },
  { x: 5700, y: 800, w: 170, h: 28, kind: "plat" },
  { x: 6800, y: 800, w: 170, h: 28, kind: "plat" },

  // R9 Heart chamber
  { x: 7030, y: GROUND_TOP, w: 780, h: 440, kind: "ground" },
  { x: 7740, y: 300, w: 60, h: 740, kind: "ground" },
];

export const HAZARDS: Rect[] = [
  { x: 1000, y: GROUND_TOP - 26, w: 128, h: 26 },
  { x: 4180, y: GROUND_TOP - 26, w: 128, h: 26 },
];

export interface EnemySpawn {
  type: "crawler" | "wisp" | "sentinel";
  x: number;
  y: number;
  range?: number;
}

export const ENEMIES: EnemySpawn[] = [
  { type: "crawler", x: 1180, y: 940, range: 170 },
  { type: "crawler", x: 1600, y: 940, range: 200 },
  { type: "wisp", x: 2180, y: 700 },
  { type: "wisp", x: 2420, y: 520 },
  { type: "crawler", x: 2900, y: 820, range: 160 },
  { type: "sentinel", x: 4050, y: 930, range: 220 },
  { type: "crawler", x: 4450, y: 940, range: 180 },
  { type: "wisp", x: 4380, y: 700 },
  { type: "sentinel", x: 4600, y: 930, range: 160 },
];

export interface Prop {
  key: string;
  x: number;
  y: number;
  scale?: number;
  depth?: "back" | "front";
  alpha?: number;
}

export const PROPS: Prop[] = [
  { key: "prop_lantern_post", x: 220, y: GROUND_TOP },
  { key: "prop_statue", x: 700, y: GROUND_TOP },
  { key: "prop_mushroom", x: 430, y: GROUND_TOP },
  { key: "prop_crystal", x: 1000, y: GROUND_TOP },
  { key: "prop_gear", x: 1750, y: GROUND_TOP - 30, scale: 1.2 },
  { key: "prop_mushroom", x: 1560, y: GROUND_TOP },
  { key: "prop_lantern_post", x: 1980, y: GROUND_TOP },
  { key: "prop_crystal", x: 2560, y: GROUND_TOP },
  { key: "prop_mushroom", x: 2300, y: GROUND_TOP },
  { key: "prop_lantern_post", x: 2760, y: 880 },
  { key: "prop_crystal", x: 3600, y: 880 },
  { key: "prop_statue", x: 3900, y: GROUND_TOP },
  { key: "prop_gear", x: 4250, y: GROUND_TOP - 20 },
  { key: "prop_mushroom", x: 4650, y: GROUND_TOP },
  { key: "prop_lantern_post", x: 4900, y: GROUND_TOP },
  { key: "prop_lantern_post", x: 5250, y: GROUND_TOP },
  { key: "prop_statue", x: 5450, y: GROUND_TOP },
  { key: "prop_crystal", x: 5560, y: GROUND_TOP },
  { key: "prop_gear", x: 5900, y: GROUND_TOP - 40, scale: 1.6 },
  { key: "prop_statue", x: 6700, y: GROUND_TOP },
  { key: "prop_mushroom", x: 7150, y: GROUND_TOP },
  { key: "prop_crystal", x: 7600, y: GROUND_TOP },
];

export const SHRINE = { x: 4980, y: GROUND_TOP };
export const PORTAL = { x: 7500, y: GROUND_TOP };
export const START = { x: 140, y: 900 };
export const BOSS_POS = { x: 6600, y: GROUND_TOP };

export interface Hint {
  id: string;
  x: number;
  y: number;
  text: string;
}

export const HINTS: Hint[] = [
  { id: "move", x: 180, y: 880, text: "A / D  ·  Move" },
  { id: "jump", x: 520, y: 870, text: "SPACE  ·  Jump  —  hold to rise higher" },
  { id: "airjump", x: 760, y: 720, text: "SPACE again in mid-air  ·  Lantern Leap" },
  { id: "attack", x: 1080, y: 880, text: "J or LEFT-CLICK  ·  Strike  (3-hit combo)" },
  { id: "dash", x: 2860, y: 760, text: "K / SHIFT  ·  Dash across the gap" },
  { id: "shrine", x: 4930, y: 880, text: "Lantern Shrine — touch to rest" },
  { id: "boss", x: 5680, y: 860, text: "Something ancient stirs ahead..." },
];

export const ROOM_LABELS: Array<{ x: number; text: string }> = [
  { x: 120, text: "I · AWAKENING CHAMBER" },
  { x: 1000, text: "II · BROKEN PASSAGE" },
  { x: 2000, text: "III · LANTERN SHAFT" },
  { x: 2700, text: "IV · SHATTERED GAP" },
  { x: 3900, text: "V · SENTINEL HALL" },
  { x: 4800, text: "VI · LANTERN SHRINE" },
  { x: 5350, text: "VII · ROOTBOUND GATE" },
  { x: 5700, text: "VIII · GUARDIAN ARENA" },
  { x: 7100, text: "IX · HEART CHAMBER" },
];
