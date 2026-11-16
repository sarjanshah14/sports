import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown } from "lucide-react";
import { RoundView, ShareButton } from "@/components/public";
import { Folded } from "@/components/sport-setup";
import { fmtDay, timeIST } from "@/components/sections";
import { publicEvent, sportView } from "@/lib/public-data";
import { SPORTS, sportBySlug } from "@/lib/sports";

export default async function SportPage({ params }: { params: { code: string; sport: string } }) {
  if (!sportBySlug(params.sport)) notFound();
  const pe = (await publicEvent(params.code))!;
  const v = sportView(pe, params.sport);
  const { sport, summary } = v;
  const idx = SPORTS.findIndex((s) => s.slug === sport.slug) + 1;
  const kindLabel = sport.kind === "singles" ? "Singles" : sport.kind === "doubles" ? "Doubles · random pairs" : "Teams via auction";
  const current = v.rounds.find((r) => r.matches.some((m) => m.status === "live" || m.status === "scheduled")) ?? v.rounds[v.rounds.length - 1];
  const liveDraws = v.draws.filter((d) => !d.replaced_at);

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
          <Meta k="Entries" v={sport.kind === "doubles" && v.sides ? `${summary.entries} → ${v.sides} pairs` : sport.kind === "team" && v.sides ? `${v.sides} teams` : String(summary.entries)} />
          <Meta k="Format" v={v.method?.name ?? "Being decided"} />
        </dl>
        {summary.current && !summary.champion && (
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-mute">{summary.current.label}</span>
              <span className="num">
                {summary.current.done}/{summary.current.total} played{summary.live ? <span className="text-accent"> · {summary.live} live</span> : null}
              </span>
            </div>
            <div className="mt-2 h-1 bg-rule/10">
              <div className="h-full bg-accent" style={{ width: `${summary.current.total ? (summary.current.done / summary.current.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </section>

      <div className="-mt-2 mb-8 flex flex-wrap gap-2">
        <ShareButton title={`${sport.name} · ${pe.ev.name}`} path={`/e/${params.code}/${sport.slug}`} />
        <Link href={`/print/${params.code}/${sport.slug}`} className="btn-quiet">
          Print / PDF
        </Link>
      </div>

      {summary.champion && (
        <div className="mb-10 rounded-xl bg-ink p-5 text-paper md:p-8">
          <p className="label text-paper/60">Champion</p>
          <p className="mt-1 flex items-center gap-3 font-display text-4xl font-black uppercase leading-none md:text-6xl">
            <Crown className="shrink-0 text-accent" size={36} /> {summary.champion}
          </p>
        </div>
      )}

      {!v.rounds.length ? (
        <div className="rounded-xl border-2 border-dashed border-rule/25 p-6 md:p-10">
          <p className="label text-accent">{sport.kind === "team" ? "Waiting on the auction" : "Draw not out yet"}</p>
          <p className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight md:text-4xl">
            {sport.kind === "team" ? "Teams go up once captains hand in their sheets." : "The draw happens here, in public, with its seed recorded."}
          </p>
          <p className="mt-3 max-w-md text-mute">{summary.entries} entered. This page updates by itself.</p>
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-8">
            {v.groups.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-3 font-display text-2xl font-extrabold uppercase">Group tables</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {v.groups.map((g) => (
                    <Table key={g.g} title={`Group ${g.g}`} rows={g.rows} through={g.perGroup} />
                  ))}
                </div>
              </section>
            )}
            {v.finalTable.length > 0 && (
              <section className="mb-10">
                <Table title="Final round robin" rows={v.finalTable} through={1} />
              </section>
            )}
            <RoundView rounds={v.rounds} current={current.key} unit={sport.unit} />
          </div>

          <aside className="space-y-8 md:col-span-4">
            <div className="md:sticky md:top-20 md:space-y-8">
              {v.method && (
                <section>
                  <h2 className="font-display text-2xl font-extrabold uppercase">How it&apos;s decided</h2>
                  <p className="mt-1 font-medium">{v.method.name}</p>
                  <p className="mt-1 text-sm text-mute">{v.method.how}</p>
                  <p className="mt-3 text-sm">
                    <span className="num">{v.byes}</span> {v.byes === 1 ? "bye" : "byes"} so far
                  </p>
                </section>
              )}
              <section className="mt-8 md:mt-0">
                <Folded title="Draw record" count={v.draws.length}>
                  <ul className="space-y-2.5 text-sm">
                    {v.draws.map((d) => (
                      <li key={d.id}>
                        <p className="flex justify-between gap-2">
                          <span className={d.replaced_at ? "text-mute line-through" : ""}>
                            {d.kind === "pairs" ? "Pairs" : d.kind === "repair" ? "No-show re-pair" : `Round ${d.round}`}
                          </span>
                          <span className="num text-xs text-mute">
                            {fmtDay(d.created_at, { day: "numeric", month: "short" })} {timeIST(d.created_at)}
                          </span>
                        </p>
                        <p className="text-xs text-mute">
                          Seed <span className="num text-ink">{d.seed}</span>
                          {d.replaced_at ? <span className="text-accent"> · redone: {d.note}</span> : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-mute">
                    {liveDraws.length} in use. Same names + same seed always give the same draw, so anyone can check it.
                  </p>
                </Folded>
              </section>
              {v.changes.length > 0 && (
                <section className="mt-3 md:mt-0">
                  <Folded title="Change log" count={v.changes.length}>
                    <ul className="space-y-2 text-sm">
                      {v.changes.slice(0, 30).map((c) => (
                        <li key={c.id} className="grid grid-cols-[44px_1fr] gap-2">
                          <span className="num text-xs text-mute">{timeIST(c.created_at)}</span>
                          <span>{c.summary}</span>
                        </li>
                      ))}
                    </ul>
                  </Folded>
                </section>
              )}
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

function Table({ title, rows, through }: { title: string; rows: { id: string; name: string; won: number; lost: number; diff: number; pts: number }[]; through: number }) {
  return (
    <div className="rounded-xl border hair p-3">
      <p className="label mb-1">{title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-mute">
            <th className="py-1 font-normal" />
            <th className="w-7 text-right font-normal">W</th>
            <th className="w-7 text-right font-normal">L</th>
            <th className="w-10 text-right font-normal">+/−</th>
            <th className="w-8 text-right font-normal">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className={i === through - 1 ? "border-b border-dashed border-rule/30" : ""}>
              <td className={`max-w-0 truncate py-1 ${i < through ? "font-medium" : "text-mute"}`}>{r.name}</td>
              <td className="num text-right">{r.won}</td>
              <td className="num text-right">{r.lost}</td>
              <td className="num text-right text-mute">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className="num text-right font-medium">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
