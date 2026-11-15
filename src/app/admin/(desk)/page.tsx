import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CreateEvent } from "@/components/admin-forms";
import { fmtDay } from "@/components/sections";
import { db, must } from "@/lib/db";

export default async function Events() {
  const events = must(await db().from("events").select("id, code, name, starts_on, ends_on, participants(count)").order("created_at", { ascending: false })) as unknown as {
    id: string;
    code: string;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    participants: { count: number }[];
  }[];
  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-8 md:pt-14">
        <h1 className="font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Events</h1>
        <CreateEvent />
      </section>
      {events.length ? (
        <ul className="border-t-2 border-ink">
          {events.map((e) => (
            <li key={e.id} className="border-b hair">
              <Link href={`/admin/e/${e.code}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4">
                <span>
                  <span className="block font-display text-3xl font-extrabold uppercase leading-none">{e.name}</span>
                  <span className="mt-1.5 block text-sm text-mute">
                    {e.starts_on ? fmtDay(e.starts_on, { day: "numeric", month: "short" }) : "No dates"}
                    {e.ends_on && ` – ${fmtDay(e.ends_on, { day: "numeric", month: "short", year: "numeric" })}`} · {e.participants[0]?.count ?? 0} participants
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="num rounded-md border hair px-2 py-1 text-sm tracking-[0.2em]">{e.code}</span>
                  <ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t-2 border-ink py-10 text-mute">No events yet. Create one to get its 6-digit code.</p>
      )}
    </>
  );
}
