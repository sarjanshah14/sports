import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PublicEvent } from "@/lib/public-data";
import { SPORTS } from "@/lib/sports";

export const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso.slice(0, 10) + "T12:00:00+05:30").toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
export const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

export function SportsIndex({ code, sports, dense }: { code: string; sports: PublicEvent["sports"]; dense?: boolean }) {
  return (
    <ol className="border-t-2 border-ink">
      {sports.map(({ sport: s, entries, champion, current, live }, i) => (
        <li key={s.slug} className="border-b hair">
          <Link href={`/e/${code}/${s.slug}`} className="group grid grid-cols-[28px_1fr_auto] items-center gap-x-3 py-3.5">
            <span className="num self-start pt-1 text-xs text-mute">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className={`flex items-center gap-2 font-display font-extrabold uppercase leading-none ${dense ? "text-2xl" : "text-[28px] md:text-3xl"}`}>
                {s.name}
                {live > 0 && <span className="live-dot size-2 rounded-full bg-accent" />}
              </span>
              <span className="mt-1.5 block truncate text-[13px] text-mute">
                {champion ? (
                  <>
                    Won by <span className="text-ink">{champion}</span>
                  </>
                ) : (
                  <>
                    {fmtDay(s.date, { day: "numeric", month: "short" })}
                    {s.endDate && `–${fmtDay(s.endDate, { day: "numeric" })}`} · {entries} entered
                  </>
                )}
              </span>
            </span>
            <span className="flex items-center gap-2 text-right font-mono text-[11px] uppercase tracking-label text-mute">
              {champion ? "Done" : current ? (
                <span className={live ? "text-accent" : ""}>
                  {current.label} · {current.done}/{current.total}
                </span>
              ) : (
                "Draw soon"
              )}
              <ArrowUpRight size={16} className="text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** One column per day of the event, listing that day's sports. Hidden when the event has no dates. */
export function DayStrip({ code, start, end }: { code: string; start: string | null; end: string | null }) {
  if (!start || !end) return null;
  const n = Math.min(14, Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1);
  if (n < 1) return null;
  const today = todayIST();
  const days = Array.from({ length: n }, (_, i) => {
    const iso = new Date(Date.parse(start + "T12:00:00Z") + i * 864e5).toISOString().slice(0, 10);
    const md = iso.slice(5);
    return { iso, sports: SPORTS.filter((s) => s.date.slice(5) === md || s.endDate?.slice(5) === md) };
  });
  return (
    <div className={`no-scrollbar -mx-4 flex gap-px overflow-x-auto px-4 md:mx-0 md:grid md:px-0`} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {days.map(({ iso, sports }) => {
        const on = iso === today;
        return (
          <div key={iso} className={`min-w-[112px] shrink-0 border-t-2 pb-1 pt-2.5 md:min-w-0 ${on ? "border-accent" : "border-rule/15"} ${iso < today ? "opacity-50" : ""}`}>
            <div className="flex items-baseline gap-2">
              <span className={`num text-2xl font-medium ${on ? "text-accent" : ""}`}>{fmtDay(iso, { day: "2-digit" })}</span>
              <span className="label">{on ? "Today" : fmtDay(iso, { weekday: "short" })}</span>
            </div>
            <div className="mt-1.5 flex flex-col gap-0.5">
              {sports.map((s) => (
                <Link key={s.slug} href={`/e/${code}/${s.slug}`} className="truncate text-[13px] text-ink/80 hover:text-ink">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SectionHead({ title, meta }: { title: string; meta?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-end justify-between gap-4">
      <h2 className="font-display text-[26px] font-extrabold uppercase leading-none md:text-3xl">{title}</h2>
      {meta && <span className="label pb-0.5">{meta}</span>}
    </div>
  );
}

export const timeIST = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
