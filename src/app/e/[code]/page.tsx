import Link from "next/link";
import { MatchRow } from "@/components/match";
import { DayStrip, SectionHead, SportsIndex, fmtDay } from "@/components/sections";
import { EVENT, MATCHES, type Match } from "@/lib/mock-event";
import { sportBySlug } from "@/lib/sports";

function Group({ title, items, code }: { title: string; items: Match[]; code: string }) {
  const groups = new Map<string, Match[]>();
  for (const m of items) groups.set(m.sport, [...(groups.get(m.sport) ?? []), m]);
  return (
    <section>
      <SectionHead title={title} meta={`${items.length} matches`} />
      <div className="border-t-2 border-ink">
        {[...groups].map(([slug, ms]) => {
          const s = sportBySlug(slug)!;
          return (
            <div key={slug} className="border-b hair">
              <Link href={`/e/${code}/${slug}`} className="label flex justify-between pt-3 hover:text-ink">
                <span>{s.name} · Round 1</span>
                <span>{s.venue}</span>
              </Link>
              <div className="divide-y divide-rule/10">
                {ms.map((m) => (
                  <MatchRow key={m.id} m={m} unit={s.unit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function EventHome() {
  const live = MATCHES.filter((m) => m.status === "live");
  const next = MATCHES.filter((m) => m.status === "next");
  const recent = MATCHES.filter((m) => m.status === "done" && m.b).slice(-6).reverse();
  const code = EVENT.code;
  const day = Math.floor((Date.parse(EVENT.now) - Date.parse(EVENT.start + "T00:00:00+05:30")) / 864e5) + 1;

  return (
    <>
      <section className="pb-8 pt-8 md:pb-12 md:pt-14">
        <p className="label">
          Day {day} of 7 · {fmtDay(EVENT.start, { day: "numeric" })}–{fmtDay(EVENT.end, { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-3 font-display text-[19vw] font-black uppercase leading-[0.82] tracking-[-0.01em] md:text-[148px]">
          Sports
          <br />
          Week <span className="text-accent">{EVENT.edition.slice(2)}</span>
        </h1>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Stat n={live.length} label="on the boards" accent />
          <Stat n={MATCHES.filter((m) => m.status === "done" && m.b).length} label="played today" />
          <Stat n={7} label="sports" />
        </div>
      </section>

      <DayStrip code={code} />

      <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-12 md:gap-10">
        <div className="min-w-0 space-y-12 md:col-span-7">
          <Group title="On now" items={live} code={code} />
          <Group title="Called next" items={next} code={code} />
          <section>
            <SectionHead title="Just in" />
            <div className="divide-y divide-rule/10 border-t-2 border-ink">
              {recent.map((m) => (
                <div key={m.id}>
                  <p className="label pt-3">{sportBySlug(m.sport)!.name}</p>
                  <MatchRow m={m} unit={sportBySlug(m.sport)!.unit} />
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="md:col-span-5">
          <div className="md:sticky md:top-20">
            <SectionHead title="The sports" meta="Tap for fixtures" />
            <SportsIndex code={code} dense />
          </div>
        </aside>
      </div>
      <div className="h-12" />
    </>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`num text-2xl font-medium ${accent ? "text-accent" : ""}`}>{n}</span>
      <span className="text-mute">{label}</span>
    </span>
  );
}
