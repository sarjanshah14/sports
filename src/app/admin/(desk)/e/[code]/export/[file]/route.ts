import { isAdmin } from "@/lib/auth";
import { db, eventByCode, must, type ParticipantRow } from "@/lib/db";
import { publicEvent, stageLabel } from "@/lib/public-data";
import { SPORTS, sportBySlug } from "@/lib/sports";

// Committee downloads. CSV with a byte-order mark so Excel opens names and dashes correctly.

const csv = (rows: (string | number | null | undefined)[][]) =>
  "﻿" + rows.map((r) => r.map((v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(",")).join("\r\n");

// Keeps "09" as 09 in Excel instead of 9.
const text = (v: string | null) => (v && /^0\d+$/.test(v) ? `="${v}"` : v);

const file = (name: string, body: string) =>
  new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` } });

export async function GET(_: Request, { params }: { params: { code: string; file: string } }) {
  if (!isAdmin()) return new Response("Log in to the desk first.", { status: 401 });
  const ev = await eventByCode(params.code);
  if (!ev) return new Response("No such event", { status: 404 });
  const slug = ev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (params.file === "participants.csv" || params.file === "tshirts.csv") {
    const people = must(await db().from("participants").select("*, entries(sport, withdrawn_at)").eq("event_id", ev.id).order("name")) as ParticipantRow[];
    const teams = must(await db().from("sides").select("name, sport, members").eq("event_id", ev.id).in("sport", ["cricket", "volleyball"])) as { name: string; sport: string; members: string[] }[];
    const teamOf = (id: string, sport: string) => teams.find((t) => t.sport === sport && t.members.includes(id))?.name ?? "";
    const sportsOf = (p: ParticipantRow) => p.entries.filter((e) => !e.withdrawn_at).map((e) => sportBySlug(e.sport)?.name ?? e.sport);

    if (params.file === "participants.csv") {
      return file(
        `${slug}-participants.csv`,
        csv([
          ["Name", "Phone", "Room", ...SPORTS.map((s) => s.name), "Cricket role", "Cricket team", "Volleyball role", "Volleyball team", "T-shirt size", "T-shirt name", "T-shirt number"],
          ...people.map((p) => [
            p.name,
            p.phone,
            p.room,
            ...SPORTS.map((s) => {
              const e = p.entries.find((x) => x.sport === s.slug);
              return e ? (e.withdrawn_at ? "withdrawn" : "yes") : "";
            }),
            p.cricket_role,
            teamOf(p.id, "cricket"),
            p.volleyball_role,
            teamOf(p.id, "volleyball"),
            p.tshirt_size,
            p.tshirt_name,
            text(p.tshirt_number),
          ]),
        ]),
      );
    }

    // T-shirt order: size totals first, then one row per shirt, grouped by team.
    const wearers = people.filter((p) => sportsOf(p).length);
    const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const count = (s: string) => wearers.filter((p) => (p.tshirt_size ?? "").toUpperCase() === s).length;
    const other = wearers.filter((p) => !sizes.includes((p.tshirt_size ?? "").toUpperCase())).length;
    const team = (p: ParticipantRow) => [teamOf(p.id, "cricket"), teamOf(p.id, "volleyball")].filter(Boolean).join(" / ");
    return file(
      `${slug}-tshirt-order.csv`,
      csv([
        ["Size", "Count"],
        ...sizes.map((s) => [s, count(s)]),
        ...(other ? [["Not given", other]] : []),
        ["Total", wearers.length],
        [],
        ["Team", "Name on shirt", "Number", "Size", "Player", "Room"],
        ...wearers
          .map((p) => [team(p), p.tshirt_name, text(p.tshirt_number), p.tshirt_size, p.name, p.room])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[4]).localeCompare(String(b[4]))),
      ]),
    );
  }

  if (params.file === "results.csv") {
    const pe = (await publicEvent(params.code))!;
    const rows = pe.all
      .filter((m) => m.b)
      .sort((a, b) => SPORTS.findIndex((s) => s.slug === a.sport) - SPORTS.findIndex((s) => s.slug === b.sport) || a.round - b.round || a.no - b.no)
      .map((m) => [
        sportBySlug(m.sport)!.name,
        stageLabel(m.stage, m.round, m.grp),
        m.no,
        m.a,
        m.b,
        m.status === "done" ? (m.winner === "a" ? m.a : m.winner === "b" ? m.b : "Neither (no-show)") : m.status === "live" ? "Playing" : "",
        m.score,
      ]);
    const champs = pe.sports.filter((s) => s.champion).map((s) => [s.sport.name, "Champion", "", s.champion, "", "", ""]);
    return file(`${slug}-results.csv`, csv([["Sport", "Round", "Match", "Player / team A", "Player / team B", "Winner", "Score"], ...champs, ...rows]));
  }

  return new Response("Unknown file", { status: 404 });
}
