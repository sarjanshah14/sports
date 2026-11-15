"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eventTag } from "@/lib/public-data";
import { requireAdmin } from "@/lib/auth";
import { db, eventByCode, must } from "@/lib/db";
import { groupConfigs, groupLabel, makeGroups, METHODS, newSeed, randomPairs, rollingRound, roundRobin, standardRound1, swissRound, type Method, type Options, type Pair } from "@/lib/draw";
import { loadSport } from "@/lib/sport-data";
import { sportBySlug } from "@/lib/sports";

async function ctx(code: string, slug: string) {
  requireAdmin();
  const ev = await eventByCode(code);
  const sport = sportBySlug(slug);
  if (!ev || !sport) throw new Error("Not found");
  return { ev, sport };
}

const done = (code: string, slug: string) => {
  revalidatePath(`/admin/e/${code}/sports/${slug}`, "layout");
  revalidateTag(eventTag(code));
};
const short = (name: string) => {
  const [f, ...rest] = name.split(" ");
  return rest.length ? `${f} ${rest[rest.length - 1][0]}.` : f;
};

export async function saveSettings(code: string, slug: string, method: Method, options: Options) {
  const { ev } = await ctx(code, slug);
  if (!METHODS.some((m) => m.id === method)) throw new Error("Unknown method");
  const clean: Options = {
    courts: Math.max(1, Math.min(50, Math.round(Number(options.courts) || 1))),
    slot: Math.max(5, Math.min(240, Math.round(Number(options.slot) || 15))),
    finalThree: options.finalThree === "bye_to_final" ? "bye_to_final" : "round_robin",
    ...(options.groups && { groups: { groups: Number(options.groups.groups), perGroup: Number(options.groups.perGroup) } }),
    ...(options.swiss && { swiss: { rounds: Math.max(1, Math.min(9, Number(options.swiss.rounds))), cut: Number(options.swiss.cut) } }),
  };
  must(await db().from("sport_settings").upsert({ event_id: ev.id, sport: slug, method, options: clean, updated_at: new Date().toISOString() }));
  done(code, slug);
}

/** A redo is allowed only before any result is in, and needs a reason that stays on the public record. */
async function retire(evId: string, slug: string, kind: "pairs" | "round", note: string) {
  const live = must(await db().from("draws").select("id").eq("event_id", evId).eq("sport", slug).eq("kind", kind).is("replaced_at", null)) as { id: string }[];
  if (!live.length) return;
  if (!note.trim()) throw new Error("Say why the draw is being redone. It is shown to everyone.");
  const played = must(await db().from("matches").select("id").eq("event_id", evId).eq("sport", slug).in("status", ["live", "done"]).limit(1)) as unknown[];
  if (played.length) throw new Error("Results are already in for this sport, so the draw can't be redone.");
  must(await db().from("matches").delete().eq("event_id", evId).eq("sport", slug));
  must(await db().from("draws").update({ replaced_at: new Date().toISOString(), note: note.trim().slice(0, 300) }).in("id", live.map((d) => d.id)));
}

export async function drawPairs(code: string, slug: string, note = "") {
  const { ev, sport } = await ctx(code, slug);
  if (sport.kind !== "doubles") throw new Error("Only doubles sports have pairs.");
  const st = await loadSport(ev, slug);
  if (st.entrants.length < 2) throw new Error("Need at least two players.");
  await retire(ev.id, slug, "round", note); // pairs change → any round-1 draw is void too
  await retire(ev.id, slug, "pairs", note);
  must(await db().from("sides").delete().eq("event_id", ev.id).eq("sport", slug));

  const seed = newSeed();
  const byId = new Map(st.entrants.map((p) => [p.id, p.name]));
  const { pairs, leftover } = randomPairs(st.entrants.map((p) => p.id), seed);
  must(
    await db()
      .from("sides")
      .insert(pairs.map(([a, b]) => ({ event_id: ev.id, sport: slug, name: `${short(byId.get(a)!)} & ${short(byId.get(b)!)}`, members: [a, b] }))),
  );
  must(
    await db()
      .from("draws")
      .insert({
        event_id: ev.id,
        sport: slug,
        kind: "pairs",
        seed,
        input: st.entrants.map((p) => p.name),
        output: { pairs: pairs.map(([a, b]) => [byId.get(a), byId.get(b)]), leftover: leftover ? byId.get(leftover) : null },
      }),
  );
  done(code, slug);
  return { pairs: pairs.length, leftover: leftover ? byId.get(leftover)! : null };
}

