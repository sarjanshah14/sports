"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Moon, Search, Sun, Trophy, CalendarDays } from "lucide-react";

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

export function CodeEntry() {
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
      <p className="mt-4 text-sm text-mute">{busy ? "Opening…" : "\u00a0"}</p>
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
