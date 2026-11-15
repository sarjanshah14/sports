import { SportsIndex } from "@/components/sections";
import { EVENT } from "@/lib/mock-event";

export default function SportsPage() {
  return (
    <section className="pb-12 pt-8 md:pt-14">
      <p className="label">22–28 December</p>
      <h1 className="mb-6 mt-2 font-display text-6xl font-black uppercase leading-[0.85] md:text-8xl">Seven sports</h1>
      <SportsIndex code={EVENT.code} />
    </section>
  );
}