export async function saveTeam(code: string, slug: string, team: { id: string | null; name: string; captain: string | null; members: string[] }) {
  const { ev, sport } = await ctx(code, slug);
  if (sport.kind !== "team") throw new Error("Only team sports have teams.");
  const name = team.name.trim().slice(0, 60);
  if (!name) throw new Error("Give the team a name.");
  const members = [...new Set(team.members.map(String))];
  if (team.captain && !members.includes(team.captain)) members.unshift(team.captain);
  const row = { name, captain: team.captain || null, members };
  let id = team.id;
  if (id) must(await db().from("sides").update(row).eq("id", id).eq("event_id", ev.id).eq("sport", slug));
  else id = (must(await db().from("sides").insert({ ...row, event_id: ev.id, sport: slug }).select("id").single()) as { id: string }).id;
  // A player sits in one team only: take them out of any other team.
  const others = must(await db().from("sides").select("id, members, captain").eq("event_id", ev.id).eq("sport", slug).neq("id", id)) as { id: string; members: string[]; captain: string | null }[];
  for (const o of others) {
    const keep = o.members.filter((m) => !members.includes(m));
    if (keep.length !== o.members.length) must(await db().from("sides").update({ members: keep, captain: keep.includes(o.captain ?? "") ? o.captain : null }).eq("id", o.id));
  }
  done(code, slug);
}

export async function deleteTeam(code: string, slug: string, id: string) {
  const { ev } = await ctx(code, slug);
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Bad team id");
  const used = must(await db().from("matches").select("id").or(`side_a.eq.${id},side_b.eq.${id}`).limit(1)) as unknown[];
  if (used.length) throw new Error("This team is already in the draw. Redo the draw first.");
  must(await db().from("sides").delete().eq("id", id).eq("event_id", ev.id));
  done(code, slug);
}

export async function drawRoundOne(code: string, slug: string, note = "") {
  const { ev, sport } = await ctx(code, slug);
  await retire(ev.id, slug, "round", note);
  let st = await loadSport(ev, slug);

  // Singles: one side per player still entered, rebuilt on every draw.
  if (sport.kind === "singles") {
    must(await db().from("sides").delete().eq("event_id", ev.id).eq("sport", slug));
    if (st.entrants.length)
      must(await db().from("sides").insert(st.entrants.map((p) => ({ event_id: ev.id, sport: slug, name: p.name, members: [p.id] }))));
    st = await loadSport(ev, slug);
  }
  const sides = [...st.sides].filter((s) => s.members.length).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  if (sides.length < 2) throw new Error(sport.kind === "team" ? "Add at least two teams first." : sport.kind === "doubles" ? "Draw the pairs first." : "Need at least two players.");

  const ids = sides.map((s) => s.id);
  const name = new Map(sides.map((s) => [s.id, s.name]));
  const { method, options } = st.settings;
  const seed = newSeed();
  type Row = { stage: string; round: number; no: number; grp: string | null; side_a: string; side_b: string | null; status: string; winner: string | null };
  const rows: Row[] = [];
  const knockout = (pairs: Pair[], stage = "knockout") =>
    pairs.forEach((p, i) => rows.push({ stage, round: 1, no: i + 1, grp: null, side_a: p.a, side_b: p.b, status: p.b ? "scheduled" : "bye", winner: p.b ? null : p.a }));
  let output: { pairs?: [string, string | null][]; groups?: string[][] } = {};

  if (method === "standard") knockout(standardRound1(ids, seed));
  else if (method === "rolling" || method === "lucky_loser") knockout(rollingRound(ids, new Set(), seed).pairs);
  else if (method === "swiss") knockout(swissRound(ids.map((id) => ({ id, points: 0, hadBye: false })), new Set(), seed).pairs, "swiss");
  else {
    const cfg = groupConfigs(ids.length).find((c) => c.groups === options.groups?.groups && c.perGroup === options.groups?.perGroup) ?? groupConfigs(ids.length)[0];
    const count = cfg?.groups ?? Math.max(1, Math.round(ids.length / 4));
    const groups = makeGroups(ids, count, seed);
    groups.forEach((g, gi) => {
      let no = 1;
      roundRobin(g).forEach((round, r) => round.forEach(([a, b]) => rows.push({ stage: "group", round: r + 1, no: no++, grp: groupLabel(gi), side_a: a, side_b: b, status: "scheduled", winner: null })));
    });
    output = { groups: groups.map((g) => g.map((id) => name.get(id)!)) };
  }
  if (!output.groups) output = { pairs: rows.map((r) => [name.get(r.side_a)!, r.side_b ? name.get(r.side_b)! : null]) };

  const draw = must(
    await db()
      .from("draws")
      .insert({ event_id: ev.id, sport: slug, kind: "round", round: 1, method, seed, input: sides.map((s) => s.name), output })
      .select("id")
      .single(),
  ) as { id: string };
  must(await db().from("matches").insert(rows.map((r) => ({ ...r, event_id: ev.id, sport: slug, draw_id: draw.id }))));
  done(code, slug);
}
