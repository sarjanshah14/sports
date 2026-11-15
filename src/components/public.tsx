"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { PublicMatch } from "@/lib/public-data";
import { MatchRow } from "./match";

/** Re-fetches the page quietly every `seconds` while the tab is visible. The server serves it from cache. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);
  return null;
}

type Round = { key: string; stage: string; label: string; matches: PublicMatch[] };
type Filter = "all" | "live" | "done" | "upcoming";

/** Round tabs, opening on the round being played. Inside: filters and a name search. */
export function RoundView({ rounds, current, unit }: { rounds: Round[]; current: string; unit: string }) {
  const [key, setKey] = useState(current);
  const [view, setView] = useState<"list" | "bracket">("list");
  const ko = rounds.filter((r) => r.stage === "knockout");
  const round = rounds.find((r) => r.key === key) ?? rounds[0];

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b hair">
        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {rounds.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setKey(r.key);
                setView("list");
              }}
              className={`shrink-0 border-b-2 pb-2.5 font-display text-lg font-bold uppercase transition ${view === "list" && r.key === round.key ? "border-accent text-ink" : "border-transparent text-mute hover:text-ink"}`}
            >
              {r.label}
              {r.matches.some((m) => m.status === "live") && <span className="live-dot ml-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" />}
            </button>
          ))}
        </div>
        {ko.length >= 2 && (
          <button
            onClick={() => setView(view === "bracket" ? "list" : "bracket")}
            className={`mb-2 hidden shrink-0 rounded-full border px-3 py-1 text-sm md:block ${view === "bracket" ? "border-ink bg-ink text-paper" : "hair text-mute"}`}
          >
            Bracket
          </button>
        )}
      </div>
      {view === "bracket" ? <Bracket rounds={ko} /> : <Fixtures key={round.key} matches={round.matches} unit={unit} />}
    </div>
  );
}

function Fixtures({ matches, unit }: { matches: PublicMatch[]; unit: string }) {
  const counts = useMemo(
    () => ({
      all: matches.length,
      live: matches.filter((m) => m.status === "live").length,
      done: matches.filter((m) => m.status === "done").length,
      upcoming: matches.filter((m) => m.status === "scheduled").length,
    }),
    [matches],
  );
  // Open on what matters now: live if anything is on, else what's still to come, else results.
  const [filter, setFilter] = useState<Filter>(counts.live ? "live" : counts.upcoming ? "upcoming" : "all");
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const shown = matches
    .filter((m) => (filter === "live" ? m.status === "live" : filter === "done" ? m.status === "done" : filter === "upcoming" ? m.status === "scheduled" : true))
    .filter((m) => !s || m.a.toLowerCase().includes(s) || (m.b ?? "").toLowerCase().includes(s));
  const tabs: [Filter, string][] = [
    ["live", "Live"],
    ["upcoming", "Upcoming"],
    ["done", "Results"],
    ["all", "All"],
  ];
  const groups = [...new Set(shown.map((m) => m.grp ?? ""))];

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 border-b hair bg-paper/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:static md:mx-0 md:border-none md:bg-transparent md:px-0 md:backdrop-blur-0">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {tabs.map(([k, label]) =>
            counts[k] || k === "all" ? (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${filter === k ? "border-ink bg-ink text-paper" : "hair text-mute hover:text-ink"}`}
              >
                {k === "live" && <span className="live-dot size-1.5 rounded-full bg-accent" />}
                {label}
                <span className="num text-xs">{counts[k]}</span>
              </button>
            ) : null,
          )}
        </div>
        <label className="relative sm:w-56">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a name" className="field rounded-full py-1.5 pl-9 text-sm" />
        </label>
      </div>
      {groups.map((g) => (
        <div key={g}>
          {g && <p className="label pt-4">Group {g}</p>}
          <div className="divide-y divide-rule/10 border-b hair md:mt-2 md:border-t">
            {shown
              .filter((m) => (m.grp ?? "") === g)
              .map((m) => (
                <MatchRow key={m.id} m={m} unit={unit} />
              ))}
          </div>
        </div>
      ))}
      {!shown.length && <p className="py-12 text-center text-sm text-mute">Nothing here yet.</p>}
    </div>
  );
}

/** Knockout rounds side by side. Wide screens only; phones use the round tabs. */
function Bracket({ rounds }: { rounds: Round[] }) {
  return (
    <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-4">
      {rounds.map((r) => (
        <div key={r.key} className="flex w-56 shrink-0 flex-col">
          <p className="label mb-2">{r.label}</p>
          <div className="flex flex-1 flex-col justify-around gap-2">
            {r.matches.map((m) => (
              <div key={m.id} className={`rounded-lg border px-3 py-2 text-sm ${m.status === "live" ? "border-accent" : "hair"} bg-sheet`}>
                {[
                  [m.a, "a"],
                  [m.b, "b"],
                ].map(([n, side]) => (
                  <p key={side} className={`flex justify-between gap-2 truncate ${m.status === "done" ? (m.winner === side ? "font-semibold" : "text-mute") : ""}`}>
                    <span className="truncate">{n ?? <span className="label">bye</span>}</span>
                    {m.sets && <span className="num shrink-0 text-xs">{side === "a" ? m.sets.a : m.sets.b}</span>}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type Found = { name: string; sports: { slug: string; sport: string; side: string | null; match: PublicMatch | null }[] };

export function FindMe({ people, code, units }: { people: Found[]; code: string; units: Record<string, string> }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const hits = s.length < 2 ? [] : people.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 10);
  return (
    <div>
      <label className="relative block">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type your name"
          className="w-full rounded-xl border hair bg-sheet py-4 pl-12 pr-4 text-lg placeholder:text-mute focus:border-ink focus:outline-none"
        />
      </label>
      {s.length < 2 && <p className="mt-4 text-sm text-mute">Your next match, or your last result, in every sport you entered.</p>}
      {s.length >= 2 && !hits.length && <p className="mt-6 text-sm text-mute">Nobody by that name. If you signed up and aren&apos;t here, tell the committee.</p>}
      <ul className="mt-6 space-y-4">
        {hits.map((p) => (
          <li key={p.name} className="rounded-xl border hair bg-sheet">
            <p className="px-4 pt-4 font-display text-2xl font-extrabold uppercase leading-none">{p.name}</p>
            <div className="mt-3 divide-y divide-rule/10 border-t hair">
              {p.sports.map((sp) => (
                <Link key={sp.slug} href={`/e/${code}/${sp.slug}`} className="block px-4 py-3 transition hover:bg-paper/60">
                  <p className="label flex justify-between">
                    <span>{sp.sport}</span>
                    {sp.match && <span>{sp.match.status === "done" ? "Last result" : sp.match.status === "live" ? "On now" : "Next up"}</span>}
                  </p>
                  {sp.match ? (
                    <MatchRow m={sp.match} unit={units[sp.slug]} compact me={sp.side} />
                  ) : (
                    <p className="mt-1 text-sm text-mute">{sp.side ? `Playing as ${sp.side}. Draw not out yet.` : "Draw not out yet."}</p>
                  )}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn">
      Print / Save as PDF
    </button>
  );
}

/** Shares the page link; WhatsApp shows the results card as the preview. Falls back to copying. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const [msg, setMsg] = useState("");
  return (
    <button
      onClick={async () => {
        const url = new URL(path, window.location.origin).toString();
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            setMsg("Link copied");
          }
        } catch {
          /* closed the share sheet */
        }
      }}
      className="btn-quiet"
    >
      {msg || "Share"}
    </button>
  );
}
