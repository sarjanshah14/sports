// The draw engine. Pure functions, no database: same input + same seed = same draw,
// so anyone can re-run a published draw and check it. Self-check: npm run check.

export type Method = "standard" | "rolling" | "lucky_loser" | "groups" | "swiss";

export const METHODS: { id: Method; name: string; short: string; how: string }[] = [
  {
    id: "rolling",
    name: "Rolling bye",
    short: "At most one bye per round",
    how: "Each round, if the number left is odd, one player is drawn for a bye. Nobody gets two byes. Each round is drawn when the one before it ends.",
  },
  {
    id: "lucky_loser",
    name: "Lucky loser",
    short: "Closest loser goes through instead of a bye",
    how: "When a round ends with an odd number of winners, the loser who lost by the smallest margin also goes through. Only round 1 can have a bye, and only if the entry count is odd.",
  },
  {
    id: "groups",
    name: "Groups → knockout",
    short: "No byes at all",
    how: "Everyone plays a small round robin group. The top finishers make a knockout whose size is a power of 2, so it never needs a bye.",
  },
  {
    id: "swiss",
    name: "Swiss → knockout",
    short: "Nobody is out early",
    how: "Everyone plays a few rounds against people with the same score. Odd rounds give one bye (worth a win) to the lowest-ranked player who hasn't had one. The top players then play a knockout.",
  },
  {
    id: "standard",
    name: "Standard bracket",
    short: "All byes in round 1",
    how: "The textbook way: round up to the next power of 2 and give the difference as byes in round 1, spread so no two byes meet. The whole bracket is known on day one.",
  },
];

/* ---------- randomness ---------- */

/** FNV-1a: turns the public seed text into a 32-bit number. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates. Callers pass items in a fixed public order (by name) so the result is reproducible. */
export function shuffle<T>(items: T[], seed: string): T[] {
  const r = rng(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(n, 1)));
export const prevPow2 = (n: number) => 2 ** Math.floor(Math.log2(Math.max(n, 1)));

/* ---------- pairings ---------- */

export type Pair = { a: string; b: string | null }; // b null = bye

/** Random pairs for doubles. An odd count leaves one person out, flagged for the committee. */
export function randomPairs(ids: string[], seed: string) {
  const s = shuffle(ids, seed);
  const pairs: [string, string][] = [];
  for (let i = 0; i + 1 < s.length; i += 2) pairs.push([s[i], s[i + 1]]);
  return { pairs, leftover: s.length % 2 ? s[s.length - 1] : null };
}

/** Classic bracket order: seed numbers by slot, e.g. 8 → [1,8,4,5,2,7,3,6]. Seed s always meets P+1−s first. */
export function bracketOrder(P: number): number[] {
  let order = [1];
  while (order.length < P) {
    const size = order.length * 2;
    order = order.flatMap((s) => [s, size + 1 - s]);
  }
  return order;
}

/** Standard: byes all in round 1. Byes go to draw positions 1..byes, each paired against a real player. */
export function standardRound1(ids: string[], seed: string): Pair[] {
  const drawn = shuffle(ids, seed);
  const P = nextPow2(drawn.length);
  const order = bracketOrder(P);
  const pairs: Pair[] = [];
  for (let i = 0; i < P; i += 2) {
    const [x, y] = [order[i], order[i + 1]];
    const a = drawn[x - 1] ?? null;
    const b = drawn[y - 1] ?? null;
    pairs.push(a ? { a, b } : { a: b!, b: null });
  }
  return pairs;
}

/** One knockout round with at most one bye, never to someone who already had one (unless everyone has). */
export function rollingRound(ids: string[], hadBye: Set<string>, seed: string): { pairs: Pair[]; bye: string | null } {
  const s = shuffle(ids, seed);
  let bye: string | null = null;
  if (s.length % 2) {
    const fresh = s.filter((id) => !hadBye.has(id));
    bye = (fresh.length ? fresh : s)[0];
    s.splice(s.indexOf(bye), 1);
  }
  const pairs: Pair[] = [];
  for (let i = 0; i < s.length; i += 2) pairs.push({ a: s[i], b: s[i + 1] });
  if (bye) pairs.push({ a: bye, b: null });
  return { pairs, bye };
}

