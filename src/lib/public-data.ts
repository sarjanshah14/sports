import { unstable_cache } from "next/cache";
import { db, must, type EventRow } from "./db";
import { METHODS, type Method, type Options } from "./draw";
import { currentRound, nextStep, parseScore, standings, type M } from "./rounds";
import { SPORTS, inEventYear, sportBySlug } from "./sports";

// Everything the public pages show. Phone numbers and rooms never leave the server.
// Cached per event; every committee action clears the cache (revalidateTag(eventTag(code))),
// and a 60s fallback covers anything missed.

export const eventTag = (code: string) => `ev:${code}`;

export type PublicMatch = {
  id: string;
  sport: string;
  stage: M["stage"];
  round: number;
  grp: string | null;
  no: number;
  a: string;
  b: string | null;
  aId: string | null;
  bId: string | null;
  status: "scheduled" | "live" | "done" | "bye";
  winner: "a" | "b" | null;
  score: string | null;
  sets: { a: string; b: string } | null;
  court: number | null;
  updated: string;
};

type Raw = M & { court: number | null; updated_at: string; sport: string };

function shape(m: Raw, name: (id: string | null) => string): PublicMatch {
  const s = parseScore(m.score);
  return {
    id: m.id,
    sport: m.sport,
    stage: m.stage,
    round: m.round,
    grp: m.grp,
    no: m.no,
    a: name(m.side_a),
    b: m.side_b ? name(m.side_b) : null,
    aId: m.side_a,
    bId: m.side_b,
    status: m.status === "void" ? "done" : m.status,
    winner: m.winner ? (m.winner === m.side_a ? "a" : "b") : null,
    score: m.score,
    sets: s ? { a: s.sets.map((x) => x[0]).join(" "), b: s.sets.map((x) => x[1]).join(" ") } : null,
    court: m.court,
    updated: m.updated_at,
  };
}

export const stageLabel = (stage: string, round: number, grp?: string | null) =>
  stage === "group" ? (grp ? `Group ${grp}` : "Groups") : stage === "swiss" ? `Swiss ${round}` : stage === "final3" ? (round > 1 ? "Decider" : "Final round robin") : `Round ${round}`;

const load = (code: string) =>
  unstable_cache(
    async () => {
      const ev = (await db().from("events").select("*").eq("code", code).maybeSingle()).data as EventRow | null;
      if (!ev) return null;
      const [sides, matches, settings, entries, changes, draws, people] = await Promise.all([
        db().from("sides").select("id, name, sport, members").eq("event_id", ev.id),
        db().from("matches").select("id, sport, stage, round, no, grp, side_a, side_b, winner, status, score, court, updated_at").eq("event_id", ev.id).neq("status", "void").order("no"),
        db().from("sport_settings").select("sport, method, options").eq("event_id", ev.id),
        db().from("entries").select("participant_id, sport, participants!inner(event_id)").is("withdrawn_at", null).eq("participants.event_id", ev.id),
        db().from("changes").select("id, sport, summary, created_at").eq("event_id", ev.id).order("created_at", { ascending: false }).limit(300),
        db().from("draws").select("id, sport, kind, round, method, seed, replaced_at, note, created_at").eq("event_id", ev.id).order("created_at"),
        db().from("participants").select("id, name, room").eq("event_id", ev.id),
      ]);
      return {
        ev,
        sides: must(sides) as { id: string; name: string; sport: string; members: string[] }[],
        matches: must(matches) as Raw[],
        settings: must(settings) as { sport: string; method: Method; options: Options }[],
        entries: must(entries) as unknown as { participant_id: string; sport: string }[],
        changes: must(changes) as { id: string; sport: string; summary: string; created_at: string }[],
        draws: must(draws) as { id: string; sport: string; kind: string; round: number | null; method: string | null; seed: string; replaced_at: string | null; note: string | null; created_at: string }[],
        people: must(people) as { id: string; name: string; room: string | null }[],
      };
    },
    ["public-event", code],
    { tags: [eventTag(code)], revalidate: 60 },
  )();

export type Loaded = NonNullable<Awaited<ReturnType<typeof load>>>;

export async function publicEvent(code: string) {
  if (!/^\d{6}$/.test(code)) return null;
  const raw = await load(code);
  if (!raw) return null;
  const nameOf = new Map(raw.sides.map((s) => [s.id, s.name]));
  const name = (id: string | null) => (id ? nameOf.get(id) ?? "?" : "—");
  const all = raw.matches.map((m) => shape(m, name));

  const sports = SPORTS.map((sport) => {
    const ms = raw.matches.filter((m) => m.sport === sport.slug);
    const set = raw.settings.find((s) => s.sport === sport.slug);
    const cur = currentRound(ms);
    const next = set && ms.length ? nextStep(set.method, set.options, ms, "peek") : null;
    const playable = cur ? cur.matches.filter((m) => m.side_b) : [];
    return {
      sport: inEventYear(sport, raw.ev.starts_on),
      entries: raw.entries.filter((e) => e.sport === sport.slug).length,
      method: set ? METHODS.find((x) => x.id === set.method) ?? null : null,
      champion: next?.kind === "champion" ? name(next.id) : null,
      current: cur ? { label: stageLabel(cur.stage, cur.round), done: playable.filter((m) => m.status === "done").length, total: playable.length } : null,
      live: ms.filter((m) => m.status === "live").length,
    };
  });

  return { ev: raw.ev, raw, all, sports, name, tips: nameTips(raw) };
}

