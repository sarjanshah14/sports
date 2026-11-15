import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SPORTS } from "@/lib/sports";
import { EVENT, sportSummary } from "@/lib/mock-event";

export const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso + "T12:00:00+05:30").toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const today = EVENT.now.slice(0, 10);

export function SportsIndex({ code, dense }: { code: string; dense?: boolean }) {
  return (
    <ol className="border-t-2 border-ink">
      {SPORTS.map((s, i) => {
        const sum = sportSummary(s);
        const status =
          sum.state === "live" ? (
            <span className="text-accent">
              {sum.done}/{sum.total} played
            </span>
          ) : sum.state === "teams" ? (
            "Teams pending"
          ) : (
            "Draw out"
          );
        return (
          <li key={s.slug} className="border-b hair">
            <Link href={`/e/${code}/${s.slug}`} className="group grid grid-cols-[28px_1fr_auto] items-center gap-x-3 py-3.5">
              <span className="num self-start pt-1 text-xs text-mute">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className={`flex items-center gap-2 font-display font-extrabold uppercase leading-none ${dense ? "text-2xl" : "text-[28px] md:text-3xl"}`}>
                  {s.name}
                  {sum.state === "live" && <span className="live-dot size-2 rounded-full bg-accent" />}
                </span>
                <span className="mt-1.5 block text-[13px] text-mute">
                  {fmtDay(s.date, { day: "numeric", month: "short" })}
                  {s.endDate && `–${fmtDay(s.endDate, { day: "numeric" })}`} · {sum.entries} {s.kind === "doubles" ? `players → ${sum.sides} pairs` : "entries"}
                </span>
              </span>
              <span className="flex items-center gap-2 text-right font-mono text-[11px] uppercase tracking-label text-mute">
                {status}
                <ArrowUpRight size={16} className="text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function DayStrip({ code }: { code: string }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.parse(EVENT.start + "T12:00:00+05:30") + i * 864e5).toISOString().slice(0, 10);
    return { iso: d, sports: SPORTS.filter((s) => s.date === d || s.endDate === d) };
  });
  return (
    <div className="no-scrollbar -mx-4 flex gap-px overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0">
      {days.map(({ iso, sports }) => {
        const on = iso === today;
        const past = iso < today;
        return (
          <div key={iso} className={`min-w-[112px] shrink-0 border-t-2 pb-1 pt-2.5 md:min-w-0 ${on ? "border-accent" : "border-rule/15"} ${past ? "opacity-50" : ""}`}>
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
