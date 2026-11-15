"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Search, Shuffle, X } from "lucide-react";
import { deleteTeam, drawPairs, drawRoundOne, saveSettings, saveTeam } from "@/app/admin/sport-actions";
import { groupConfigs, METHODS, plan, recommend, swissDefaults, type Method, type Options } from "@/lib/draw";

export const fmtMins = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);

/* ---------- format picker ---------- */

export function FormatPicker({ code, slug, n, unit, initial, saved, locked }: { code: string; slug: string; n: number; unit: string; initial: { method: Method; options: Options }; saved: boolean; locked: boolean }) {
  const [method, setMethod] = useState<Method>(initial.method);
  const [o, setO] = useState<Options>(initial.options);
  const [msg, setMsg] = useState(saved ? "" : "Not saved yet");
  const [pending, start] = useTransition();
  const plans = useMemo(() => {
    const order = METHODS.map((m) => m.id);
    return plan(n, o).sort((a, b) => order.indexOf(a.method) - order.indexOf(b.method));
  }, [n, o]);
  const best = plans.length ? recommend(plans) : null;
  const configs = useMemo(() => groupConfigs(n), [n]);
  const sw = o.swiss ?? swissDefaults(n);
  const set = (patch: Partial<Options>) => {
    setO({ ...o, ...patch });
    setMsg("Changed, not saved");
  };

  if (n < 2) return <p className="text-sm text-mute">The comparison appears once there are at least two {unit === "Turf" || unit === "Court" ? "sides" : "players"}.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-mute">{unit}s</span>
          <input type="number" min={1} max={50} value={o.courts} onChange={(e) => set({ courts: Number(e.target.value) })} className="field num w-16 py-1.5 text-center" />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-mute">Minutes a match</span>
          <input type="number" min={5} max={240} step={5} value={o.slot} onChange={(e) => set({ slot: Number(e.target.value) })} className="field num w-20 py-1.5 text-center" />
        </label>
      </div>

      <div className="grid gap-2">
        {plans.map((p) => {
          const m = METHODS.find((x) => x.id === p.method)!;
          const on = method === p.method;
          return (
            <div key={p.method} className={`rounded-xl border transition ${on ? "border-ink bg-sheet" : "hair"}`}>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  setMethod(p.method);
                  setMsg("Changed, not saved");
                }}
                className="grid w-full grid-cols-[20px_1fr] items-start gap-3 p-4 text-left disabled:cursor-not-allowed"
              >
                <span className={`mt-1 grid size-4 place-items-center rounded-full border ${on ? "border-ink bg-ink text-paper" : "border-rule/30"}`}>{on && <Check size={10} strokeWidth={3} />}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl font-bold uppercase leading-none">{m.name}</span>
                    {best === p.method && <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-on-accent">Suggested</span>}
                  </span>
                  {on ? (
                    <>
                      <span className="mt-1 block text-sm text-mute">{p.note}</span>
                      <span className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <Stat k="Byes" v={p.byes} warn={p.byes > 4} />
                        <Stat k="Matches" v={p.matches} />
                        <Stat k="Time" v={`≈${fmtMins(p.minutes)}`} />
                      </span>
                    </>
                  ) : (
                    <span className="num mt-1.5 block text-xs text-mute">
                      <span className={p.byes > 4 ? "text-accent" : ""}>{p.byes} byes</span> · {p.matches} matches · ≈{fmtMins(p.minutes)}
                    </span>
                  )}
                </span>
              </button>
              {on && (
                <div className="space-y-4 border-t hair px-4 pb-4 pt-3 sm:pl-12">
                  <p className="text-sm">{m.how}</p>
                  {(p.method === "rolling" || p.method === "standard" || p.method === "lucky_loser") && (
                    <p className="num text-xs text-mute">{p.fields.join(" → ")} → winner</p>
                  )}
                  {p.method === "rolling" && (
                    <Choice
                      label="When 3 are left"
                      value={o.finalThree ?? "round_robin"}
                      onChange={(v) => set({ finalThree: v as Options["finalThree"] })}
                      options={[
                        ["round_robin", "All three play each other"],
                        ["bye_to_final", "Draw one straight into the final"],
                      ]}
                    />
                  )}
                  {p.method === "groups" && configs.length > 1 && (
                    <Choice
                      label="Groups"
                      value={`${o.groups?.groups ?? configs[0].groups}:${o.groups?.perGroup ?? configs[0].perGroup}`}
                      onChange={(v) => {
                        const [groups, perGroup] = v.split(":").map(Number);
                        set({ groups: { groups, perGroup } });
                      }}
                      options={configs.map((c) => [
                        `${c.groups}:${c.perGroup}`,
                        `${c.groups} groups of ${Math.min(...c.sizes)}${Math.max(...c.sizes) !== Math.min(...c.sizes) ? `–${Math.max(...c.sizes)}` : ""}, top ${c.perGroup} → last ${c.knockout} (${c.matches} matches)`,
                      ])}
                    />
                  )}
                  {p.method === "swiss" && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <span className="text-mute">Rounds</span>
                        <input type="number" min={1} max={9} value={sw.rounds} onChange={(e) => set({ swiss: { ...sw, rounds: Number(e.target.value) } })} className="field num w-16 py-1.5 text-center" />
                      </label>
                      <Choice label="Then top" value={String(sw.cut)} onChange={(v) => set({ swiss: { ...sw, cut: Number(v) } })} options={[4, 8, 16, 32].filter((c) => c < n).map((c) => [String(c), `${c} play a knockout`])} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending || locked}
          onClick={() =>
            start(async () => {
              await saveSettings(code, slug, method, o);
              setMsg("Saved");
            })
          }
          className="btn"
        >
          {pending ? "Saving…" : "Save format"}
        </button>
        <span className={`text-sm ${msg === "Saved" ? "text-mute" : "text-accent"}`}>{locked ? "Locked: round 1 is drawn. Redo the draw to change format." : msg}</span>
      </div>
    </div>
  );
}

function Stat({ k, v, warn }: { k: string; v: string | number; warn?: boolean }) {
  return (
    <span>
      <span className="label block text-[10px]">{k}</span>
      <span className={`num whitespace-nowrap text-base ${warn ? "text-accent" : ""}`}>{v}</span>
    </span>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-mute">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field w-full min-w-0 max-w-full py-1.5 pr-8 sm:w-auto">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------- draw buttons ---------- */

export function DrawButton({ code, slug, kind, redo, label, disabled }: { code: string; slug: string; kind: "pairs" | "round"; redo: boolean; label: string; disabled?: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const go = () =>
    start(async () => {
      setErr("");
      try {
        await (kind === "pairs" ? drawPairs(code, slug, note) : drawRoundOne(code, slug, note));
        setOpen(false);
        setNote("");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Draw failed");
      }
    });

  if (disabled) return <p className="text-sm text-mute">{disabled}</p>;
  if (redo && !open)
    return (
      <button onClick={() => setOpen(true)} className="btn-quiet">
        <Shuffle size={14} /> Redo this draw
      </button>
    );
  return (
    <div className="space-y-3">
      {redo && (
        <label className="block max-w-md">
          <span className="label">Why redo? Shown publicly next to both draws</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 3 late entries added" className="field mt-1.5" autoFocus />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={go} disabled={pending || (redo && !note.trim())} className="btn">
          <Shuffle size={15} /> {pending ? "Drawing…" : label}
        </button>
        {redo && (
          <button onClick={() => setOpen(false)} className="btn-quiet">
            Cancel
          </button>
        )}
      </div>
      {err && <p className="text-sm text-accent">{err}</p>}
    </div>
  );
}

/* ---------- long lists, folded ---------- */

export function Folded({ title, count, children, open = false }: { title: string; count: number; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-xl border hair">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2 text-sm text-mute">
          <span className="num">{count}</span>
          <ChevronDown size={16} className="transition group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t hair px-4 py-3">{children}</div>
    </details>
  );
}

export function PairList({ rows }: { rows: { key: string; a: string; b: string | null; tag?: string }[] }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const shown = s ? rows.filter((r) => r.a.toLowerCase().includes(s) || (r.b ?? "").toLowerCase().includes(s)) : rows;
  return (
    <div>
      {rows.length > 12 && (
        <label className="relative mb-3 block">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a name" className="field rounded-full py-1.5 pl-8 text-sm" />
        </label>
      )}
      <ol className="divide-y divide-rule/10 text-sm">
        {shown.map((r) => (
          <li key={r.key} className="grid grid-cols-[36px_1fr] gap-2 py-2">
            <span className="num text-mute">{r.tag}</span>
            <span className="min-w-0">
              {r.a}
              {r.b ? <span className="text-mute"> vs </span> : null}
              {r.b ?? <span className="label ml-2 text-accent">bye</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- teams (from the paper auction sheets) ---------- */

type P = { id: string; name: string; role: string | null };
type T = { id: string; name: string; captain: string | null; members: string[] };

export function TeamsEditor({ code, slug, people, teams, locked }: { code: string; slug: string; people: P[]; teams: T[]; locked: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [newCaptain, setNewCaptain] = useState("");
  const byId = new Map(people.map((p) => [p.id, p]));
  const assigned = new Set(teams.flatMap((t) => t.members));
  const free = people.filter((p) => !assigned.has(p.id));
  const s = q.trim().toLowerCase();
  const shownFree = s ? free.filter((p) => p.name.toLowerCase().includes(s)) : free;

  const run = (f: () => Promise<unknown>) =>
    start(async () => {
      setErr("");
      try {
        await f();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  const put = (t: T, members: string[], captain = t.captain) => run(() => saveTeam(code, slug, { id: t.id, name: t.name, captain, members }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between text-sm">
          <span>
            {teams.length} {teams.length === 1 ? "team" : "teams"} · {people.length - free.length} of {people.length} placed
          </span>
          {free.length > 0 && <span className="text-accent">{free.length} still to place</span>}
        </div>
        <div className="mt-2 h-1 bg-rule/10">
          <div className="h-full bg-ink transition-all" style={{ width: `${people.length ? ((people.length - free.length) / people.length) * 100 : 0}%` }} />
        </div>
      </div>
      {err && <p className="text-sm text-accent">{err}</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        {teams.map((t) => (
          <Folded key={t.id} title={t.name} count={t.members.length}>
            <p className="label mb-2">Captain: {t.captain ? byId.get(t.captain)?.name ?? "—" : "not set"}</p>
            <ul className="space-y-1 text-sm">
              {t.members.map((m) => (
                <li key={m} className="flex items-center justify-between gap-2">
                  <span className={m === t.captain ? "font-semibold" : ""}>
                    {byId.get(m)?.name ?? "Withdrawn player"} <span className="text-xs text-mute">{byId.get(m)?.role}</span>
                  </span>
                  {!locked && (
                    <span className="flex gap-1">
                      {m !== t.captain && (
                        <button onClick={() => put(t, t.members, m)} className="text-xs text-mute hover:text-ink" disabled={pending}>
                          make captain
                        </button>
                      )}
                      <button aria-label="Remove from team" onClick={() => put(t, t.members.filter((x) => x !== m), m === t.captain ? null : t.captain)} className="text-mute hover:text-accent" disabled={pending}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!locked && (
              <button onClick={() => run(() => deleteTeam(code, slug, t.id))} className="mt-3 text-xs text-mute hover:text-accent" disabled={pending}>
                Delete team
              </button>
            )}
          </Folded>
        ))}
      </div>

      {!locked && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await saveTeam(code, slug, { id: null, name: newName, captain: newCaptain || null, members: newCaptain ? [newCaptain] : [] });
              setNewName("");
              setNewCaptain("");
            });
          }}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-rule/25 p-4"
        >
          <label className="min-w-40 flex-1">
            <span className="label">New team</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Team name" className="field mt-1.5" required />
          </label>
          <label className="min-w-40 flex-1">
            <span className="label">Captain</span>
            <select value={newCaptain} onChange={(e) => setNewCaptain(e.target.value)} className="field mt-1.5">
              <option value="">Pick later</option>
              {free.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={pending}>
            Add team
          </button>
        </form>
      )}

      {!locked && teams.length > 0 && free.length > 0 && (
        <section>
          <h3 className="label mb-2">Still to place, from the captains&apos; sheets</h3>
          <label className="relative mb-2 block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player" className="field rounded-full py-1.5 pl-8 text-sm" />
          </label>
          <ul className="max-h-[28rem] divide-y divide-rule/10 overflow-auto text-sm">
            {shownFree.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  {p.name} <span className="text-xs text-mute">{p.role}</span>
                </span>
                <select
                  value=""
                  disabled={pending}
                  onChange={(e) => {
                    const t = teams.find((x) => x.id === e.target.value);
                    if (t) put(t, [...t.members, p.id]);
                  }}
                  className="field w-36 shrink-0 py-1 text-sm"
                  aria-label={`Team for ${p.name}`}
                >
                  <option value="">Add to…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
