"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db, eventByCode, must } from "@/lib/db";
import { newSeed, roundRobin, type Pair } from "@/lib/draw";
import { advancers, nextStep, rePair, rearrangeable, validPairs, type Stage } from "@/lib/rounds";
import { loadSport, type MatchRow } from "@/lib/sport-data";
import { sportBySlug } from "@/lib/sports";

// Everything the committee does on match day. Each result lands in the public change log.

async function ctx(code: string, slug: string) {
  requireAdmin();
  const ev = await eventByCode(code);
  if (!ev || !sportBySlug(slug)) throw new Error("Not found");
  const st = await loadSport(ev, slug);
  const name = new Map(st.sides.map((s) => [s.id, s.name]));
  const label = (id: string | null) => (id ? name.get(id) ?? "?" : "nobody");
  return { ev, st, label };
}

const refresh = (code: string, slug: string) => {
  revalidatePath(`/admin/e/${code}/sports/${slug}`, "layout");
  revalidatePath(`/e/${code}`, "layout");
};

const stageName = (m: { stage: string; round: number; grp: string | null }) =>
  m.stage === "group" ? `Group ${m.grp}` : m.stage === "swiss" ? `Swiss round ${m.round}` : m.stage === "final3" ? "Final round robin" : `Round ${m.round}`;

async function log(evId: string, sport: string, matchId: string | null, summary: string) {
  must(await db().from("changes").insert({ event_id: evId, sport, match_id: matchId, summary }));
}

/** After a result, if that was the deciding match, put the champion on the record (once). */
async function maybeCrown(code: string, slug: string) {
  const { ev, st, label } = await ctx(code, slug);
  const next = nextStep(st.settings.method, st.settings.options, st.matches, "peek");
  if (next.kind !== "champion") return;
  const already = (must(await db().from("changes").select("id").eq("event_id", ev.id).eq("sport", slug).like("summary", "Champion:%").limit(1)) as unknown[]).length;
  if (!already) await log(ev.id, slug, null, `Champion: ${label(next.id)}`);
}

function find(st: { matches: MatchRow[] }, id: string) {
  const m = st.matches.find((x) => x.id === id);
  if (!m) throw new Error("Match not found");
  return m;
}

/** A winner can only change while nothing has been drawn on top of it. */
function laterRoundExists(st: { matches: MatchRow[] }, m: MatchRow) {
  const rank: Record<string, number> = { group: 0, swiss: 0, knockout: 1, final3: 2 };
  return st.matches.some((x) => x.status !== "void" && (rank[x.stage] > rank[m.stage] || (x.stage === m.stage && x.stage !== "group" && x.round > m.round)));
}

export async function setResult(code: string, slug: string, id: string, side: "a" | "b", score: string) {
  const { ev, st, label } = await ctx(code, slug);
  const m = find(st, id);
  if (!m.side_b) throw new Error("This was a bye.");
  const winner = side === "a" ? m.side_a : m.side_b;
  const cleanScore = score.trim().slice(0, 60) || null;
  if (m.status === "done" && m.winner !== winner && laterRoundExists(st, m)) throw new Error("The next round is already drawn from this result. Fix it before drawing the next round.");
  must(await db().from("matches").update({ winner, score: cleanScore, status: "done", absent: null, updated_at: new Date().toISOString() }).eq("id", id));
  const loser = winner === m.side_a ? m.side_b : m.side_a;
  const what = `${label(winner)} beat ${label(loser)}${cleanScore ? ` ${cleanScore}` : ""}`;
  await log(ev.id, slug, id, m.status === "done" ? `${stageName(m)} corrected: ${what} (was ${label(m.winner)}${m.score ? ` ${m.score}` : ""})` : `${stageName(m)}: ${what}`);
  await maybeCrown(code, slug);
  refresh(code, slug);
}

export async function setLive(code: string, slug: string, id: string, court: number | null) {
  const { st } = await ctx(code, slug);
  const m = find(st, id);
  if (m.status === "done" || m.status === "bye") throw new Error("Already finished.");
  must(await db().from("matches").update({ status: court === null ? "scheduled" : "live", court, updated_at: new Date().toISOString() }).eq("id", id));
  refresh(code, slug);
}

export async function setAbsent(code: string, slug: string, id: string, who: "a" | "b" | "both" | null) {
  const { st } = await ctx(code, slug);
  const m = find(st, id);
  if (m.status === "done") throw new Error("Already has a result.");
  must(await db().from("matches").update({ absent: who }).eq("id", id));
  refresh(code, slug);
}

