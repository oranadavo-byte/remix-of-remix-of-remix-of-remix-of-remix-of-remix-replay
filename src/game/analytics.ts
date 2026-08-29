/**
 * Device-local gameplay analytics.
 *
 * Every meaningful beat (entering a chamber, dying, buying a skill, felling the
 * Guardian) is appended to a capped event log in localStorage. Nothing leaves
 * the device — the /stats page reads the same log back and aggregates it so you
 * can see where players stall and re-tune difficulty.
 */

export type GameEventType =
  | "session_start"
  | "room_enter"
  | "death"
  | "skill_unlock"
  | "boss_engage"
  | "boss_defeat"
  | "victory";

export interface GameEvent {
  /** epoch ms */
  t: number;
  type: GameEventType;
  /** chamber index (0-based) where relevant */
  room?: number;
  /** skill id for skill_unlock */
  skill?: string;
  /** resulting rank for skill_unlock */
  rank?: number;
  /** elapsed run time in ms where relevant */
  ms?: number;
}

const KEY = "noct_analytics_v1";
const MAX_EVENTS = 3000;

function canStore() {
  return typeof localStorage !== "undefined";
}

export function readEvents(): GameEvent[] {
  if (!canStore()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameEvent[]) : [];
  } catch {
    return [];
  }
}

export function track(type: GameEventType, data: Omit<GameEvent, "t" | "type"> = {}) {
  if (!canStore()) return;
  try {
    const events = readEvents();
    events.push({ t: Date.now(), type, ...data });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    /* storage full or blocked — gameplay continues untracked */
  }
}

export function clearEvents() {
  if (!canStore()) return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- aggregation ---------- */

export interface AnalyticsSummary {
  totalEvents: number;
  sessions: number;
  deaths: number;
  victories: number;
  bossEngagements: number;
  deepestRoom: number;
  firstSeen: number | null;
  lastSeen: number | null;
  /** deaths per chamber index */
  deathsByRoom: number[];
  /** number of distinct sessions that reached each chamber */
  reachedByRoom: number[];
  /** skill id -> times ranked up */
  skillPicks: Array<{ skill: string; count: number }>;
  /** median run length to victory, ms */
  bestVictoryMs: number | null;
}

export function summarize(events: GameEvent[], roomCount: number): AnalyticsSummary {
  const deathsByRoom = new Array<number>(roomCount).fill(0);
  const reachedByRoom = new Array<number>(roomCount).fill(0);
  const skills = new Map<string, number>();

  let sessions = 0;
  let deaths = 0;
  let victories = 0;
  let bossEngagements = 0;
  let deepestRoom = 0;
  let bestVictoryMs: number | null = null;

  let sessionRooms = new Set<number>();
  const flushSession = () => {
    sessionRooms.forEach((r) => {
      if (r >= 0 && r < roomCount) reachedByRoom[r]! += 1;
    });
    sessionRooms = new Set<number>();
  };

  for (const e of events) {
    const room = typeof e.room === "number" ? Math.max(0, Math.min(roomCount - 1, e.room)) : null;
    switch (e.type) {
      case "session_start":
        flushSession();
        sessions += 1;
        break;
      case "room_enter":
        if (room !== null) {
          sessionRooms.add(room);
          deepestRoom = Math.max(deepestRoom, room);
        }
        break;
      case "death":
        deaths += 1;
        if (room !== null) deathsByRoom[room]! += 1;
        break;
      case "skill_unlock":
        if (e.skill) skills.set(e.skill, (skills.get(e.skill) ?? 0) + 1);
        break;
      case "boss_engage":
        bossEngagements += 1;
        break;
      case "boss_defeat":
        break;
      case "victory":
        victories += 1;
        if (typeof e.ms === "number") {
          bestVictoryMs = bestVictoryMs === null ? e.ms : Math.min(bestVictoryMs, e.ms);
        }
        break;
    }
  }
  flushSession();

  return {
    totalEvents: events.length,
    sessions,
    deaths,
    victories,
    bossEngagements,
    deepestRoom,
    firstSeen: events.length ? events[0]!.t : null,
    lastSeen: events.length ? events[events.length - 1]!.t : null,
    deathsByRoom,
    reachedByRoom,
    skillPicks: [...skills.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count),
    bestVictoryMs,
  };
}