/** Lucky loser: smallest losing margin goes through. Unknown margins (winner-only results) rank last; ties are drawn. */
export function pickLuckyLoser(losers: { id: string; margin: number | null }[], seed: string): string {
  const s = shuffle(losers, seed);
  s.sort((x, y) => (x.margin ?? Infinity) - (y.margin ?? Infinity));
  return s[0].id;
}

/* ---------- groups ---------- */

/** Splits into `count` groups whose sizes differ by at most one. */
export function makeGroups(ids: string[], count: number, seed: string): string[][] {
  const s = shuffle(ids, seed);
  const groups: string[][] = Array.from({ length: count }, () => []);
  s.forEach((id, i) => groups[i % count].push(id));
  return groups;
}

/** Circle method: every pair meets once, nobody plays twice in a round. Returns rounds of pairs. */
export function roundRobin(ids: string[]): [string, string][][] {
  const list: (string | null)[] = [...ids];
  if (list.length % 2) list.push(null);
  const n = list.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) round.push([a, b]);
    }
    rounds.push(round);
    list.splice(1, 0, list.pop()!); // rotate all but the first
  }
  return rounds;
}

export const groupLabel = (i: number) => String.fromCharCode(65 + i);

/* ---------- swiss ---------- */

export type SwissPlayer = { id: string; points: number; hadBye: boolean };

/** Pairs players with equal-ish scores, avoiding rematches when possible. */
export function swissRound(players: SwissPlayer[], played: Set<string>, seed: string): { pairs: Pair[]; bye: string | null } {
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const ranked = shuffle(players, seed).sort((x, y) => y.points - x.points);
  let bye: string | null = null;
  if (ranked.length % 2) {
    const pool = [...ranked].reverse();
    const pick = pool.find((p) => !p.hadBye) ?? pool[0];
    bye = pick.id;
    ranked.splice(ranked.indexOf(pick), 1);
  }
  const left = ranked.map((p) => p.id);
  const pairs: Pair[] = [];
  while (left.length) {
    const a = left.shift()!;
    const j = left.findIndex((b) => !played.has(key(a, b)));
    const [b] = left.splice(j >= 0 ? j : 0, 1);
    pairs.push({ a, b });
  }
  if (bye) pairs.push({ a: bye, b: null });
  return { pairs, bye };
}

/* ---------- planner ---------- */

export type GroupConfig = { groups: number; perGroup: number; sizes: number[]; matches: number; knockout: number };

/** Group setups that feed a clean power-of-2 knockout, cheapest first. */
export function groupConfigs(n: number): GroupConfig[] {
  const out: GroupConfig[] = [];
  for (let Q = 2; Q <= n / 2; Q *= 2)
    for (const q of [1, 2]) {
      const G = Q / q;
      if (G < 1 || !Number.isInteger(G) || n / G < 3 || n / G > 6) continue;
      const sizes = Array.from({ length: G }, (_, i) => Math.floor(n / G) + (i < n % G ? 1 : 0));
      const matches = sizes.reduce((t, s) => t + (s * (s - 1)) / 2, 0) + (Q - 1);
      out.push({ groups: G, perGroup: q, sizes, matches, knockout: Q });
    }
  return out.sort((a, b) => a.matches - b.matches);
}

export type Options = {
  courts: number;
  slot: number; // minutes per match incl. changeover
  groups?: { groups: number; perGroup: number };
  swiss?: { rounds: number; cut: number };
  finalThree?: "round_robin" | "bye_to_final";
};

export type Plan = { method: Method; byes: number; matches: number; rounds: number; minutes: number; note: string; fields: number[] };

const slots = (matches: number, courts: number) => Math.ceil(matches / Math.max(courts, 1));

export function swissDefaults(n: number) {
  return { rounds: Math.min(5, Math.max(3, Math.ceil(Math.log2(n)) - 2)), cut: Math.max(2, Math.min(16, prevPow2(Math.floor(n / 4)))) };
}

