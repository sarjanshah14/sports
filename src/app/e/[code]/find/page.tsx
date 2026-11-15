import { FindMe, type FindEntry } from "@/components/client";
import { PARTICIPANTS } from "@/lib/dummy";
import { EVENT, MATCHES } from "@/lib/mock-event";
import { sportBySlug } from "@/lib/sports";

export default function FindPage() {
  const short = (n: string) => `${n.split(" ")[0]} ${n.split(" ")[1]?.[0]}.`;
  // Only public fields leave the server: no phone numbers.
  const people: FindEntry[] = PARTICIPANTS.map((p) => ({
    name: p.name,
    room: p.room,
    sports: p.sports.map((slug) => {
      const s = sportBySlug(slug)!;
      const match = MATCHES.find((m) => m.sport === slug && (m.a === p.name || m.b === p.name || m.a.includes(short(p.name)) || m.b?.includes(short(p.name))));
      return { slug, name: s.name, unit: s.unit, match };
    }),
  }));
  return (
    <section className="mx-auto max-w-2xl pb-12 pt-8 md:pt-14">
      <h1 className="mb-6 font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Find me</h1>
      <FindMe people={people} code={EVENT.code} />
    </section>
  );
}
