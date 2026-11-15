import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db, eventByCode, must } from "@/lib/db";
import { METHODS } from "@/lib/draw";
import { SPORTS } from "@/lib/sports";

export default async function SportsDesk({ params }: { params: { code: string } }) {
  const ev = (await eventByCode(params.code))!;
  const [entries, settings, draws] = await Promise.all([
    db().from("entries").select("sport, participants!inner(event_id)").is("withdrawn_at", null).eq("participants.event_id", ev.id),
    db().from("sport_settings").select("sport, method").eq("event_id", ev.id),
    db().from("draws").select("sport, kind").eq("event_id", ev.id).is("replaced_at", null),
  ]);
  const count = (slug: string) => (must(entries) as { sport: string }[]).filter((e) => e.sport === slug).length;
  const method = (slug: string) => (must(settings) as { sport: string; method: string }[]).find((s) => s.sport === slug)?.method;
  const drawn = (slug: string, kind: string) => (must(draws) as { sport: string; kind: string }[]).some((d) => d.sport === slug && d.kind === kind);

  return (
    <ol className="mt-6 border-t-2 border-ink">
      {SPORTS.map((s) => {
        const m = method(s.slug);
        const round = drawn(s.slug, "round");
        const steps = [
          s.kind === "doubles" ? drawn(s.slug, "pairs") : s.kind === "team" ? null : true,
          !!m,
          round,
        ];
        const status = round ? "Round 1 drawn" : !m ? "Pick a format" : s.kind === "doubles" && !drawn(s.slug, "pairs") ? "Draw the pairs" : "Ready to draw";
        return (
          <li key={s.slug} className="border-b hair">
            <Link href={`/admin/e/${ev.code}/sports/${s.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4">
              <span className="min-w-0">
                <span className="block font-display text-2xl font-extrabold uppercase leading-none md:text-3xl">{s.name}</span>
                <span className="mt-1.5 block text-sm text-mute">
                  {count(s.slug)} entered{m ? ` · ${METHODS.find((x) => x.id === m)?.name}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden gap-1 sm:flex">
                  {steps.map((ok, i) => (
                    <span key={i} className={`h-1.5 w-5 rounded-full ${ok ? "bg-ink" : ok === null ? "bg-rule/25" : "bg-rule/10"}`} />
                  ))}
                </span>
                <span className={`font-mono text-[11px] uppercase tracking-label ${round ? "text-mute" : "text-accent"}`}>{status}</span>
                <ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
