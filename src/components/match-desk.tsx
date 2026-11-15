"use client";

import { useMemo, useState, useTransition } from "react";
import { Crown, Search, Shuffle, UserX } from "lucide-react";
import { addDecider, advance, customRound, rePairAbsent, rearrangeRound, setAbsent, setLive, setResult, walkover } from "@/app/admin/match-actions";
import { advancers, rearrangeable, standings } from "@/lib/rounds";
import { PairBuilder } from "./pair-builder";
import type { MatchRow } from "@/lib/sport-data";

type Filter = "todo" | "live" | "done" | "all";

const stageTitle = (m: { stage: string; round: number; grp: string | null }) =>
  m.stage === "group" ? "Group stage" : m.stage === "swiss" ? `Swiss round ${m.round}` : m.stage === "final3" ? (m.round > 1 ? "Decider" : "Final round robin") : `Round ${m.round}`;

export function MatchDesk({
  code,
  slug,
  unit,
  courts,
  scoreHint,
  matches,
  names,
  champion,
}: {
  code: string;
  slug: string;
  unit: string;
  courts: number;
  scoreHint: string;
  matches: MatchRow[];
  names: Record<string, string>;
  champion: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("todo");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [tie, setTie] = useState<{ id: string; name: string }[] | null>(null);
  const [builder, setBuilder] = useState<"next" | "rearrange" | null>(null);
  const [pending, start] = useTransition();
  const name = (id: string | null) => (id ? names[id] ?? "?" : "—");

  // Only the stage/round being played right now; finished rounds live in "All".
  const active = matches.filter((m) => m.status !== "void");
  const rank: Record<string, number> = { group: 0, swiss: 0, knockout: 1, final3: 2 };
  const top = active.reduce((s, m) => (rank[m.stage] > rank[s] ? m.stage : s), active[0]?.stage ?? "knockout");
  const topRound = Math.max(0, ...active.filter((m) => m.stage === top).map((m) => m.round));
  const current = active.filter((m) => m.stage === top && (top === "group" || m.round === topRound));
  const playable = current.filter((m) => m.side_b);
  const doneCount = playable.filter((m) => m.status === "done").length;
  const roundDone = current.length > 0 && current.every((m) => m.status === "done" || m.status === "bye");
  const waiting = current.filter((m) => m.status !== "done" && (m.absent === "a" || m.absent === "b"));
  const adv = advancers(matches);
  const unstarted = rearrangeable(matches);
  const busyCourts = new Set(active.filter((m) => m.status === "live" && m.court).map((m) => m.court));

  const pool = filter === "all" ? active : current;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return pool
      .filter((m) => m.side_b || filter === "all")
      .filter((m) => (filter === "todo" ? m.status === "scheduled" || m.status === "live" : filter === "live" ? m.status === "live" : filter === "done" ? m.status === "done" : true))
      .filter((m) => !s || name(m.side_a).toLowerCase().includes(s) || name(m.side_b).toLowerCase().includes(s))
      .sort((a, b) => Number(b.status === "live") - Number(a.status === "live") || (a.grp ?? "").localeCompare(b.grp ?? "") || a.no - b.no);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, filter, q]);

  const run = (f: () => Promise<unknown>) =>
    start(async () => {
      setErr("");
      try {
        const r = (await f()) as { tie?: { id: string; name: string }[] } | undefined;
        if (r?.tie) setTie(r.tie);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong");
      }
    });

  if (!matches.length) return <p className="text-mute">Draw round 1 first; matches appear here.</p>;

  return (
    <div className="space-y-5">
      {champion ? (
        <div className="rounded-xl bg-ink p-5 text-paper">
          <p className="label text-paper/60">Champion</p>
          <p className="mt-1 flex items-center gap-2 font-display text-4xl font-black uppercase leading-none">
            <Crown className="text-accent" /> {champion}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none">{stageTitle(current[0] ?? { stage: top, round: topRound, grp: null })}</h2>
            <span className="num text-sm">
              {doneCount}/{playable.length} done
            </span>
          </div>
          <div className="mt-2 h-1 bg-rule/10">
            <div className="h-full bg-accent transition-all" style={{ width: `${playable.length ? (doneCount / playable.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {top === "final3" && (
        <table className="w-full text-sm">
          <thead>
            <tr className="label text-left">
              <th className="py-1 font-normal">Standings</th>
              <th className="w-10 text-right font-normal">W</th>
              <th className="w-10 text-right font-normal">L</th>
              <th className="w-12 text-right font-normal">+/−</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/10 border-y hair">
            {standings(current, [...new Set(current.flatMap((m) => [m.side_a!, m.side_b!]))]).map((r, i) => (
              <tr key={r.id}>
                <td className="py-1.5">
                  <span className="num mr-2 text-mute">{i + 1}</span>
                  {name(r.id)}
                </td>
                <td className="num text-right">{r.won}</td>
                <td className="num text-right">{r.lost}</td>
                <td className="num text-right text-mute">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {err && <p className="rounded-lg border border-accent/40 px-3 py-2 text-sm text-accent">{err}</p>}

      {!champion && roundDone && !tie && !builder && (
        <div className="space-y-2">
          <button onClick={() => run(() => advance(code, slug))} disabled={pending} className="btn w-full py-3.5 text-base">
            <Shuffle size={16} /> {pending ? "Working…" : "Round finished: draw the next one"}
          </button>
          {adv && (
            <button onClick={() => setBuilder("next")} className="btn-quiet w-full">
              Set the next round yourself
            </button>
          )}
        </div>
      )}

      {builder === "next" && adv && (
        <PairBuilder
          players={[...new Set(adv.through)].map((id) => ({ id, name: name(id) }))}
          bringBack={adv.out.map((id) => ({ id, name: name(id) }))}
          allowRobin={new Set(adv.through).size >= 3}
          saveLabel="Start this round"
          pending={pending}
          onCancel={() => setBuilder(null)}
          onSave={(plan, note) =>
            run(async () => {
              await customRound(code, slug, plan, note);
              setBuilder(null);
            })
          }
        />
      )}

      {builder === "rearrange" && (
        <PairBuilder
          players={unstarted.flatMap((m) => [m.side_a, m.side_b]).filter((x): x is string => !!x).map((id) => ({ id, name: name(id) }))}
          initial={[...unstarted].sort((a, b) => Number(!!a.side_b) - Number(!!b.side_b)).map((m) => ({ a: m.side_a!, b: m.side_b }))}
          allowRobin={false}
          saveLabel="Save new pairings"
          pending={pending}
          onCancel={() => setBuilder(null)}
          onSave={(plan, note) =>
            run(async () => {
              if (plan.mode === "pairs") await rearrangeRound(code, slug, plan.pairs, note);
              setBuilder(null);
            })
          }
        />
      )}

      {!champion && !roundDone && !builder && top !== "final3" && unstarted.length >= 2 && (
        <button onClick={() => setBuilder("rearrange")} className="text-sm text-mute underline-offset-4 hover:text-ink hover:underline">
          Rearrange the {unstarted.length} matches not started yet
        </button>
      )}

      {tie && (
        <div className="rounded-xl border-2 border-accent p-4">
          <p className="font-medium">Tied at the top: {tie.map((t) => t.name).join(", ")}</p>
          <p className="mt-1 text-sm text-mute">Same points and same score difference. Settle it with one decider match.</p>
          {tie.length >= 2 && (
            <button onClick={() =>
                run(async () => {
                  await addDecider(code, slug, tie[0].id, tie[1].id);
                  setTie(null);
                })
              } className="btn mt-3" disabled={pending}>
              Add decider: {tie[0].name} vs {tie[1].name}
            </button>
          )}
        </div>
      )}

      {waiting.length >= 2 && (
        <div className="rounded-xl border border-dashed border-accent/60 p-4 text-sm">
          <p>
            <b className="font-medium">{waiting.length} players are waiting</b> because their opponents didn&apos;t show.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => run(() => rePairAbsent(code, slug))} className="btn py-2" disabled={pending}>
              Pair them with each other
            </button>
            <button onClick={() => run(async () => { for (const m of waiting) await walkover(code, slug, m.id); })} className="btn-quiet" disabled={pending}>
              Give them all walkovers
            </button>
          </div>
        </div>
      )}

      <div className="sticky top-14 z-20 -mx-4 space-y-2 border-b hair bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {(
            [
              ["todo", "To play", current.filter((m) => m.side_b && (m.status === "scheduled" || m.status === "live")).length],
              ["live", "On now", current.filter((m) => m.status === "live").length],
              ["done", "Results", doneCount],
              ["all", "Everything", active.filter((m) => m.side_b).length],
            ] as [Filter, string, number][]
          ).map(([k, label, n]) => (
            <button key={k} onClick={() => setFilter(k)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${filter === k ? "border-ink bg-ink text-paper" : "hair text-mute"}`}>
              {label} <span className="num text-xs opacity-60">{n}</span>
            </button>
          ))}
        </div>
        <label className="relative block">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player" className="field rounded-full py-1.5 pl-8 text-sm" />
        </label>
      </div>

      <ul className="divide-y divide-rule/10 border-b hair">
        {shown.map((m) => (
          <li key={m.id}>
            <button onClick={() => setOpen(open === m.id ? null : m.id)} className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 py-3 text-left">
              <span className="num text-xs text-mute">
                {m.grp ? `${m.grp}·` : "#"}
                {m.no}
              </span>
              <span className="min-w-0">
                {[m.side_a, m.side_b].map((s) => (
                  <span key={s ?? "bye"} className={`block truncate ${m.status === "done" ? (m.winner === s ? "font-semibold" : "text-mute") : ""}`}>
                    {s ? name(s) : <span className="label">bye</span>}
                    {m.absent && ((m.absent === "a" && s === m.side_a) || (m.absent === "b" && s === m.side_b) || m.absent === "both") && <span className="ml-2 text-xs text-accent">no-show</span>}
                  </span>
                ))}
              </span>
              <span className="text-right text-xs">
                {m.status === "live" ? (
                  <span className="font-mono uppercase tracking-label text-accent">
                    Live{m.court ? ` · ${unit[0]}${m.court}` : ""}
                  </span>
                ) : m.status === "done" ? (
                  <span className="num text-mute">{m.score ?? "✓"}</span>
                ) : (
                  <span className="text-mute">Tap</span>
                )}
              </span>
            </button>
            {open === m.id && m.side_b && (
              <Editor
                key={m.id + m.status}
                m={m}
                name={name}
                unit={unit}
                courts={courts}
                busy={busyCourts}
                hint={scoreHint}
                pending={pending}
                onResult={(side, score) =>
                  run(async () => {
                    await setResult(code, slug, m.id, side, score);
                    setOpen(null);
                  })
                }
                onLive={(court) => run(() => setLive(code, slug, m.id, court))}
                onAbsent={(who) => run(() => setAbsent(code, slug, m.id, who))}
                onWalkover={() =>
                  run(async () => {
                    await walkover(code, slug, m.id);
                    setOpen(null);
                  })
                }
              />
            )}
          </li>
        ))}
        {!shown.length && <li className="py-10 text-center text-sm text-mute">{filter === "todo" ? "Nothing left to play in this round." : "Nothing here."}</li>}
      </ul>
    </div>
  );
}

