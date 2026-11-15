"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Search, Sun, Trophy, CalendarDays } from "lucide-react";
import type { Match } from "@/lib/mock-event";
import { MatchRow } from "./match";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to daylight" : "Switch to floodlights"}
      className="grid size-9 place-items-center rounded-full border hair text-ink/80 transition hover:text-ink"
    >
      {mounted ? dark ? <Sun size={16} /> : <Moon size={16} /> : <span className="size-4" />}
    </button>
  );
}

export function BottomNav({ code }: { code: string }) {
  const path = usePathname();
  const tabs = [
    { href: `/e/${code}`, label: "Today", icon: CalendarDays },
    { href: `/e/${code}/sports`, label: "Sports", icon: Trophy },
    { href: `/e/${code}/find`, label: "Find me", icon: Search },
  ];
  const active = (href: string) => (href === `/e/${code}` ? path === href : path.startsWith(href) || (href.endsWith("/sports") && /\/e\/\d+\/(?!find)[a-z-]+$/.test(path)));
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t hair bg-paper/90 backdrop-blur md:hidden">
      <div className="grid grid-cols-3">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active(href) ? "text-ink" : "text-mute"}`}>
            {active(href) && <span className="absolute inset-x-8 top-0 h-0.5 bg-accent" />}
            <Icon size={19} strokeWidth={active(href) ? 2.4 : 1.8} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DesktopNav({ code }: { code: string }) {
  const path = usePathname();
  const links = [
    { href: `/e/${code}`, label: "Today" },
    { href: `/e/${code}/sports`, label: "Sports" },
    { href: `/e/${code}/find`, label: "Find me" },
  ];
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const on = l.href === `/e/${code}` ? path === l.href : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CodeEntry({ hint }: { hint: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (code.length === 6) {
      setBusy(true);
      router.push(`/e/${code}`);
    }
  }, [code, router]);
  return (
    <div>
      <label className="relative block cursor-text" onClick={() => ref.current?.focus()}>
        <span className="sr-only">Six-digit event code</span>
        <input
          ref={ref}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="peer absolute inset-0 opacity-0"
          disabled={busy}
        />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => {
            const caret = i === code.length;
            return (
              <div
                key={i}
                className={`num grid aspect-[3/4] place-items-center rounded-md border text-3xl font-medium transition sm:text-4xl ${
                  code[i] ? "border-ink bg-sheet" : caret ? "border-accent peer-focus:border-accent" : "hair bg-sheet/50"
                }`}
              >
                {code[i] ?? (caret ? <span className="live-dot h-7 w-px bg-accent" /> : "")}
              </div>
            );
          })}
        </div>
      </label>
      <p className="mt-4 text-sm text-mute">
        {busy ? "Opening…" : <>Prototype code: <button className="num text-ink underline decoration-accent underline-offset-4" onClick={() => setCode(hint)}>{hint}</button></>}
      </p>
    </div>
  );
}

type Filter = "all" | "live" | "done" | "upcoming";

export function FixtureList({ matches, unit }: { matches: Match[]; unit: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const counts = useMemo(
    () => ({
      all: matches.length,
      live: matches.filter((m) => m.status === "live").length,
      done: matches.filter((m) => m.status === "done").length,
      upcoming: matches.filter((m) => m.status === "next" || m.status === "scheduled").length,
    }),
    [matches],
  );
  const shown = matches.filter((m) => {
    if (filter === "live" && m.status !== "live") return false;
    if (filter === "done" && m.status !== "done") return false;
    if (filter === "upcoming" && !(m.status === "next" || m.status === "scheduled")) return false;
    const s = q.trim().toLowerCase();
    return !s || m.a.toLowerCase().includes(s) || (m.b ?? "").toLowerCase().includes(s);
  });
  const tabs: [Filter, string][] = [["all", "All"], ["live", "Live"], ["done", "Results"], ["upcoming", "Upcoming"]];

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 border-b hair bg-paper/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:static md:mx-0 md:border-none md:bg-transparent md:px-0 md:backdrop-blur-0">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {tabs.map(([k, label]) =>
            counts[k] ? (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${filter === k ? "border-ink bg-ink text-paper" : "hair text-mute hover:text-ink"}`}
              >
                {k === "live" && <span className="live-dot size-1.5 rounded-full bg-accent" />}
                {label}
                <span className="num text-xs opacity-60">{counts[k]}</span>
              </button>
            ) : null,
          )}
        </div>
        <label className="relative sm:w-56">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name"
            className="w-full rounded-full border hair bg-sheet py-1.5 pl-9 pr-3 text-sm placeholder:text-mute focus:border-ink focus:outline-none"
          />
        </label>
      </div>
      <div className="divide-y divide-rule/10 border-b hair md:mt-4 md:border-t">
        {shown.map((m) => (
          <MatchRow key={m.id} m={m} unit={unit} />
        ))}
        {!shown.length && <p className="py-12 text-center text-sm text-mute">No matches match that.</p>}
      </div>
    </div>
  );
}

export type FindEntry = { name: string; room: string; sports: { slug: string; name: string; match?: Match; unit: string }[] };

export function FindMe({ people, code }: { people: FindEntry[]; code: string }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const hits = s.length < 2 ? [] : people.filter((p) => p.name.toLowerCase().includes(s) || p.room === s).slice(0, 12);
  return (
    <div>
      <label className="relative block">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Your name or room number"
          className="w-full rounded-xl border hair bg-sheet py-4 pl-12 pr-4 text-lg placeholder:text-mute focus:border-ink focus:outline-none"
        />
      </label>
      {s.length < 2 && <p className="mt-4 text-sm text-mute">Every match you are in, across all seven sports. Try “Shah” or “418”.</p>}
      {s.length >= 2 && !hits.length && <p className="mt-6 text-sm text-mute">Nobody by that name. Ask the committee if you signed up but are missing.</p>}
      <ul className="mt-6 space-y-4">
        {hits.map((p) => (
          <li key={p.name} className="rounded-xl border hair bg-sheet">
            <div className="flex items-baseline justify-between px-4 pt-4">
              <p className="font-display text-2xl font-extrabold uppercase leading-none">{p.name}</p>
              <p className="label">Room {p.room}</p>
            </div>
            <div className="mt-3 divide-y divide-rule/10 border-t hair">
              {p.sports.map((sp) => (
                <Link key={sp.slug} href={`/e/${code}/${sp.slug}`} className="block px-4 py-3 transition hover:bg-paper/60">
                  <p className="label">{sp.name}</p>
                  {sp.match ? (
                    <MatchRow m={sp.match} unit={sp.unit} compact highlight={p.name} />
                  ) : (
                    <p className="mt-1 text-sm text-mute">Waiting on teams from the auction.</p>
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

export function EventTabs({ code }: { code: string }) {
  const path = usePathname();
  const tabs = [
    { href: `/admin/e/${code}`, label: "Overview" },
    { href: `/admin/e/${code}/people`, label: "Participants" },
    { href: `/admin/e/${code}/sports`, label: "Sports" },
    { href: `/admin/e/${code}/import`, label: "Import" },
  ];
  return (
    <nav className="no-scrollbar -mx-4 mt-5 flex gap-6 overflow-x-auto border-b hair px-4 md:mx-0 md:px-0">
      {tabs.map((t) => {
        const on = t.href === `/admin/e/${code}` ? path === t.href : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`shrink-0 border-b-2 pb-2.5 font-display text-lg font-bold uppercase ${on ? "border-accent text-ink" : "border-transparent text-mute hover:text-ink"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
