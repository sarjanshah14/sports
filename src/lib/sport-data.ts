import { db, must, type EventRow } from "./db";
import type { Method, Options } from "./draw";
import type { M } from "./rounds";
import { sportBySlug, type Sport } from "./sports";

// Server-only reads for one sport of one event.

export type Side = { id: string; name: string; members: string[]; captain: string | null };
export type DrawRow = { id: string; kind: string; round: number | null; method: string | null; seed: string; input: string[]; output: DrawOutput; replaced_at: string | null; note: string | null; created_at: string };
export type DrawOutput = { pairs?: [string, string | null][]; groups?: string[][]; leftover?: string | null };
export type MatchRow = M & { court: number | null; absent: "a" | "b" | "both" | null };
export type Settings = { method: Method; options: Options };
export type Entrant = { id: string; name: string; role: string | null };

export function defaultSettings(sport: Sport): Settings {
  return { method: sport.kind === "team" ? "groups" : "rolling", options: { courts: sport.courts, slot: sport.slot, finalThree: "round_robin" } };
}

export async function loadSport(ev: EventRow, slug: string) {
  const sport = sportBySlug(slug)!;
  const [entries, sides, settings, draws, matches] = await Promise.all([
    db().from("entries").select("participant_id, participants!inner(id, name, event_id, cricket_role, volleyball_role)").eq("sport", slug).is("withdrawn_at", null).eq("participants.event_id", ev.id),
    db().from("sides").select("id, name, members, captain").eq("event_id", ev.id).eq("sport", slug).order("name"),
    db().from("sport_settings").select("method, options").eq("event_id", ev.id).eq("sport", slug).maybeSingle(),
    db().from("draws").select("*").eq("event_id", ev.id).eq("sport", slug).order("created_at", { ascending: false }),
    db().from("matches").select("id, stage, round, no, grp, side_a, side_b, winner, status, score, court, absent").eq("event_id", ev.id).eq("sport", slug).order("round").order("grp").order("no"),
  ]);
  const people = (must(entries) as unknown as { participants: { id: string; name: string; cricket_role: string | null; volleyball_role: string | null } }[])
    .map(({ participants: p }) => ({ id: p.id, name: p.name, role: slug === "cricket" ? p.cricket_role : slug === "volleyball" ? p.volleyball_role : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const s = settings.data as Settings | null;
  const base = defaultSettings(sport);
  return {
    sport,
    entrants: people as Entrant[],
    sides: must(sides) as Side[],
    settings: s ? { method: s.method, options: { ...base.options, ...s.options } } : base,
    saved: !!s,
    draws: must(draws) as DrawRow[],
    matches: must(matches) as MatchRow[],
  };
}

export type SportState = Awaited<ReturnType<typeof loadSport>>;

/** How many competitors the draw will use: players, drawn pairs or teams. */
export function competitorCount(st: SportState) {
  return st.sport.kind === "singles" ? st.entrants.length : st.sides.length;
}