function Editor({
  m,
  name,
  unit,
  courts,
  busy,
  hint,
  pending,
  onResult,
  onLive,
  onAbsent,
  onWalkover,
}: {
  m: MatchRow;
  name: (id: string | null) => string;
  unit: string;
  courts: number;
  busy: Set<number | null>;
  hint: string;
  pending: boolean;
  onResult: (side: "a" | "b", score: string) => void;
  onLive: (court: number | null) => void;
  onAbsent: (who: "a" | "b" | "both" | null) => void;
  onWalkover: () => void;
}) {
  const [side, setSide] = useState<"a" | "b" | null>(m.winner ? (m.winner === m.side_a ? "a" : "b") : null);
  const [score, setScore] = useState(m.score && m.score !== "W/O" ? m.score : "");
  const done = m.status === "done";

  return (
    <div className="mb-3 space-y-4 rounded-xl bg-sheet p-4">
      <div>
        <p className="label mb-2">Who won?</p>
        <div className="grid grid-cols-2 gap-2">
          {(["a", "b"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition ${side === s ? "border-ink bg-ink text-paper" : "hair bg-paper"}`}
            >
              {name(s === "a" ? m.side_a : m.side_b)}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="label">Score (optional)</span>
        <input value={score} onChange={(e) => setScore(e.target.value)} placeholder={hint} className="field mt-1.5 bg-paper" inputMode="text" />
      </label>
      <button disabled={!side || pending} onClick={() => side && onResult(side, score)} className="btn w-full">
        {pending ? "Saving…" : done ? "Save correction" : "Save result"}
      </button>

      {!done && (
        <div className="space-y-3 border-t hair pt-4">
          <div>
            <p className="label mb-2">{m.status === "live" ? `Playing on ${unit.toLowerCase()} ${m.court ?? ""}` : `Call to a ${unit.toLowerCase()}`}</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: courts }, (_, i) => i + 1).map((c) => (
                <button
                  key={c}
                  disabled={pending || (busy.has(c) && m.court !== c)}
                  onClick={() => onLive(c)}
                  className={`num size-9 rounded-full border text-sm disabled:opacity-30 ${m.court === c && m.status === "live" ? "border-accent bg-accent text-on-accent" : "hair bg-paper"}`}
                >
                  {c}
                </button>
              ))}
              {m.status === "live" && (
                <button onClick={() => onLive(null)} className="btn-quiet py-1.5 text-xs" disabled={pending}>
                  Not started
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="label mb-2 flex items-center gap-1.5">
              <UserX size={12} /> Didn&apos;t show up
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["a", name(m.side_a)],
                  ["b", name(m.side_b)],
                  ["both", "Both"],
                ] as const
              ).map(([who, label]) => (
                <button
                  key={who}
                  onClick={() => onAbsent(m.absent === who ? null : who)}
                  disabled={pending}
                  className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs ${m.absent === who ? "border-accent bg-accent/10 text-accent" : "hair bg-paper"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {m.absent && (
              <button onClick={onWalkover} disabled={pending} className="btn mt-3 w-full">
                {m.absent === "both" ? "Neither goes through" : `Walkover to ${name(m.absent === "a" ? m.side_b : m.side_a)}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
