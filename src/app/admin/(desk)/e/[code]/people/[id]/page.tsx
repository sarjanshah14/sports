import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DeleteParticipant, ParticipantForm, type EditablePerson } from "@/components/admin-forms";
import { db, eventByCode, type ParticipantRow } from "@/lib/db";

export default async function EditPerson({ params }: { params: { code: string; id: string } }) {
  const ev = (await eventByCode(params.code))!;
  let person: EditablePerson = { id: null, name: "", phone: "", room: "", cricket_role: "", volleyball_role: "", tshirt_size: "", tshirt_name: "", tshirt_number: "", photo_url: "", entries: {} };
  let submitted: string | null = null;

  if (params.id !== "new") {
    const { data } = await db().from("participants").select("*, entries(sport, withdrawn_at)").eq("id", params.id).eq("event_id", ev.id).maybeSingle();
    if (!data) notFound();
    const p = data as ParticipantRow;
    submitted = p.submitted_at;
    person = {
      id: p.id,
      name: p.name,
      phone: p.phone ?? "",
      room: p.room ?? "",
      cricket_role: p.cricket_role ?? "",
      volleyball_role: p.volleyball_role ?? "",
      tshirt_size: p.tshirt_size ?? "",
      tshirt_name: p.tshirt_name ?? "",
      tshirt_number: p.tshirt_number ?? "",
      photo_url: p.photo_url ?? "",
      entries: Object.fromEntries(p.entries.map((e) => [e.sport, e.withdrawn_at ? "withdrawn" : "in"])),
    };
  }

  return (
    <div className="mt-6 max-w-2xl">
      <Link href={`/admin/e/${ev.code}/people`} className="label inline-flex items-center gap-1.5 hover:text-ink">
        <ArrowLeft size={13} /> Participants
      </Link>
      <h1 className="mb-1 mt-3 font-display text-5xl font-black uppercase leading-[0.9]">{person.id ? person.name : "Add person"}</h1>
      <p className="mb-8 text-sm text-mute">{submitted ? `Form submitted ${submitted}` : person.id ? "Added by the committee" : "For late sign-ups or anyone missing from the sheet."}</p>
      <ParticipantForm code={ev.code} person={person} />
      {person.id && (
        <div className="mt-10 border-t hair pt-6">
          <DeleteParticipant code={ev.code} id={person.id} name={person.name} />
        </div>
      )}
    </div>
  );
}
