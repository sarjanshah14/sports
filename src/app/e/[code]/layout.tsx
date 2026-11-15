import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav, DesktopNav, ThemeToggle } from "@/components/client";
import { AutoRefresh } from "@/components/public";
import { publicEvent } from "@/lib/public-data";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const pe = await publicEvent(params.code);
  return { title: pe ? `${pe.ev.name} — fixtures & results` : "Event not found" };
}

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: { code: string } }) {
  const pe = await publicEvent(params.code);
  if (!pe) notFound();
  const { ev } = pe;
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <AutoRefresh />
      <header className="sticky top-0 z-30 border-b hair bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href={`/e/${ev.code}`} className="min-w-0 truncate font-display text-xl font-black uppercase leading-none tracking-tight">
            {ev.name}
          </Link>
          <DesktopNav code={ev.code} />
          <div className="flex shrink-0 items-center gap-3">
            <span className="label hidden md:inline">#{ev.code}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 md:px-8">{children}</main>
      <footer className="mx-auto hidden max-w-6xl justify-between border-t hair px-8 py-6 md:flex">
        <p className="label">Run by the hostel sports committee · every draw is recorded</p>
        <Link href={`/e/${ev.code}/log`} className="label hover:text-ink">
          Full change log →
        </Link>
      </footer>
      <BottomNav code={ev.code} />
    </div>
  );
}
