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

export default async function PrintSport({ params, searchParams }: { params: { code: string; sport: string }; searchParams: { round?: string; view?: string } }) {
  const pe = await publicEvent(params.code);
  if (!pe || !sportBySlug(params.sport)) notFound();
  const v = sportView(pe, params.sport);
  const { sport, summary } = v;
  const current = v.rounds.find((r) => r.matches.some((m) => m.status !== "done" && m.status !== "bye")) ?? v.rounds[v.rounds.length - 1];
  const all = searchParams.round === "all";
  const ko = v.rounds.filter((r) => r.stage === "knockout");
  const bracket = searchParams.view === "bracket" && ko.length > 0;
  const rounds = bracket ? [] : all ? v.rounds : current ? [current] : [];
  const host = headers().get("host") ?? "";
  const link = `${host}/e/${pe.ev.code}/${sport.slug}`;
  const now = new Date().toISOString();

  return (
    <div className="min-h-dvh bg-[#e9e6df] py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2 px-4">
        <Link href={`/e/${pe.ev.code}/${sport.slug}`} className="btn-quiet bg-white">
          ← Back
        </Link>
        <Link href={`?`} className={`btn-quiet bg-white ${!all && !bracket ? "border-black" : ""}`}>
          This round
        </Link>
        <Link href={`?round=all`} className={`btn-quiet bg-white ${all && !bracket ? "border-black" : ""}`}>
          All rounds
        </Link>
        {ko.length > 0 && (
          <Link href={`?view=bracket`} className={`btn-quiet bg-white ${bracket ? "border-black" : ""}`}>
            Bracket
          </Link>
        )}
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

        {bracket && <PrintBracket rounds={ko} final={v.finalTable} done={!!summary.champion || v.finalTable.length > 0} room={summary.champion ? 640 : 750} />}

        {!rounds.length && !bracket && <p className="mt-10 text-lg">The draw hasn&apos;t been made yet.</p>}

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

/**
 * The knockout as one A4 page, drawn as a real bracket: every match sits level with the two matches that fed it,
 * joined by lines. Feeders are found from who actually played (rolling-bye rounds are re-drawn each round),
 * so the earlier rounds are re-ordered to keep lines from crossing. Rounds not drawn yet print as empty boxes.
 */
function PrintBracket({ rounds, final, done, room }: { room: number; rounds: { key: string; label: string; matches: PublicMatch[] }[]; final: { id: string; name: string; won: number; lost: number; diff: number }[]; done: boolean }) {
  const W = 700; // px across the A4 print area
  type Node = { id: string; m: PublicMatch | null; x: number; y: number; h: number; from: string[] };

  // 1. Order every drawn round from the last one backwards: a match's feeders sit together, in its order.
  const has = (m: PublicMatch, id: string | null) => !!id && (m.aId === id || m.bId === id);
  const feeders = (r: number, m: PublicMatch) => (r === 0 ? [] : [m.aId, m.bId].map((id) => rounds[r - 1].matches.find((f) => has(f, id))).filter((f): f is PublicMatch => !!f));
  const order: PublicMatch[][] = rounds.map(() => []);
  const last = rounds.length - 1;
  order[last] = [...rounds[last].matches].sort((a, b) => a.no - b.no);
  for (let r = last; r > 0; r--) {
    const seen = new Set<string>();
    for (const m of order[r])
      for (const f of feeders(r, m))
        if (!seen.has(f.id)) {
          seen.add(f.id);
          order[r - 1].push(f);
        }
    order[r - 1].push(...rounds[r - 1].matches.filter((m) => !seen.has(m.id)).sort((a, b) => a.no - b.no));
  }

  // 2. Columns: drawn rounds, then empty rounds still to come, then a final round robin if there is one.
  const todo: number[] = [];
  if (!done) for (let left = rounds[last].matches.length; left > 1; ) todo.push((left = Math.ceil(left / 2)));
  const cols = rounds.length + todo.length + (final.length ? 1 : 0);
  const H = Math.min(room, rounds[0].matches.length * 64); // up to what's left once the header (and champion) and footer are in
  const colW = Math.min(W / cols, 230); // small brackets stay compact instead of stretching across the page
  const gap = Math.min(26, colW * 0.2);
  const boxW = colW - gap;
  const unit = H / order[0].length;
  const boxH = Math.min(unit - 3, unit * 0.86, 30); // always leaves a gap between boxes
  const font = Math.max(5, Math.min(10.5, boxH * 0.36));

  // Lucky losers and re-drawn rounds can put two boxes at the same height: push them apart, keep them on the page.
  // Done column by column, so the next round is centred on where its feeders really ended up.
  const spread = (col: Node[]) => {
    const c = [...col].sort((x, y) => x.y - y.y);
    const space = (c[0]?.h ?? boxH) + 3;
    for (let i = 1; i < c.length; i++) c[i].y = Math.max(c[i].y, c[i - 1].y + space);
    if (c.length) c[c.length - 1].y = Math.min(c[c.length - 1].y, H - c[0].h / 2);
    for (let i = c.length - 2; i >= 0; i--) c[i].y = Math.min(c[i].y, c[i + 1].y - space);
    if (c.length) c[0].y = Math.max(c[0].y, c[0].h / 2);
    return col;
  };

  // 3. Place: round 1 evenly, every later match level with its feeders.
  const nodes: Node[][] = [];
  order.forEach((list, r) => {
    const prev = nodes[r - 1] ?? [];
    nodes.push(
      spread(
        list.map((m, i) => {
          const fs = feeders(r, m).map((f) => prev.find((n) => n.id === f.id)!).filter(Boolean);
          const y = fs.length ? fs.reduce((t, n) => t + n.y, 0) / fs.length : (i + 0.5) * (H / list.length);
          return { id: m.id, m, x: r * colW, y, h: boxH, from: fs.map((n) => n.id) };
        }),
      ),
    );
  });
  todo.forEach((count, t) => {
    const prev = [...nodes[nodes.length - 1]].sort((a, b) => a.y - b.y);
    const h = Math.max(boxH, Math.min(H / count - 3, 30)); // empty boxes get room for two hand-written names
    nodes.push(
      spread(
        Array.from({ length: count }, (_, i) => {
          const fs = prev.slice(i * 2, i * 2 + 2);
          return { id: `todo-${t}-${i}`, m: null, x: (rounds.length + t) * colW, y: fs.reduce((s, n) => s + n.y, 0) / fs.length, h, from: fs.map((n) => n.id) };
        }),
      ),
    );
  });
  const all = new Map(nodes.flat().map((n) => [n.id, n]));
  const labels = [...rounds.map((r) => r.label), ...todo.map((c, i) => (i === todo.length - 1 && c === 1 ? "Final" : `Round ${rounds.length + i + 1}`))];
  const head = "absolute top-0 border-b-2 border-black font-display text-[12px] font-black uppercase leading-none";

  return (
    <section className="avoid-break mt-6" style={{ fontSize: `${font}px` }}>
      <div className="relative mb-[2mm] h-[16px]">
        {labels.map((l, i) => (
          <p key={i} className={head} style={{ left: i * colW, width: boxW }}>
            {l}
          </p>
        ))}
        {final.length > 0 && (
          <p className={head} style={{ left: (cols - 1) * colW, width: boxW }}>
            Final round robin
          </p>
        )}
      </div>
      <div className="relative" style={{ width: W, height: H }}>
        <svg className="absolute inset-0" width={W} height={H} aria-hidden>
          {nodes.flat().flatMap((n) =>
            n.from.map((fid) => {
              const f = all.get(fid)!;
              const mid = f.x + boxW + gap / 2;
              return <path key={`${fid}-${n.id}`} d={`M${f.x + boxW} ${f.y}H${mid}V${n.y}H${n.x}`} fill="none" stroke="#000" strokeWidth={0.8} />;
            }),
          )}
        </svg>
        {nodes.flat().map((n) => (
          <div key={n.id} className="absolute flex flex-col justify-center overflow-hidden border border-black bg-white px-[1.2mm] leading-[1.1]" style={{ left: n.x, top: n.y - n.h / 2, width: boxW, height: n.h }}>
            {n.m ? (
              (["a", "b"] as const).map((side) => {
                const m = n.m!;
                const who = side === "a" ? m.a : m.b;
                if (side === "b" && !who) return <p key={side} className="uppercase tracking-wider text-black/45">bye</p>;
                const won = m.status === "done" && m.winner === side;
                return (
                  <p key={side} className={`flex justify-between gap-1 ${won ? "font-bold" : m.status === "done" ? "text-black/55" : ""}`}>
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{who}</span>
                    {m.sets && <span className="shrink-0 font-mono">{side === "a" ? m.sets.a : m.sets.b}</span>}
                  </p>
                );
              })
            ) : (
              <span className="flex h-full flex-col justify-evenly">
                <span className="block border-b border-dotted border-black/45" />
                <span className="block border-b border-dotted border-black/45" />
              </span>
            )}
          </div>
        ))}
        {final.length > 0 && (
          <div className="absolute border border-black bg-white px-[1.5mm] py-[1mm]" style={{ left: (cols - 1) * colW, top: H / 2 - final.length * 9, width: boxW }}>
            {final.map((r, i) => (
              <p key={r.id} className={`flex justify-between gap-1 ${i === 0 ? "font-bold" : ""}`}>
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {i + 1}. {r.name}
                </span>
                <span className="shrink-0 font-mono">
                  {r.won}–{r.lost}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
