import Link from "next/link";
import { fmtDay, timeIST } from "@/components/sections";
import { publicEvent } from "@/lib/public-data";
import { SPORTS, sportBySlug } from "@/lib/sports";

export default async function LogPage({ params, searchParams }: { params: { code: string }; searchParams: { sport?: string } }) {
  const pe = (await publicEvent(params.code))!;
  const only = searchParams.sport && sportBySlug(searchParams.sport) ? searchParams.sport : null;
  const items = pe.raw.changes.filter((c) => !only || c.sport === only);
  const byDay = new Map<string, typeof items>();
  for (const c of items) {
    const d = fmtDay(new Date(Date.parse(c.created_at) + 5.5 * 3600e3).toISOString(), { weekday: "long", day: "numeric", month: "long" });
    byDay.set(d, [...(byDay.get(d) ?? []), c]);
  }
  const chip = (on: boolean) => `shrink-0 rounded-full border px-3 py-1.5 text-sm ${on ? "border-ink bg-ink text-paper" : "hair text-mute hover:text-ink"}`;
  return (
    <section className="mx-auto max-w-2xl pb-12 pt-8 md:pt-14">
      <h1 className="font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Change log</h1>
      <p className="mt-3 text-mute">Every result, correction, draw and committee decision, as it happened. Nothing is removed from here.</p>
      <div className="no-scrollbar -mx-4 mt-6 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Link href={`/e/${pe.ev.code}/log`} className={chip(!only)}>
          Everything
        </Link>
        {SPORTS.map((s) => (
          <Link key={s.slug} href={`/e/${pe.ev.code}/log?sport=${s.slug}`} className={chip(only === s.slug)}>
            {s.name}
          </Link>
        ))}
      </div>
      {[...byDay].map(([day, list]) => (
        <div key={day} className="mt-8">
          <p className="label border-b-2 border-ink pb-2">{day}</p>
          <ul className="divide-y divide-rule/10">
            {list.map((c) => (
              <li key={c.id} className="grid grid-cols-[48px_1fr] gap-3 py-2.5 text-sm">
                <span className="num text-xs text-mute">{timeIST(c.created_at)}</span>
                <span>
                  {!only && <span className="label mr-2">{sportBySlug(c.sport)?.name}</span>}
                  {c.summary}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!items.length && <p className="mt-10 text-mute">Nothing yet.</p>}
    </section>
  );
}
