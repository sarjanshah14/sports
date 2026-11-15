import { pickLuckyLoser, roundRobin, rollingRound, seededPairs, shuffle, swissDefaults, swissRound, type Method, type Options, type Pair } from "./draw";

// What happens after a round: who goes through, and the next draw. Pure and tested (npm run check).

export type Stage = "group" | "swiss" | "knockout" | "final3";
export type Status = "scheduled" | "live" | "done" | "bye" | "void";
export type M = {
  id: string;
  stage: Stage;
  round: number;
  no: number;
  grp: string | null;
  side_a: string | null;
  side_b: string | null;
  winner: string | null;
  status: Status;
  score: string | null;
};

/** "21-15, 19-21, 21-18" → sets and totals. Any "a-b", "a–b" or "a:b" counts as one set. */
export function parseScore(score: string | null) {
  if (!score) return null;
  const sets = [...score.matchAll(/(\d+)\s*[-–:]\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
  if (!sets.length) return null;
  return { sets, a: sets.reduce((t, s) => t + s[0], 0), b: sets.reduce((t, s) => t + s[1], 0) };
}

export const resolved = (m: M) => m.status === "done" || m.status === "bye" || m.status === "void";
const loserOf = (m: M) => (m.winner && m.side_b ? (m.winner === m.side_a ? m.side_b : m.side_a) : null);

/* ---------- standings (groups, final three, swiss) ---------- */

export type Row = { id: string; played: number; won: number; lost: number; diff: number; pts: number };

/** Points (2 a win), then point difference, then who won between the two. */
export function standings(ms: M[], ids: string[]): Row[] {
  const rows = new Map(ids.map((id) => [id, { id, played: 0, won: 0, lost: 0, diff: 0, pts: 0 }]));
  for (const m of ms) {
    if (m.status !== "done" || !m.side_a || !m.side_b) continue;
    const s = parseScore(m.score);
    for (const [me, them, mine] of [
      [m.side_a, m.side_b, s ? s.a - s.b : 0],
      [m.side_b, m.side_a, s ? s.b - s.a : 0],
    ] as const) {
      const r = rows.get(me);
      if (!r) continue;
      r.played++;
      r.diff += mine;
      if (m.winner === me) {
        r.won++;
        r.pts += 2;
      } else if (m.winner === them) r.lost++;
    }
  }
  const beat = (x: string, y: string) => ms.some((m) => m.status === "done" && m.winner === x && (m.side_a === y || m.side_b === y));
  return [...rows.values()].sort((x, y) => y.pts - x.pts || y.diff - x.diff || (beat(x.id, y.id) ? -1 : beat(y.id, x.id) ? 1 : 0));
}

/* ---------- next step ---------- */

export type Next =
  | { kind: "wait"; left: number }
  | { kind: "champion"; id: string }
  | { kind: "tie"; ids: string[] }
  | { kind: "round"; stage: Stage; round: number; pairs: Pair[]; note: string; lucky?: string };

const RANK: Record<Stage, number> = { group: 0, swiss: 0, knockout: 1, final3: 2 };

export function nextStep(method: Method, o: Options, all: M[], seed: string): Next {
  const ms = all.filter((m) => m.status !== "void");
  if (!ms.length) return { kind: "wait", left: 0 };
  const stage = ms.reduce<Stage>((s, m) => (RANK[m.stage] > RANK[s] ? m.stage : s), ms[0].stage);
  const inStage = ms.filter((m) => m.stage === stage);
  const round = Math.max(...inStage.map((m) => m.round));
  const cur = (stage === "group" ? inStage : inStage.filter((m) => m.round === round)).sort((a, b) => a.no - b.no);
  const left = cur.filter((m) => !resolved(m)).length;
  if (left) return { kind: "wait", left };

  if (stage === "final3") {
    const ids = [...new Set(cur.flatMap((m) => [m.side_a!, m.side_b!]))];
    const t = standings(cur, ids);
    if (t[0].pts === t[1].pts && t[0].diff === t[1].diff) return { kind: "tie", ids: t.filter((r) => r.pts === t[0].pts && r.diff === t[0].diff).map((r) => r.id) };
    return { kind: "champion", id: t[0].id };
  }

  if (stage === "group") {
    const per = o.groups?.perGroup ?? 2;
    const groups = new Map<string, string[]>();
    for (const m of cur) for (const id of [m.side_a!, m.side_b!]) groups.set(m.grp!, [...new Set([...(groups.get(m.grp!) ?? []), id])]);
    const tables = [...groups].map(([g, ids]) => ({ g, rows: standings(cur.filter((m) => m.grp === g), ids) }));
    const ranked: string[] = [];
    const home = new Map<string, string>();
    for (let place = 0; place < per; place++) {
      const atPlace = tables.filter((t) => t.rows[place]).map((t) => ({ ...t.rows[place], g: t.g }));
      atPlace.sort((x, y) => y.pts - x.pts || y.diff - x.diff);
      for (const r of atPlace) {
        ranked.push(r.id);
        home.set(r.id, r.g);
      }
    }
    if (ranked.length === 1) return { kind: "champion", id: ranked[0] };
    return { kind: "round", stage: "knockout", round: 1, pairs: avoidSameGroup(seededPairs(ranked), home), note: `Top ${per} from each group, seeded by points` };
  }

  if (stage === "swiss") {
    const s = o.swiss ?? swissDefaults(ms.length);
    const ids = [...new Set(inStage.flatMap((m) => [m.side_a, m.side_b]).filter(Boolean))] as string[];
    const points = new Map(ids.map((id) => [id, 0]));
    const hadBye = new Set<string>();
    const played = new Set<string>();
    for (const m of inStage) {
      if (m.winner) points.set(m.winner, (points.get(m.winner) ?? 0) + 1);
      if (m.status === "bye") hadBye.add(m.side_a!);
      if (m.side_a && m.side_b) played.add([m.side_a, m.side_b].sort().join("|"));
    }
    if (round < s.rounds) {
      const r = swissRound(ids.map((id) => ({ id, points: points.get(id)!, hadBye: hadBye.has(id) })), played, seed);
      return { kind: "round", stage: "swiss", round: round + 1, pairs: r.pairs, note: `Swiss round ${round + 1}: paired by score` };
    }
    const diff = new Map(standings(inStage, ids).map((r) => [r.id, r.diff]));
    const top = shuffle(ids, seed)
      .sort((x, y) => points.get(y)! - points.get(x)! || diff.get(y)! - diff.get(x)!)
      .slice(0, Math.min(s.cut, ids.length));
    return { kind: "round", stage: "knockout", round: 1, pairs: seededPairs(top), note: `Top ${top.length} after ${round} Swiss rounds` };
  }

  // Knockout. Winners in bracket order; a both-absent match leaves an empty slot.
  const slots = cur.map((m) => m.winner);
  const winners = slots.filter(Boolean) as string[];
  if (winners.length === 1) return { kind: "champion", id: winners[0] };
  if (!winners.length) return { kind: "wait", left: 0 };

  if (method === "rolling" || method === "lucky_loser") {
    if (method === "rolling" && winners.length === 3 && o.finalThree !== "bye_to_final") {
      const pairs = roundRobin(winners).flat().map(([a, b]) => ({ a, b }));
      return { kind: "round", stage: "final3", round: 1, pairs, note: "Last three: everyone plays everyone" };
    }
    if (method === "lucky_loser" && winners.length % 2) {
      const losers = cur
        .filter((m) => m.status === "done" && loserOf(m))
        .map((m) => {
          const s = parseScore(m.score);
          return { id: loserOf(m)!, margin: s ? Math.abs(s.a - s.b) : null };
        });
      if (losers.length) {
        const ll = pickLuckyLoser(losers, seed);
        const r = rollingRound([...winners, ll], new Set(), seed);
        return { kind: "round", stage: "knockout", round: round + 1, pairs: r.pairs, note: "Closest loser goes through as lucky loser", lucky: ll };
      }
    }
    const hadBye = new Set(ms.filter((m) => m.stage === "knockout" && m.status === "bye").map((m) => m.side_a!));
    const r = rollingRound(winners, hadBye, seed);
    return { kind: "round", stage: "knockout", round: round + 1, pairs: r.pairs, note: r.bye ? "One bye, drawn" : "No bye needed" };
  }

  // Fixed bracket: winner of match 1 meets winner of match 2, and so on.
  const pairs: Pair[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const [a, b] = [slots[i], slots[i + 1] ?? null];
    if (a || b) pairs.push(a && b ? { a, b } : { a: (a ?? b)!, b: null });
  }
  return { kind: "round", stage: "knockout", round: round + 1, pairs, note: "Bracket continues" };
}

/** First knockout round after groups: swap opponents so two players from one group don't meet straight away. */
function avoidSameGroup(pairs: Pair[], home: Map<string, string>) {
  const out = pairs.map((p) => ({ ...p }));
  const clash = (p: Pair) => !!p.b && home.get(p.a) === home.get(p.b);
  for (let i = 0; i < out.length; i++) {
    if (!clash(out[i])) continue;
    for (let j = 0; j < out.length; j++) {
      if (i === j || !out[j].b) continue;
      const [x, y] = [{ a: out[i].a, b: out[j].b }, { a: out[j].a, b: out[i].b }];
      if (!clash(x) && !clash(y)) {
        out[i] = x;
        out[j] = y;
        break;
      }
    }
  }
  return out;
}

/** Players whose opponent didn't show, paired among themselves (A vs D when B and C are missing). Odd one out gets the walkover. */
export function rePair(present: string[], seed: string) {
  const s = shuffle(present, seed);
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < s.length; i += 2) pairs.push({ a: s[i], b: s[i + 1] });
  return { pairs, walkover: s.length % 2 ? s[s.length - 1] : null };
}


/* ---------- committee overrides ---------- */

/** The stage and round being played now, and its matches (void ones left out). */
export function currentRound(all: M[]) {
  const ms = all.filter((m) => m.status !== "void");
  if (!ms.length) return null;
  const stage = ms.reduce<Stage>((s, m) => (RANK[m.stage] > RANK[s] ? m.stage : s), ms[0].stage);
  const round = Math.max(...ms.filter((m) => m.stage === stage).map((m) => m.round));
  return { stage, round, matches: ms.filter((m) => m.stage === stage && (stage === "group" || m.round === round)) };
}

/** Who goes through from a finished knockout round, and who could be brought back. */
export function advancers(all: M[]) {
  const cur = currentRound(all);
  if (!cur || cur.stage === "group" || cur.stage === "swiss" || !cur.matches.every(resolved)) return null;
  return {
    stage: cur.stage,
    round: cur.round,
    through: cur.matches.map((m) => m.winner).filter(Boolean) as string[],
    out: cur.matches.map(loserOf).filter(Boolean) as string[],
  };
}

/** Players in the current round whose matches haven't started: they can be re-paired. */
export function rearrangeable(all: M[]) {
  const cur = currentRound(all);
  if (!cur || cur.stage === "group") return [];
  return cur.matches.filter((m) => m.status === "scheduled" || m.status === "bye");
}

/** Checks a hand-made round: everyone placed exactly once, nobody missing or extra. */
export function validPairs(pairs: Pair[], ids: string[]) {
  const used = pairs.flatMap((p) => (p.b ? [p.a, p.b] : [p.a]));
  return used.length === ids.length && new Set(used).size === used.length && used.every((id) => ids.includes(id));
}