/** Absent player loses; if both are absent, nobody goes through from this match. */
export async function walkover(code: string, slug: string, id: string) {
  const { ev, st, label } = await ctx(code, slug);
  const m = find(st, id);
  if (!m.absent) throw new Error("Mark who didn't show first.");
  const winner = m.absent === "both" ? null : m.absent === "a" ? m.side_b : m.side_a;
  must(await db().from("matches").update({ winner, score: "W/O", status: "done", updated_at: new Date().toISOString() }).eq("id", id));
  await log(
    ev.id,
    slug,
    id,
    winner
      ? `${stageName(m)}: ${label(winner)} through on a walkover (${label(m.absent === "a" ? m.side_a : m.side_b)} didn't show)`
      : `${stageName(m)}: ${label(m.side_a)} and ${label(m.side_b)} both didn't show; neither goes through`,
  );
  await maybeCrown(code, slug);
  refresh(code, slug);
}

/** Players whose opponents didn't show play each other instead (A vs D when B and C are missing). */
export async function rePairAbsent(code: string, slug: string) {
  const { ev, st, label } = await ctx(code, slug);
  const waiting = st.matches.filter((m) => m.status !== "done" && m.status !== "void" && m.side_b && (m.absent === "a" || m.absent === "b"));
  if (waiting.length < 2) throw new Error("Need at least two matches where one player didn't show.");
  const stage = waiting[0].stage;
  const round = waiting[0].round;
  if (waiting.some((m) => m.stage !== stage || m.round !== round || m.stage === "group")) throw new Error("Re-pairing works within one knockout round.");
  const present = waiting.map((m) => (m.absent === "a" ? m.side_b! : m.side_a!));
  const seed = newSeed();
  const { pairs, walkover: lone } = rePair(present, seed);
  const lastNo = Math.max(...st.matches.filter((m) => m.stage === stage && m.round === round).map((m) => m.no));
  must(await db().from("matches").update({ status: "void" }).in("id", waiting.map((m) => m.id)));
  const rows: Record<string, unknown>[] = pairs.map((p, i) => ({ event_id: ev.id, sport: slug, stage, round, no: lastNo + 1 + i, side_a: p.a, side_b: p.b, status: "scheduled" }));
  if (lone) rows.push({ event_id: ev.id, sport: slug, stage, round, no: lastNo + 1 + pairs.length, side_a: lone, side_b: null, status: "bye", winner: lone, score: "W/O" });
  must(await db().from("matches").insert(rows));
  must(
    await db()
      .from("draws")
      .insert({ event_id: ev.id, sport: slug, kind: "repair", round, method: st.settings.method, seed, input: present.map(label), output: { pairs: pairs.map((p) => [label(p.a), label(p.b)]), leftover: lone ? label(lone) : null } }),
  );
  await log(ev.id, slug, null, `${stageName({ stage, round, grp: null })}: ${present.length} players whose opponents didn't show were re-paired (seed ${seed})${lone ? `; ${label(lone)} goes through on a walkover` : ""}`);
  refresh(code, slug);
}

/** Draw the next round, or crown the champion, once every match in the current round is settled. */
export async function advance(code: string, slug: string) {
  const { ev, st, label } = await ctx(code, slug);
  const seed = newSeed();
  const next = nextStep(st.settings.method, st.settings.options, st.matches, seed);
  if (next.kind === "wait") throw new Error(next.left ? `${next.left} matches still need a result.` : "Nothing to draw yet.");
  if (next.kind === "tie") return { tie: next.ids.map((id) => ({ id, name: label(id) })) };
  if (next.kind === "champion") {
    const already = (must(await db().from("changes").select("id").eq("event_id", ev.id).eq("sport", slug).like("summary", "Champion:%").limit(1)) as unknown[]).length;
    if (!already) await log(ev.id, slug, null, `Champion: ${label(next.id)}`);
    refresh(code, slug);
    return { champion: label(next.id) };
  }
  await insertRound(ev.id, slug, st.settings.method, next.stage, next.round, next.pairs, seed, label, next.note + (next.lucky ? ` (${label(next.lucky)})` : ""));
  refresh(code, slug);
  return {};
}

/** Last three finished level: one extra match between the tied players settles it. */
export async function addDecider(code: string, slug: string, a: string, b: string) {
  const { ev, st, label } = await ctx(code, slug);
  const round = Math.max(0, ...st.matches.filter((m) => m.stage === "final3").map((m) => m.round)) + 1;
  await insertRound(ev.id, slug, st.settings.method, "final3", round, [{ a, b }], newSeed(), label, "Decider for a three-way tie");
  refresh(code, slug);
}

