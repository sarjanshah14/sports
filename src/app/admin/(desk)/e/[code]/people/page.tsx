import Link from "next/link";
import { Plus } from "lucide-react";
import { PeopleTable, type Row } from "@/components/people-table";
import { db, eventByCode, must, type ParticipantRow } from "@/lib/db";

export default async function People({ params, searchParams }: { params: { code: string }; searchParams: { saved?: string; sport?: string } }) {
  const ev = (await eventByCode(params.code))!;
  const people = must(
    await db().from("participants").select("*, entries(sport, withdrawn_at)").eq("event_id", ev.id).order("created_at", { ascending: false }).order("name"),
  ) as ParticipantRow[];
  const rows: Row[] = people.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone ?? "",
    room: p.room ?? "",
    size: p.tshirt_size ?? "",
    roles: [p.cricket_role, p.volleyball_role].filter(Boolean).join(" · "),
    entries: p.entries.map((e) => ({ sport: e.sport, withdrawn: !!e.withdrawn_at })),
  }));
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-4">
        {searchParams.saved ? <p className="text-sm text-accent">Saved.</p> : <span />}
        <Link href={`/admin/e/${ev.code}/people/new`} className="btn">
          <Plus size={16} /> Add person
        </Link>
      </div>
      <PeopleTable key={searchParams.sport} code={ev.code} rows={rows} initialSport={searchParams.sport} />
    </div>
  );
}
