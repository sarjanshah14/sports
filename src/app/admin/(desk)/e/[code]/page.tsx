import Link from "next/link";
import { db, eventByCode, must } from "@/lib/db";
import { SPORTS } from "@/lib/sports";

export default async function Overview({ params }: { params: { code: string } }) {
  const ev = (await eventByCode(params.code))!;
  const entries = must(await db().from("entries").select("sport, withdrawn_at, participants!inner(event_id)").eq("participants.event_id", ev.id)) as unknown as {
    sport: string;
    withdrawn_at: string | null;
  }[];
  const { count: people } = await db().from("participants").select("id", { count: "exact", head: true }).eq("event_id", ev.id);
  const active = (slug: string) => entries.filter((e) => e.sport === slug && !e.withdrawn_at).length;
  const out = (slug: string) => entries.filter((e) => e.sport === slug && e.withdrawn_at).length;

  if (!people)
    return (
      <div className="mt-10 rounded-xl border-2 border-dashed border-rule/25 p-8">
        <p className="font-display text-3xl font-extrabold uppercase">Start with the master sheet</p>
        <p className="mt-2 text-mute">Upload the Google Form responses and everyone lands here, sorted by sport.</p>
        <Link href={`/admin/e/${ev.code}/import`} className="btn mt-5">
          Import participants
        </Link>
      </div>
    );

  return (
    <div className="mt-8">
      <p className="flex items-baseline gap-3">
        <span className="num text-6xl font-medium">{people}</span>
        <span className="text-mute">people signed up</span>
      </p>
      <ul className="mt-8 grid grid-cols-2 border-l border-t hair md:grid-cols-4">
        {SPORTS.map((s) => (
          <li key={s.slug} className="border-b border-r hair">
            <Link href={`/admin/e/${ev.code}/people?sport=${s.slug}`} className="block p-4 hover:bg-sheet">
              <p className="label">{s.name}</p>
              <p className="num mt-2 text-4xl font-medium">{active(s.slug)}</p>
              <p className="mt-1 text-xs text-mute">
                {s.kind === "doubles" ? `${Math.floor(active(s.slug) / 2)} pairs${active(s.slug) % 2 ? " + 1 spare" : ""}` : s.kind === "team" ? "for the auction" : "entries"}
                {out(s.slug) > 0 && <span className="text-accent"> · {out(s.slug)} withdrawn</span>}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-mute">Draws, fixtures and the public page for this code come in the next phases.</p>
    </div>
  );
}
