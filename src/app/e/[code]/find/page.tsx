import { FindMe } from "@/components/public";
import { findPeople, publicEvent } from "@/lib/public-data";
import { SPORTS } from "@/lib/sports";

export default async function FindPage({ params }: { params: { code: string } }) {
  const pe = (await publicEvent(params.code))!;
  // Names and matches only: no phone numbers or rooms are sent to the browser.
  return (
    <section className="mx-auto max-w-2xl pb-12 pt-8 md:pt-14">
      <h1 className="mb-6 font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Find me</h1>
      <FindMe people={findPeople(pe)} code={pe.ev.code} units={Object.fromEntries(SPORTS.map((s) => [s.slug, s.unit]))} />
    </section>
  );
}