export function plan(n: number, o: Options): Plan[] {
  const out: Plan[] = [];
  if (n < 2) return out;

  // Standard
  const P = nextPow2(n);
  {
    const fields: number[] = [];
    let mins = 0;
    for (let f = n, first = true; f > 1; first = false) {
      fields.push(f);
      const m = first ? n - P / 2 : f / 2;
      mins += slots(m, o.courts) * o.slot;
      f = first ? P / 2 : f / 2;
    }
    out.push({ method: "standard", byes: P - n, matches: n - 1, rounds: fields.length, minutes: mins, fields, note: `${P - n} byes in round 1` });
  }

  // Rolling
  {
    const fields: number[] = [];
    let byes = 0;
    let mins = 0;
    for (let f = n; f > 1; f = Math.ceil(f / 2)) {
      fields.push(f);
      byes += f % 2;
      mins += slots(Math.floor(f / 2), o.courts) * o.slot;
    }
    out.push({ method: "rolling", byes, matches: n - 1, rounds: fields.length, minutes: mins, fields, note: `${byes} byes in total, never two to one person` });
  }

  // Lucky loser
  {
    const fields: number[] = [];
    let mins = 0;
    let extra = 0;
    let f = n;
    let first = true;
    while (f > 1) {
      fields.push(f);
      const m = Math.floor(f / 2);
      mins += slots(m, o.courts) * o.slot;
      let next = m + (first ? f % 2 : 0); // only round 1 can carry a bye
      if (next > 1 && next % 2) {
        next += 1; // add the lucky loser
        extra++;
      }
      f = next;
      first = false;
    }
    out.push({ method: "lucky_loser", byes: n % 2, matches: n - 1 + extra, rounds: fields.length, minutes: mins, fields, note: `${extra} lucky losers${n % 2 ? ", 1 bye in round 1" : ""}` });
  }

  // Groups
  const gc = o.groups ? groupConfigs(n).find((c) => c.groups === o.groups!.groups && c.perGroup === o.groups!.perGroup) : groupConfigs(n)[0];
  if (gc) {
    const biggest = Math.max(...gc.sizes);
    const groupRounds = biggest % 2 ? biggest : biggest - 1;
    const ko = Math.log2(gc.knockout);
    let mins = slots(gc.matches - (gc.knockout - 1), o.courts) * o.slot;
    for (let f = gc.knockout; f > 1; f /= 2) mins += slots(f / 2, o.courts) * o.slot;
    out.push({
      method: "groups",
      byes: 0,
      matches: gc.matches,
      rounds: groupRounds + ko,
      minutes: mins,
      fields: [n, gc.knockout],
      note: `${gc.groups} groups of ${Math.min(...gc.sizes)}${biggest !== Math.min(...gc.sizes) ? `–${biggest}` : ""}, top ${gc.perGroup} → last ${gc.knockout}`,
    });
  }

  // Swiss
  {
    const s = o.swiss ?? swissDefaults(n);
    const cut = Math.min(s.cut, prevPow2(n));
    let mins = s.rounds * slots(Math.floor(n / 2), o.courts) * o.slot;
    for (let f = cut; f > 1; f /= 2) mins += slots(f / 2, o.courts) * o.slot;
    out.push({
      method: "swiss",
      byes: n % 2 ? s.rounds : 0,
      matches: s.rounds * Math.floor(n / 2) + cut - 1,
      rounds: s.rounds + Math.log2(cut),
      minutes: mins,
      fields: [n, cut],
      note: `${s.rounds} rounds, then top ${cut} knockout`,
    });
  }
  return out;
}

/** The method we suggest: fewest byes without blowing the day's time budget. */
export function recommend(plans: Plan[], budgetMinutes = 8 * 60): Method {
  const ok = plans.filter((p) => p.minutes <= budgetMinutes);
  const pool = ok.length ? ok : plans;
  return [...pool].sort((a, b) => a.byes - b.byes || a.minutes - b.minutes)[0].method;
}

export function newSeed() {
  const b = new Uint8Array(4);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
