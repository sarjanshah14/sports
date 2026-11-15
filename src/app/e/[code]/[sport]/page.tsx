import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FixtureList } from "@/components/client";
import { fmtDay } from "@/components/sections";
import { entrants } from "@/lib/dummy";
import { EVENT, matchesFor, sportSummary } from "@/lib/mock-event";
import { SPORTS, sportBySlug } from "@/lib/sports";

export function generateStaticParams() {
  return SPORTS.map((s) => ({ code: EVENT.code, sport: s.slug }));
}

/** Rolling bye: each round, an odd field gives one random player a bye. */
function rollingRounds(n: number) {
  const out: { field: number; matches: number; bye: boolean }[] = [];
  while (n > 1) {
    out.push({ field: n, matches: Math.floor(n / 2), bye: n % 2 === 1 });
    n = Math.ceil(n / 2);
  }
  return out;
}

const roundName = (left: number, field: number) => (field === 2 ? "Final" : field <= 4 ? "Semis" : field <= 8 ? "Quarters" : `Round ${left}`);

export default function SportPage({ params }: { params: { code: string; sport: string } }) {
  const sport = sportBySlug(params.sport);
  if (!sport) notFound();
  const sum = sportSummary(sport);
  const matches = matchesFor(sport.slug);
  const rounds = rollingRounds(sum.sides);
  const idx = SPORTS.indexOf(sport) + 1;
  const kindLabel = sport.kind === "singles" ? "Singles" : sport.kind === "doubles" ? "Doubles · random pairs" : "Teams via auction";

  return (
    <>
      <Link href={`/e/${params.code}/sports`} className="label mt-5 inline-flex items-center gap-1.5 hover:text-ink md:hidden">
        <ArrowLeft size={13} /> All sports
      </Link>

      <section className="pb-6 pt-4 md:pb-10 md:pt-14">
        <p className="label">
          {String(idx).padStart(2, "0")} · {sport.group} · {kindLabel}
        </p>
        <h1 className="mt-2 break-words font-display text-[17vw] font-black uppercase leading-[0.82] md:text-[128px]">{sport.name}</h1>
        <dl className="mt-6 grid grid-cols-2 border-t-2 border-ink md:grid-cols-4">
          <Meta k="Date" v={`${fmtDay(sport.date, { weekday: "short", day: "numeric", month: "short" })}${sport.endDate ? ` – ${fmtDay(sport.endDate, { day: "numeric" })}` : ""}`} />
          <Meta k="Where" v={sport.time ? `${sport.venue}, ${sport.time}` : sport.venue} />
          <Meta k="Entries" v={sport.kind === "doubles" ? `${sum.entries} → ${sum.sides} pairs` : String(sum.entries)} />
          <Meta k="Format" v={sport.kind === "team" ? "Groups → knockout" : `Knockout · ${rounds.length} rounds`} />
        </dl>
        {sum.state === "live" && (
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-mute">Round 1</span>
              <span className="num">
                {sum.done}/{sum.total} played{sum.live ? <span className="text-accent"> · {sum.live} live</span> : null}
              </span>
            </div>
            <div className="mt-2 h-1 bg-rule/10">
              <div className="h-full bg-accent" style={{ width: `${(sum.done / sum.total) * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      {sport.kind === "team" ? (
        <TeamsPending slug={sport.slug} />
      ) : (
        <div className="grid gap-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-8">
            <div className="no-scrollbar -mx-4 mb-1 flex gap-5 overflow-x-auto border-b hair px-4 md:mx-0 md:px-0">
              {rounds.map((r, i) => (
                <span key={i} className={`shrink-0 border-b-2 pb-2.5 font-display text-lg font-bold uppercase ${i === 0 ? "border-accent text-ink" : "border-transparent text-mute/60"}`}>
                  {roundName(i + 1, r.field)}
                </span>
              ))}
            </div>
            <FixtureList matches={matches} unit={sport.unit} />
          </div>
          <aside className="space-y-8 md:col-span-4">
            <div className="md:sticky md:top-20">
              <h2 className="font-display text-2xl font-extrabold uppercase">How it narrows</h2>
              <p className="mt-1 text-sm text-mute">Rolling bye: when a round has an odd number, one player is drawn for a bye. Nobody gets two.</p>
              <ol className="mt-4 border-t-2 border-ink">
                {rounds.map((r, i) => (
                  <li key={i} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-4 border-b hair py-2.5 text-sm">
                    <span>{roundName(i + 1, r.field)}</span>
                    <span className="num text-mute">
                      {r.field} → {r.matches} {r.matches === 1 ? "match" : "matches"}
                    </span>
                    <span className={`label whitespace-nowrap text-right ${r.bye ? "text-accent" : "opacity-0"}`}>+1 bye</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-lg border hair bg-sheet p-4">
                <p className="label">Draw record</p>
                <p className="mt-2 text-sm">
                  Round 1 drawn by the committee app on <span className="num">20 Dec, 21:14</span>.
                </p>
                <p className="mt-1 text-sm text-mute">
                  Seed <span className="num text-ink">{(sport.slug.length * 7919).toString(16).toUpperCase()}</span> · anyone can re-run it and get the same draw.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
      <div className="h-12" />
    </>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b hair py-3 pr-4">
      <dt className="label">{k}</dt>
      <dd className="mt-1 text-[15px]">{v}</dd>
    </div>
  );
}

function TeamsPending({ slug }: { slug: string }) {
  const people = entrants(slug);
  const roleOf = (p: (typeof people)[number]) => (slug === "cricket" ? p.cricketRole : p.volleyballRole) ?? "—";
  const roles = new Map<string, number>();
  for (const p of people) roles.set(roleOf(p), (roles.get(roleOf(p)) ?? 0) + 1);
  const max = Math.max(...roles.values());
  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-7">
        <div className="rounded-xl border-2 border-dashed border-rule/25 p-6 md:p-10">
          <p className="label text-accent">Waiting on the auction</p>
          <p className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight md:text-4xl">Teams go up once captains hand in their sheets.</p>
          <p className="mt-3 max-w-md text-mute">Every one of the {people.length} players gets picked. Groups and fixtures are drawn here right after, in public.</p>
        </div>
      </div>
      <div className="md:col-span-5">
        <h2 className="font-display text-2xl font-extrabold uppercase">In the pool</h2>
        <ul className="mt-3 border-t-2 border-ink">
          {[...roles].sort((a, b) => b[1] - a[1]).map(([role, n]) => (
            <li key={role} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 border-b hair py-2.5 text-sm">
              <span>{role}</span>
              <span className="h-1.5 bg-rule/10">
                <span className="block h-full bg-ink" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="num text-right">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
