import Link from "next/link";
import { MatchRow } from "@/components/match";
import { ShareButton } from "@/components/public";
import { DayStrip, SectionHead, SportsIndex, fmtDay, timeIST, todayIST } from "@/components/sections";
import { publicEvent, stageLabel, type PublicMatch } from "@/lib/public-data";
import { sportBySlug } from "@/lib/sports";

function BySport({ items, code }: { items: PublicMatch[]; code: string }) {
  const groups = new Map<string, PublicMatch[]>();
  for (const m of items) groups.set(m.sport, [...(groups.get(m.sport) ?? []), m]);
  return (
    <div className="border-t-2 border-ink">
      {[...groups].map(([slug, ms]) => {
        const s = sportBySlug(slug)!;
        return (
          <div key={slug} className="border-b hair">
            <Link href={`/e/${code}/${slug}`} className="label flex justify-between pt-3 hover:text-ink">
              <span>
                {s.name} · {stageLabel(ms[0].stage, ms[0].round, ms[0].grp)}
              </span>
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
  );
}

export default async function EventHome({ params }: { params: { code: string } }) {
  const pe = (await publicEvent(params.code))!;
  const { ev, all, sports, raw } = pe;
  const live = all.filter((m) => m.status === "live");
  // Up next: the first few unplayed matches of each sport's current round, so one big sport doesn't flood the page.
  const next = sports.flatMap((s) => {
    if (!s.current) return [];
    return all.filter((m) => m.sport === s.sport.slug && m.status === "scheduled" && stageLabel(m.stage, m.round) === s.current!.label).slice(0, 3);
  });
  const recent = all
    .filter((m) => m.status === "done" && m.b)
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 6);
  const champions = sports.filter((s) => s.champion);
  const today = todayIST();
  const day = ev.starts_on && ev.ends_on && today >= ev.starts_on && today <= ev.ends_on ? Math.round((Date.parse(today) - Date.parse(ev.starts_on)) / 864e5) + 1 : null;
  const days = ev.starts_on && ev.ends_on ? Math.round((Date.parse(ev.ends_on) - Date.parse(ev.starts_on)) / 864e5) + 1 : null;
  const words = ev.name.split(" ");
  const year = /^\d{4}$/.test(words[words.length - 1]) ? words.pop() : null;

  return (
    <>
      <section className="pb-8 pt-8 md:pb-12 md:pt-14">
        <p className="label">
          {day ? `Day ${day} of ${days} · ` : ""}
          {ev.starts_on && ev.ends_on ? `${fmtDay(ev.starts_on, { day: "numeric", month: "short" })} – ${fmtDay(ev.ends_on, { day: "numeric", month: "long", year: "numeric" })}` : "Fixtures and results"}
        </p>
        <h1 className="mt-3 break-words font-display text-[15vw] font-black uppercase leading-[0.82] tracking-[-0.01em] md:text-[128px]">
          {words.join(" ")} {year && <span className="text-accent">{year.slice(2)}</span>}
        </h1>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Stat n={live.length} label="on now" accent={live.length > 0} />
          <Stat n={all.filter((m) => m.status === "done" && m.b).length} label="played" />
          <Stat n={champions.length} label="of 7 sports decided" />
        </div>
        <div className="mt-5">
          <ShareButton title={ev.name} path={`/e/${ev.code}`} />
        </div>
      </section>

      <DayStrip code={ev.code} start={ev.starts_on} end={ev.ends_on} />

      <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-12 md:gap-10">
        <div className="min-w-0 space-y-12 md:col-span-7">
          {champions.length > 0 && (
            <section>
              <SectionHead title="Champions" />
              <ul className="grid gap-2 border-t-2 border-ink pt-3 sm:grid-cols-2">
                {champions.map((s) => (
                  <li key={s.sport.slug}>
                    <Link href={`/e/${ev.code}/${s.sport.slug}`} className="block rounded-xl bg-ink px-4 py-3 text-paper">
                      <span className="label text-paper/60">{s.sport.name}</span>
                      <span className="mt-1 block truncate font-display text-2xl font-extrabold uppercase leading-none">{s.champion}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <SectionHead title="On now" meta={live.length ? `${live.length} live` : undefined} />
            {live.length ? <BySport items={live} code={ev.code} /> : <p className="border-t-2 border-ink pt-4 text-mute">Nothing on a court right now. This page updates by itself.</p>}
          </section>
          {next.length > 0 && (
            <section>
              <SectionHead title="Up next" meta="first few per sport" />
              <BySport items={next} code={ev.code} />
            </section>
          )}
          {recent.length > 0 && (
            <section>
              <SectionHead title="Just in" />
              <div className="divide-y divide-rule/10 border-t-2 border-ink">
                {recent.map((m) => (
                  <div key={m.id}>
                    <p className="label flex justify-between pt-3">
                      <span>
                        {sportBySlug(m.sport)!.name} · {stageLabel(m.stage, m.round, m.grp)}
                      </span>
                      <span>{timeIST(m.updated)}</span>
                    </p>
                    <MatchRow m={m} unit={sportBySlug(m.sport)!.unit} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="md:col-span-5">
          <div className="space-y-10 md:sticky md:top-20">
            <div>
              <SectionHead title="The sports" />
              <SportsIndex code={ev.code} sports={sports} dense />
            </div>
            {raw.changes.length > 0 && (
              <div>
                <SectionHead title="Latest changes" />
                <ul className="space-y-2 border-t-2 border-ink pt-3 text-sm">
                  {raw.changes.slice(0, 4).map((c) => (
                    <li key={c.id} className="grid grid-cols-[44px_1fr] gap-2">
                      <span className="num text-xs text-mute">{timeIST(c.created_at)}</span>
                      <span className="line-clamp-2">{c.summary}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/e/${ev.code}/log`} className="label mt-3 inline-block hover:text-ink">
                  Full change log →
                </Link>
              </div>
            )}
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
