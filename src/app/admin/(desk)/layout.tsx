import Link from "next/link";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/client";
import { logout } from "../actions";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Committee desk" };

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  requireAdmin();
  const pw = process.env.ADMIN_PASSWORD ?? "";
  // Warn until the password is long and not just letters + a year.
  const weak = pw.length < 12 || !/\d/.test(pw) || /^[a-z]+\d{0,4}$/i.test(pw);
  const connected = !!(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) && !!(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b hair bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-black uppercase leading-none">The desk</span>
            <span className="label text-accent">Committee</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button aria-label="Log out" className="grid size-9 place-items-center rounded-full border hair text-ink/80 hover:text-ink">
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>
      {weak && (
        <div className="border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-sm md:px-8">
          The committee password is easy to guess. Before the event, set a longer one (12+ characters, with a number) in Vercel → Settings → Environment Variables → ADMIN_PASSWORD, then redeploy.
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        {connected ? (
          children
        ) : (
          <div className="mt-16 max-w-lg rounded-xl border-2 border-dashed border-accent/50 p-6">
            <p className="label text-accent">Database not connected</p>
            <p className="mt-2">Add the Supabase integration in Vercel (Storage → Supabase), then run <code className="num">supabase/schema.sql</code> in its SQL editor.</p>
          </div>
        )}
      </main>
    </div>
  );
}
