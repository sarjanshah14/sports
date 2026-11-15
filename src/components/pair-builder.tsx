"use client";

import { useState } from "react";
import { Shuffle, X } from "lucide-react";
import type { Pair } from "@/lib/draw";

type P = { id: string; name: string };
export type Plan = { mode: "pairs"; pairs: Pair[] } | { mode: "robin"; ids: string[] };

/**
 * Build a round by hand. Tap a player, then tap their opponent; or give them a bye.
 * Or switch to a round robin among whoever is left (top 5, top 3…).
 */
export function PairBuilder({
  players,
  bringBack = [],
  allowRobin,
  initial = [],
  saveLabel,
  pending,
  onSave,
  onCancel,
}: {
  players: P[];
  bringBack?: P[];
  allowRobin: boolean;
  initial?: Pair[];
  saveLabel: string;
  pending: boolean;
  onSave: (plan: Plan, note: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"pairs" | "robin">("pairs");
  const [pool, setPool] = useState<P[]>(players);
  const [pairs, setPairs] = useState<Pair[]>(initial);
  const [picked, setPicked] = useState<string | null>(null);
  const [robin, setRobin] = useState<Set<string>>(new Set(players.map((p) => p.id)));
  const [note, setNote] = useState("");
  const name = (id: string | null) => [...pool, ...bringBack].find((p) => p.id === id)?.name ?? "?";

  const placed = new Set(pairs.flatMap((p) => (p.b ? [p.a, p.b] : [p.a])));
  const left = pool.filter((p) => !placed.has(p.id));
  const byes = pairs.filter((p) => !p.b).length;
  const returnable = bringBack.filter((b) => !pool.some((p) => p.id === b.id));

  const tap = (id: string) => {
    if (!picked) return setPicked(id);
    if (picked === id) return setPicked(null);
    setPairs([...pairs, { a: picked, b: id }]);
    setPicked(null);
  };
  const fillRandom = () => {
    const rest = left.map((p) => p.id).sort(() => Math.random() - 0.5);
    const add: Pair[] = [];
    for (let i = 0; i + 1 < rest.length; i += 2) add.push({ a: rest[i], b: rest[i + 1] });
    if (rest.length % 2) add.push({ a: rest[rest.length - 1], b: null });
    setPairs([...pairs, ...add]);
    setPicked(null);
  };
  const ready = mode === "pairs" ? left.length === 0 && pairs.length > 0 : robin.size >= 3;
  const robinMatches = (robin.size * (robin.size - 1)) / 2;

  return (
    <div className="space-y-4 rounded-xl border-2 border-ink p-4">
      {allowRobin && (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-sheet p-1 text-sm">
          {(
            [
              ["pairs", "Knockout pairs"],
              ["robin", "Round robin"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-full py-1.5 ${mode === k ? "bg-ink text-paper" : "text-mute"}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {mode === "pairs" ? (
        <>
          <p className="text-sm">
            <span className="num">{pairs.length - byes}</span> matches · <span className="num">{byes}</span> {byes === 1 ? "bye" : "byes"} ·{" "}
            <span className={left.length ? "text-accent" : "text-mute"}>{left.length} to place</span>
          </p>

          {left.length > 0 && (
            <div>
              <p className="label mb-2">{picked ? `Now tap ${name(picked)}'s opponent` : "Tap a player"}</p>
              <div className="flex flex-wrap gap-1.5">
                {left.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => tap(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${picked === p.id ? "border-accent bg-accent text-on-accent" : "hair bg-sheet"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {picked && (
                  <button
                    onClick={() => {
                      setPairs([...pairs, { a: picked, b: null }]);
                      setPicked(null);
                    }}
                    className="btn-quiet"
                  >
                    Give {name(picked)} a bye
                  </button>
                )}
                <button onClick={fillRandom} className="btn-quiet">
                  <Shuffle size={14} /> Pair the rest at random
                </button>
              </div>
            </div>
          )}

          {pairs.length > 0 && (
            <ol className="divide-y divide-rule/10 border-y hair text-sm">
              {pairs.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate">
                    {name(p.a)} {p.b ? <span className="text-mute">vs</span> : null} {p.b ? name(p.b) : <span className="label text-accent">bye</span>}
                  </span>
                  <button aria-label="Undo this pair" onClick={() => setPairs(pairs.filter((_, j) => j !== i))} className="text-mute hover:text-accent">
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div>
          <p className="mb-2 text-sm">
            Everyone ticked plays everyone: <span className="num">{robin.size}</span> players, <span className="num">{robinMatches}</span> matches. Most wins takes it.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pool.map((p) => {
              const on = robin.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    const n = new Set(robin);
                    if (on) n.delete(p.id);
                    else n.add(p.id);
                    setRobin(n);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-ink bg-ink text-paper" : "hair text-mute line-through"}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {returnable.length > 0 && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-mute">Bring back someone who lost</span>
          <select
            value=""
            onChange={(e) => {
              const p = returnable.find((x) => x.id === e.target.value);
              if (!p) return;
              setPool([...pool, p]);
              setRobin(new Set([...robin, p.id]));
            }}
            className="field w-auto py-1.5 pr-8"
          >
            <option value="">Choose…</option>
            {returnable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="label">Reason (shown in the public log)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. running late, top 5 play each other" className="field mt-1.5" />
      </label>
      <div className="flex gap-2">
        <button
          disabled={!ready || !note.trim() || pending}
          onClick={() => onSave(mode === "pairs" ? { mode, pairs } : { mode, ids: [...robin] }, note)}
          className="btn flex-1"
        >
          {pending ? "Saving…" : saveLabel}
        </button>
        <button onClick={onCancel} className="btn-quiet">
          Cancel
        </button>
      </div>
    </div>
  );
}
