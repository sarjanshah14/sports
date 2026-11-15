import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav, DesktopNav, ThemeToggle } from "@/components/client";
import { EVENT } from "@/lib/mock-event";

export default function EventLayout({ children, params }: { children: React.ReactNode; params: { code: string } }) {
  if (params.code !== EVENT.code) notFound();
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b hair bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href={`/e/${EVENT.code}`} className="flex items-baseline gap-2">
            <span className="font-display text-xl font-black uppercase leading-none tracking-tight">{EVENT.name}</span>
            <span className="num text-xs text-accent">’{EVENT.edition.slice(2)}</span>
          </Link>
          <DesktopNav code={EVENT.code} />
          <div className="flex items-center gap-3">
            <span className="label hidden md:inline">#{EVENT.code}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 md:px-8">{children}</main>
      <footer className="mx-auto hidden max-w-6xl border-t hair px-8 py-6 md:block">
        <p className="label">Run by the hostel sports committee · every draw is recorded</p>
      </footer>
      <BottomNav code={EVENT.code} />
    </div>
  );
}