/** Hover / tap tooltips: every shown name -> "Full Name · room", so people with the same name can be told apart.
 * Rooms are public on purpose (the committee asked for it); phone numbers still never leave the server. */
function nameTips(raw: Loaded) {
  const label = (p: { name: string; room: string | null }) => (p.room ? `${p.name} · ${/^\d/.test(p.room) ? "Rm " : ""}${p.room}` : p.name);
  const byName = new Map<string, string[]>();
  for (const p of raw.people) byName.set(p.name, [...(byName.get(p.name) ?? []), label(p)]);
  const tips: Record<string, string> = {};
  for (const [n, ls] of byName) tips[n] = ls.join("  or  "); // two people, same name: show both rooms
  const byId = new Map(raw.people.map((p) => [p.id, p]));
  for (const s of raw.sides) {
    if (s.members.length !== 2 || tips[s.name]) continue; // pickleball pairs: "Rahul R. & Raj A." -> both full names
    const ps = s.members.map((id) => byId.get(id)).filter((p) => !!p);
    if (ps.length === 2) tips[s.name] = ps.map(label).join("  &  ");
  }
  return tips;
}

export type PublicEvent = NonNullable<Awaited<ReturnType<typeof publicEvent>>>;

export function sportView(pe: PublicEvent, slug: string) {
  const summary = pe.sports.find((s) => s.sport.slug === slug)!;
  const sport = summary.sport;
  const raw = pe.raw.matches.filter((m) => m.sport === slug);
  const set = pe.raw.settings.find((s) => s.sport === slug);
  const matches = pe.all.filter((m) => m.sport === slug);

  // Rounds in play order, for the tabs.
  const order: Record<string, number> = { group: 0, swiss: 1, knockout: 2, final3: 3 };
  const keys = [...new Set(matches.map((m) => `${m.stage}:${m.stage === "group" ? 0 : m.round}`))].sort((x, y) => {
    const [sx, rx] = x.split(":");
    const [sy, ry] = y.split(":");
    return order[sx] - order[sy] || Number(rx) - Number(ry);
  });
  const ko = keys.filter((k) => k.startsWith("knockout:"));
  const rounds = keys.map((k) => {
    const [stage, r] = k.split(":");
    const list = matches.filter((m) => m.stage === stage && (stage === "group" || m.round === Number(r)));
    const field = list.reduce((t, m) => t + (m.b ? 2 : 1), 0);
    const label =
      stage === "knockout" && k === ko[ko.length - 1] && list.length === 1 && list[0].b ? "Final" : stage === "knockout" && field === 4 && k === ko[ko.length - 1] ? "Semis" : stageLabel(stage, Number(r));
    return { key: k, stage, round: Number(r), label, matches: list };
  });

  const groups =
    raw.some((m) => m.stage === "group")
      ? [...new Set(raw.filter((m) => m.stage === "group").map((m) => m.grp!))].sort().map((g) => {
          const gm = raw.filter((m) => m.stage === "group" && m.grp === g);
          const ids = [...new Set(gm.flatMap((m) => [m.side_a!, m.side_b!]))];
          return { g, rows: standings(gm, ids).map((r) => ({ ...r, name: pe.name(r.id) })), perGroup: set?.options.groups?.perGroup ?? 2 };
        })
      : [];
  const final = raw.filter((m) => m.stage === "final3");
  const finalTable = final.length ? standings(final, [...new Set(final.flatMap((m) => [m.side_a!, m.side_b!]))]).map((r) => ({ ...r, name: pe.name(r.id) })) : [];

  return {
    sport,
    summary,
    method: set ? { ...METHODS.find((x) => x.id === set.method)!, options: set.options } : null,
    rounds,
    groups,
    finalTable,
    byes: matches.filter((m) => m.status === "bye").length,
    draws: pe.raw.draws.filter((d) => d.sport === slug),
    changes: pe.raw.changes.filter((c) => c.sport === slug),
    sides: pe.raw.sides.filter((s) => s.sport === slug).length,
  };
}

/** Name search for "Find me": every sport a person entered, their side, and their current or last match. */
export function findPeople(pe: PublicEvent) {
  const sideOf = new Map<string, { id: string; name: string }>(); // `${person}:${sport}` → side
  for (const s of pe.raw.sides) for (const m of s.members) sideOf.set(`${m}:${s.sport}`, { id: s.id, name: s.name });
  const entered = new Map<string, string[]>();
  for (const e of pe.raw.entries) entered.set(e.participant_id, [...(entered.get(e.participant_id) ?? []), e.sport]);
  const rank = { live: 0, scheduled: 1, done: 2, bye: 3 } as const;
  return pe.raw.people
    .filter((p) => entered.has(p.id))
    .map((p) => ({
      name: p.name,
      sports: entered.get(p.id)!.map((slug) => {
        const side = sideOf.get(`${p.id}:${slug}`) ?? null;
        const ms = side ? pe.all.filter((m) => m.aId === side.id || m.bId === side.id) : [];
        ms.sort((a, b) => rank[a.status] - rank[b.status] || b.updated.localeCompare(a.updated));
        return { slug, sport: sportBySlug(slug)!.name, side: side?.name ?? null, match: ms[0] ?? null };
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
