import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MatchDesk } from "@/components/match-desk";
import { Folded } from "@/components/sport-setup";
import { db, eventByCode, must } from "@/lib/db";
import { nextStep } from "@/lib/rounds";
import { loadSport } from "@/lib/sport-data";
import { sportBySlug } from "@/lib/sports";

const HINT: Record<string, string> = {
  chess: "1-0",
  carrom: "29-14",
  "table-tennis": "11-7, 9-11, 11-5",
  badminton: "21-15, 21-18",
  pickleball: "11-7, 11-9",
  volleyball: "25-20, 25-22",
  cricket: "e.g. 98/4 vs 85/7",
};

export default async function Play({ params }: { params: { code: string; sport: string } }) {
  if (!sportBySlug(params.sport)) notFound();
  const ev = (await eventByCode(params.code))!;
  const st = await loadSport(ev, params.sport);
  const names = Object.fromEntries(st.sides.map((s) => [s.id, s.name]));
  const next = st.matches.length ? nextStep(st.settings.method, st.settings.options, st.matches, "peek") : null;
  const changes = must(await db().from("changes").select("id, summary, created_at").eq("event_id", ev.id).eq("sport", params.sport).order("created_at", { ascending: false }).limit(40)) as {
    id: string;
    summary: string;
    created_at: string;
  }[];

  return (
    <div className="mt-6 max-w-2xl">
      <Link href={`/admin/e/${ev.code}/sports/${params.sport}`} className="label inline-flex items-center gap-1.5 hover:text-ink">
        <ArrowLeft size={13} /> {st.sport.name} setup
      </Link>
      <div className="mb-6 mt-2 flex items-end justify-between gap-3">
        <h1 className="font-display text-5xl font-black uppercase leading-[0.85]">{st.sport.name}</h1>
        <Link href={`/print/${ev.code}/${params.sport}`} className="btn-quiet shrink-0">
          Print sheet
        </Link>
      </div>
      <MatchDesk
        code={ev.code}
        slug={params.sport}
        unit={st.sport.unit}
        courts={st.settings.options.courts}
        scoreHint={HINT[params.sport] ?? "21-15"}
        matches={st.matches}
        names={names}
        champion={next?.kind === "champion" ? names[next.id] : null}
      />
      {changes.length > 0 && (
        <section className="mt-10">
          <Folded title="Change log" count={changes.length}>
            <ul className="space-y-2 text-sm">
              {changes.map((c) => (
                <li key={c.id} className="grid grid-cols-[52px_1fr] gap-2">
                  <span className="num text-xs text-mute">{new Date(c.created_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{c.summary}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-mute">This log is public once the event pages go live.</p>
          </Folded>
        </section>
      )}
    </div>
  );
}
