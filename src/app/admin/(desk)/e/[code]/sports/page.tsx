import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";
import { db, eventByCode, must } from "@/lib/db";
import { METHODS, type Method, type Options } from "@/lib/draw";
import { currentRound, nextStep, type M } from "@/lib/rounds";
import { stageLabel } from "@/lib/public-data";
import { SPORTS } from "@/lib/sports";

// One line per sport saying exactly where it stands, or what to do next.

export default async function SportsDesk({ params }: { params: { code: string } }) {
  const ev = (await eventByCode(params.code))!;
  const [entries, settings, sides, draws, matches] = await Promise.all([
    db().from("entries").select("sport, participants!inner(event_id)").is("withdrawn_at", null).eq("participants.event_id", ev.id),
    db().from("sport_settings").select("sport, method, options").eq("event_id", ev.id),
    db().from("sides").select("id, name, sport, members").eq("event_id", ev.id),
    db().from("draws").select("sport, kind").eq("event_id", ev.id).is("replaced_at", null),
    db().from("matches").select("id, sport, stage, round, no, grp, side_a, side_b, winner, status, score").eq("event_id", ev.id).neq("status", "void"),
  ]);
  const E = must(entries) as unknown as { sport: string }[];
  const S = must(settings) as { sport: string; method: Method; options: Options }[];
  const SD = must(sides) as { id: string; name: string; sport: string; members: string[] }[];
  const D = must(draws) as { sport: string; kind: string }[];
  const MS = must(matches) as (M & { sport: string })[];

  return (
    <ol className="mt-6 border-t-2 border-ink">
      {SPORTS.map((s) => {
        const entered = E.filter((e) => e.sport === s.slug).length;
        const set = S.find((x) => x.sport === s.slug);
        const ms = MS.filter((m) => m.sport === s.slug);
        const sideList = SD.filter((x) => x.sport === s.slug);
        const name = (id: string) => sideList.find((x) => x.id === id)?.name ?? "?";
        const placed = sideList.reduce((t, x) => t + x.members.length, 0);

        let status: React.ReactNode;
        let tone: "done" | "todo" | "live" = "todo";
        let href = `/admin/e/${ev.code}/sports/${s.slug}`;

        if (ms.length && set) {
          href += "/play";
          const next = nextStep(set.method, set.options, ms, "peek");
          const cur = currentRound(ms)!;
          const playable = cur.matches.filter((m) => m.side_b);
          const done = playable.filter((m) => m.status === "done").length;
          const live = playable.filter((m) => m.status === "live").length;
          if (next.kind === "champion") {
            tone = "done";
            status = (
              <span className="flex items-center gap-1.5">
                <Crown size={13} className="text-accent" /> Won by {name(next.id)}
              </span>
            );
          } else if (next.kind === "tie") status = "Tie at the top: add a decider";
          else if (done === playable.length) status = `${stageLabel(cur.stage, cur.round)} finished: draw the next`;
          else {
            tone = "live";
            status = `${stageLabel(cur.stage, cur.round)} · ${done}/${playable.length} played${live ? ` · ${live} live` : ""}`;
          }
        } else if (s.kind === "team" && (sideList.length < 2 || placed < entered)) {
          status = sideList.length ? `Teams: ${placed} of ${entered} placed` : "Enter the teams";
        } else if (s.kind === "doubles" && !D.some((d) => d.sport === s.slug && d.kind === "pairs")) {
          status = "Draw the pairs";
        } else if (!set) {
          status = "Pick a format";
        } else {
          status = "Ready: draw round 1";
        }

        return (
          <li key={s.slug} className="border-b hair">
            <Link href={href} className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4">
              <span className="min-w-0">
                <span className="block font-display text-2xl font-extrabold uppercase leading-none md:text-3xl">{s.name}</span>
                <span className="mt-1.5 block text-sm text-mute">
                  {entered} entered
                  {s.kind === "doubles" && sideList.length ? ` · ${sideList.length} pairs` : ""}
                  {s.kind === "team" && sideList.length ? ` · ${sideList.length} teams` : ""}
                  {set ? ` · ${METHODS.find((x) => x.id === set.method)?.name}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`max-w-[46vw] text-right font-mono text-[11px] uppercase tracking-label ${tone === "done" ? "text-ink" : tone === "live" ? "text-mute" : "text-accent"}`}>
                  {status}
                </span>
                <ArrowUpRight size={18} className="shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
