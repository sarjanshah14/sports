import { entrants, type Participant } from "./dummy";
import { SPORTS, type Sport } from "./sports";

// ponytail: frozen fake "afternoon of 22 Dec" so the screens have live/done/next states to render.
// Real fixtures come from the draw engine + database in phases 2–4.

export const EVENT = {
  code: "482913",
  name: "Hostel Sports Week",
  edition: "2025",
  start: "2025-12-22",
  end: "2025-12-28",
  now: "2025-12-22T15:40:00+05:30",
};

export type MatchStatus = "done" | "live" | "next" | "scheduled";

export type Match = {
  id: string;
  sport: string;
  round: number;
  no: number;
  a: string;
  b?: string; // undefined = bye
  unit?: number;
  time: string; // "15:20"
  status: MatchStatus;
  winner?: "a" | "b";
  score?: string; // optional detail; many results are winner-only
};

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const UNITS: Record<string, number> = { chess: 6, carrom: 4, "table-tennis": 4, badminton: 2, pickleball: 2 };
const START: Record<string, number> = { chess: 14 * 60, carrom: 14 * 60, "table-tennis": 10 * 60, badminton: 18 * 60, pickleball: 10 * 60 };
const SLOT: Record<string, number> = { chess: 30, carrom: 25, "table-tennis": 15, badminton: 20, pickleball: 20 };
const TODAY = new Set(["chess", "carrom"]);

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function sides(sport: Sport): string[] {
  const people = shuffle(entrants(sport.slug), sport.slug.length * 7919);
  if (sport.kind === "singles") return people.map((p) => p.name);
  if (sport.kind === "doubles") {
    const out: string[] = [];
    for (let i = 0; i < people.length; i += 2) out.push(people[i + 1] ? `${first(people[i])} & ${first(people[i + 1])}` : first(people[i]));
    return out;
  }
  return []; // team sports: teams come from the offline auction sheet
}

const first = (p: Participant) => p.name.split(" ")[0] + " " + p.name.split(" ")[1][0] + ".";

function roundOne(sport: Sport): Match[] {
  const s = sides(sport);
  if (!s.length) return [];
  const units = UNITS[sport.slug];
  const out: Match[] = [];
  for (let i = 0, no = 1; i < s.length; i += 2, no++) {
    const slot = Math.floor((no - 1) / units);
    out.push({
      id: `${sport.slug}-r1-${no}`,
      sport: sport.slug,
      round: 1,
      no,
      a: s[i],
      b: s[i + 1],
      unit: s[i + 1] ? ((no - 1) % units) + 1 : undefined,
      time: hhmm(START[sport.slug] + slot * SLOT[sport.slug]),
      status: "scheduled",
    });
  }
  if (!TODAY.has(sport.slug)) return out;

  // Afternoon of day 1: first slots finished, one slot on the boards, one slot called next.
  const now = 15 * 60 + 40;
  for (const m of out) {
    const [h, mm] = m.time.split(":").map(Number);
    const start = h * 60 + mm;
    if (!m.b) { m.status = "done"; m.winner = "a"; continue; }
    if (start + SLOT[sport.slug] <= now) {
      m.status = "done";
      m.winner = (m.no * 7) % 3 === 0 ? "b" : "a";
      if (m.no % 3 !== 0) m.score = sport.slug === "carrom" ? (m.winner === "a" ? `29–${8 + (m.no % 17)}` : `${6 + (m.no % 19)}–29`) : m.winner === "a" ? "1–0" : "0–1";
    } else if (start <= now) m.status = "live";
    else if (start <= now + SLOT[sport.slug]) m.status = "next";
  }
  return out;
}

export const MATCHES: Match[] = SPORTS.flatMap(roundOne);

export const matchesFor = (slug: string) => MATCHES.filter((m) => m.sport === slug);

export function sportSummary(sport: Sport) {
  const ms = matchesFor(sport.slug);
  const sideCount = sport.kind === "team" ? 0 : sides(sport).length;
  return {
    entries: entrants(sport.slug).length,
    sides: sideCount,
    rounds: sideCount > 1 ? Math.ceil(Math.log2(sideCount)) : 0,
    done: ms.filter((m) => m.status === "done" && m.b).length,
    live: ms.filter((m) => m.status === "live").length,
    total: ms.filter((m) => m.b).length,
    state: TODAY.has(sport.slug) ? ("live" as const) : sport.kind === "team" ? ("teams" as const) : ("drawn" as const),
  };
}
