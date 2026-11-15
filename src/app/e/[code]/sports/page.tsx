import { SportsIndex } from "@/components/sections";
import { publicEvent } from "@/lib/public-data";

export default async function SportsPage({ params }: { params: { code: string } }) {
  const pe = (await publicEvent(params.code))!;
  return (
    <section className="pb-12 pt-8 md:pt-14">
      <p className="label">{pe.ev.name}</p>
      <h1 className="mb-6 mt-2 font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Seven sports</h1>
      <SportsIndex code={pe.ev.code} sports={pe.sports} />
    </section>
  );
}