async function insertRound(evId: string, slug: string, method: string, stage: Stage, round: number, pairs: Pair[], seed: string, label: (id: string | null) => string, note: string) {
  const draw = must(
    await db()
      .from("draws")
      .insert({ event_id: evId, sport: slug, kind: "round", round, method, seed, input: [...new Set(pairs.flatMap((p) => [p.a, p.b]).filter(Boolean))].map((id) => label(id)), output: { pairs: pairs.map((p) => [label(p.a), p.b ? label(p.b) : null]) }, note: `${stage}: ${note}` })
      .select("id")
      .single(),
  ) as { id: string };
  must(
    await db()
      .from("matches")
      .insert(pairs.map((p, i) => ({ event_id: evId, sport: slug, draw_id: draw.id, stage, round, no: i + 1, side_a: p.a, side_b: p.b, status: p.b ? "scheduled" : "bye", winner: p.b ? null : p.a }))),
  );
  await log(evId, slug, null, `${stage === "final3" ? "Final three" : stage === "swiss" ? `Swiss round ${round}` : `Round ${round}`} drawn: ${pairs.filter((p) => p.b).length} matches${pairs.some((p) => !p.b) ? `, bye for ${pairs.filter((p) => !p.b).map((p) => label(p.a)).join(", ")}` : ""}. ${note}.`);
}

/* ---------- committee overrides ---------- */

const why = (note: string) => {
  const n = note.trim().slice(0, 200);
  if (!n) throw new Error("Add a short reason. It is shown to everyone in the log.");
  return n;
};

/** Next round set by hand: chosen pairs and byes, or a round robin among whoever is left. */
export async function customRound(code: string, slug: string, plan: { mode: "pairs"; pairs: Pair[] } | { mode: "robin"; ids: string[] }, note: string) {
  const reason = why(note);
  const { ev, st, label } = await ctx(code, slug);
  const adv = advancers(st.matches);
  if (!adv) throw new Error("The current round isn't finished yet.");
  const allowed = [...adv.through, ...adv.out]; // the committee may bring a loser back
  if (plan.mode === "robin") {
    const ids = [...new Set(plan.ids)];
    if (ids.length < 3 || !ids.every((id) => allowed.includes(id))) throw new Error("Pick at least three players from this round.");
    const pairs = roundRobin(ids).flat().map(([a, b]) => ({ a, b }));
    await insertRound(ev.id, slug, st.settings.method, "final3", 1, pairs, newSeed(), label, `Round robin among ${ids.map(label).join(", ")}, set by the committee: ${reason}`);
  } else {
    const ids = plan.pairs.flatMap((p) => (p.b ? [p.a, p.b] : [p.a]));
    if (!validPairs(plan.pairs, ids) || !ids.every((id) => allowed.includes(id)) || !adv.through.every((id) => ids.includes(id)))
      throw new Error("Every player who went through must be placed exactly once.");
    const stage: Stage = adv.stage === "final3" ? "knockout" : adv.stage;
    await insertRound(ev.id, slug, st.settings.method, stage, adv.round + 1, plan.pairs, newSeed(), label, `Set by the committee: ${reason}`);
  }
  refresh(code, slug);
}

/** Re-pair matches in the current round that haven't started, e.g. two players with byes play each other. */
export async function rearrangeRound(code: string, slug: string, pairs: Pair[], note: string) {
  const reason = why(note);
  const { ev, st, label } = await ctx(code, slug);
  const open = rearrangeable(st.matches);
  const ids = open.flatMap((m) => [m.side_a, m.side_b]).filter(Boolean) as string[];
  if (!validPairs(pairs, ids)) throw new Error("Everyone in the unplayed matches must be placed exactly once.");
  const { stage, round } = open[0];
  // Keep matches whose pairing didn't change; replace only the rest, reusing their numbers.
  const key = (a: string | null, b: string | null) => [a, b ?? ""].sort().join("|");
  const before = new Map(open.map((m) => [key(m.side_a, m.side_b), m]));
  const fresh = pairs.filter((p) => !before.has(key(p.a, p.b)));
  const kept = new Set(pairs.filter((p) => before.has(key(p.a, p.b))).map((p) => key(p.a, p.b)));
  const gone = open.filter((m) => !kept.has(key(m.side_a, m.side_b)));
  if (!fresh.length) throw new Error("Nothing changed.");
  const numbers = gone.map((m) => m.no).sort((a, b) => a - b);
  let extra = Math.max(...st.matches.filter((m) => m.stage === stage && m.round === round).map((m) => m.no));
  must(await db().from("matches").update({ status: "void" }).in("id", gone.map((m) => m.id)));
  must(
    await db()
      .from("matches")
      .insert(fresh.map((p, i) => ({ event_id: ev.id, sport: slug, stage, round, no: numbers[i] ?? ++extra, side_a: p.a, side_b: p.b, status: p.b ? "scheduled" : "bye", winner: p.b ? null : p.a }))),
  );
  await log(ev.id, slug, null, `${stageName({ stage, round, grp: null })} rearranged by the committee (${reason}): ${fresh.map((p) => (p.b ? `${label(p.a)} vs ${label(p.b)}` : `${label(p.a)} bye`)).join("; ")}`);
  refresh(code, slug);
}
