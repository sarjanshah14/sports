"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { SPORTS, sportBySlug } from "@/lib/sports";

export type Row = {
  id: string;
  name: string;
  phone: string;
  room: string;
  size: string;
  roles: string;
  entries: { sport: string; withdrawn: boolean }[];
};

type Sort = "name" | "room" | "recent";

export function PeopleTable({ code, rows, initialSport = "" }: { code: string; rows: Row[]; initialSport?: string }) {
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<string>(initialSport);
  const [withdrawn, setWithdrawn] = useState(false);
  const [sort, setSort] = useState<Sort>("name");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) for (const e of r.entries) if (!e.withdrawn) c[e.sport] = (c[e.sport] ?? 0) + 1;
    return c;
  }, [rows]);
  const withdrawnCount = rows.filter((r) => r.entries.some((e) => e.withdrawn)).length;

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (s && !(r.name.toLowerCase().includes(s) || r.room.includes(s) || r.phone.includes(s))) return false;
      if (sport && !r.entries.some((e) => e.sport === sport && e.withdrawn === withdrawn)) return false;
      if (!sport && withdrawn && !r.entries.some((e) => e.withdrawn)) return false;
      return true;
    });
    if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "room") out.sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }));
    return out; // "recent" keeps server order (newest first)
  }, [rows, q, sport, withdrawn, sort]);

  const chip = (on: boolean) => `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-ink bg-ink text-paper" : "hair text-mute hover:text-ink"}`;

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 space-y-3 border-b hair bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, room or phone" className="field rounded-full py-2 pl-9" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className="field w-auto rounded-full py-2 pr-8">
            <option value="name">A–Z</option>
            <option value="room">Room</option>
            <option value="recent">Newest</option>
          </select>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <button onClick={() => setSport("")} className={chip(!sport)}>
            Everyone <span className="num text-xs opacity-60">{rows.length}</span>
          </button>
          {SPORTS.map((s) => (
            <button key={s.slug} onClick={() => setSport(sport === s.slug ? "" : s.slug)} className={chip(sport === s.slug)}>
              {s.name} <span className="num text-xs opacity-60">{counts[s.slug] ?? 0}</span>
            </button>
          ))}
          {withdrawnCount > 0 && (
            <button onClick={() => setWithdrawn(!withdrawn)} className={`${chip(withdrawn)} ${withdrawn ? "" : "border-dashed"}`}>
              Withdrawn <span className="num text-xs opacity-60">{withdrawnCount}</span>
            </button>
          )}
        </div>
      </div>

      <p className="label py-3">{shown.length} shown</p>

      {/* Phones: one card per person */}
      <ul className="divide-y divide-rule/10 border-y hair md:hidden">
        {shown.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/e/${code}/people/${r.id}`} className="flex items-center gap-3 py-3 active:bg-sheet">
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="num shrink-0 text-xs text-mute">Rm {r.room || "—"}</span>
                </p>
                <Entries entries={r.entries} />
              </div>
              <ChevronRight size={16} className="shrink-0 text-mute" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: a proper table */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-y-2 border-ink text-left">
            {["Name", "Room", "Phone", "Sports", "Role", "Size"].map((h) => (
              <th key={h} className="label py-2.5 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/10">
          {shown.map((r) => (
            <tr key={r.id} className="group cursor-pointer hover:bg-sheet">
              <td className="py-2.5 pr-4 font-medium">
                <Link href={`/admin/e/${code}/people/${r.id}`} className="underline-offset-4 group-hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="num py-2.5 pr-4">{r.room}</td>
              <td className="num py-2.5 pr-4 text-mute">{r.phone}</td>
              <td className="py-2.5 pr-4">
                <Entries entries={r.entries} />
              </td>
              <td className="py-2.5 pr-4 text-mute">{r.roles}</td>
              <td className="num py-2.5 pr-4">{r.size}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!shown.length && <p className="py-16 text-center text-mute">Nobody matches.</p>}
    </div>
  );
}

function Entries({ entries }: { entries: Row["entries"] }) {
  return (
    <span className="mt-1 flex flex-wrap gap-1 md:mt-0">
      {entries.map((e) => (
        <span
          key={e.sport}
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${e.withdrawn ? "border border-dashed border-accent/60 text-mute line-through" : "bg-ink/[0.07] text-ink"}`}
        >
          {sportBySlug(e.sport)?.name ?? e.sport}
        </span>
      ))}
    </span>
  );
}
