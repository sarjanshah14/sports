import { CodeEntry, ThemeToggle } from "@/components/client";
import { SPORTS } from "@/lib/sports";

export default function Home() {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      {/* Poster: on phones a slim band, on desktop the whole left half */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-ink p-5 text-paper md:p-10">
        <div className="flex items-center justify-between">
          <span className="label text-paper/60">Hostel Sports Committee</span>
          <span className="md:hidden [&_button]:border-paper/20 [&_button]:text-paper">
            <ThemeToggle />
          </span>
        </div>
        <div className="mt-10 md:mt-0">
          <p className="num text-sm text-accent">Live fixtures · results · draws</p>
          <h1 className="mt-2 font-display text-[22vw] font-black uppercase leading-[0.8] md:text-[clamp(96px,11vw,176px)]">
            Sports
            <br />
            Week
          </h1>
        </div>
        <ul className="mt-8 hidden flex-wrap gap-x-4 gap-y-1 md:flex">
          {SPORTS.map((s, i) => (
            <li key={s.slug} className="font-display text-2xl font-bold uppercase text-paper/40">
              {s.name}
              {i < SPORTS.length - 1 && <span className="ml-4 text-accent">/</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col justify-between p-5 md:p-10">
        <div className="hidden justify-end md:flex">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm py-10">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none">Enter the code</h2>
          <p className="mb-6 mt-2 text-mute">Six digits, from the notice board or the WhatsApp group. No sign-up.</p>
          <CodeEntry />
        </div>
        <p className="label">Fixtures, results and every draw, in one place.</p>
      </section>
    </div>
  );
}
