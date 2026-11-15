import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/public";
import { fmtDay, timeIST } from "@/components/sections";
import { publicEvent, sportView, type PublicMatch } from "@/lib/public-data";
import { sportBySlug } from "@/lib/sports";

// A4 sheet for the notice board. "Save as PDF" in the print dialog gives the PDF.

export async function generateMetadata({ params }: { params: { code: string; sport: string } }) {
  return { title: `${sportBySlug(params.sport)?.name ?? "Fixtures"} — print` };
}

export default async function PrintSport({ params, searchParams }: { params: { code: string; sport: string }; searchParams: { round?: string } }) {
  const pe = await publicEvent(params.code);
  if (!pe || !sportBySlug(params.sport)) notFound();
  const v = sportView(pe, params.sport);
  const { sport, summary } = v;
  const current = v.rounds.find((r) => r.matches.some((m) => m.status !== "done" && m.status !== "bye")) ?? v.rounds[v.rounds.length - 1];
  const all = searchParams.round === "all";
  const rounds = all ? v.rounds : current ? [current] : [];
  const host = headers().get("host") ?? "";
  const link = `${host}/e/${pe.ev.code}/${sport.slug}`;
  const now = new Date().toISOString();

  return (
    <div className="min-h-dvh bg-[#e9e6df] py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2 px-4">
        <Link href={`/e/${pe.ev.code}/${sport.slug}`} className="btn-quiet bg-white">
          ← Back
        </Link>
        <Link href={`?`} className={`btn-quiet bg-white ${!all ? "border-black" : ""}`}>
          This round
        </Link>
        <Link href={`?round=all`} className={`btn-quiet bg-white ${all ? "border-black" : ""}`}>
          All rounds
        </Link>
        <span className="ml-auto">
          <PrintButton />
        </span>
      </div>

      <article className="sheet mx-auto max-w-[210mm] p-[12mm] shadow-xl">
        <header className="flex items-end justify-between gap-6 border-b-4 border-black pb-3">
          <div>
            <p className="label text-black">{pe.ev.name}</p>
            <h1 className="font-display text-7xl font-black uppercase leading-[0.85]">{sport.name}</h1>
          </div>
          <div className="text-right text-xs leading-relaxed">
            <p>
              {fmtDay(sport.date, { weekday: "short", day: "numeric", month: "short" })} · {sport.venue}
              {sport.time ? `, ${sport.time}` : ""}
            </p>
            <p>
              {summary.entries} entered · {v.method?.name ?? "Format to be announced"}
            </p>
            <p className="font-mono">Updated {fmtDay(new Date(Date.parse(now) + 5.5 * 3600e3).toISOString(), { day: "numeric", month: "short" })} {timeIST(now)}</p>
          </div>
        </header>

        {summary.champion && (
          <p className="avoid-break mt-5 border-2 border-black px-4 py-3 font-display text-3xl font-black uppercase">
            Champion: <span className="text-accent">{summary.champion}</span>
          </p>
        )}

        {v.groups.length > 0 && (
          <section className="mt-6 grid grid-cols-2 gap-4">
            {v.groups.map((g) => (
              <div key={g.g} className="avoid-break border border-black p-2">
                <p className="font-display text-xl font-bold uppercase">Group {g.g}</p>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr key={r.id} className="border-t border-black/20">
                        <td className="py-0.5">
                          {i + 1}. {r.name}
                        </td>
                        <td className="w-14 text-right font-mono">
                          {r.won}–{r.lost}
                        </td>
                        <td className="w-10 text-right font-mono font-bold">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}

        {!rounds.length && <p className="mt-10 text-lg">The draw hasn&apos;t been made yet.</p>}

        {rounds.map((r) => (
          <section key={r.key} className="mt-7">
            <h2 className="mb-2 flex items-baseline justify-between border-b-2 border-black pb-1 font-display text-3xl font-black uppercase">
              {r.label}
              <span className="font-mono text-xs font-normal normal-case">
                {r.matches.filter((m) => m.b).length} matches{r.matches.some((m) => !m.b) ? ` · ${r.matches.filter((m) => !m.b).length} bye` : ""}
              </span>
            </h2>
            <div className="columns-2 gap-6 text-[12.5px]">
              {r.matches.map((m) => (
                <Row key={m.id} m={m} unit={sport.unit} />
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-8 flex items-end justify-between border-t-2 border-black pt-2 text-xs">
          <p>
            Live results, every draw and the change log: <b className="font-mono">{link}</b>
          </p>
          <p className="font-mono">
            Code <b className="text-base">{pe.ev.code}</b>
          </p>
        </footer>
      </article>
    </div>
  );
}

function Row({ m, unit }: { m: PublicMatch; unit: string }) {
  const done = m.status === "done";
  const box = "inline-block h-4 w-7 border border-black align-middle";
  return (
    <div className="avoid-break grid grid-cols-[26px_1fr_auto] items-center gap-x-2 border-b border-black/15 py-1">
      <span className="font-mono text-[10px] text-black/60">{m.grp ? `${m.grp}${m.no}` : m.no}</span>
      <span className="min-w-0">
        <span className={`block truncate ${done && m.winner === "a" ? "font-bold" : ""}`}>{m.a}</span>
        {m.b ? (
          <span className={`block truncate ${done && m.winner === "b" ? "font-bold" : ""}`}>{m.b}</span>
        ) : (
          <span className="block text-[10px] uppercase tracking-wider text-black/60">bye</span>
        )}
      </span>
      <span className="text-right font-mono text-[11px]">
        {!m.b ? null : done ? (
          m.sets ? (
            <>
              <span className="block">{m.sets.a}</span>
              <span className="block">{m.sets.b}</span>
            </>
          ) : (
            <span>{m.score === "W/O" ? "W/O" : "✓"}</span>
          )
        ) : (
          <>
            <span className={box} />
            <br />
            <span className={`${box} mt-0.5`} />
          </>
        )}
        {m.court && !done ? <span className="block text-[9px]">{unit} {m.court}</span> : null}
      </span>
    </div>
  );
}
