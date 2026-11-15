import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin-forms";
import { ThemeToggle } from "@/components/client";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Committee desk" };

export default function Login() {
  if (process.env.ADMIN_PASSWORD && isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <p className="label">Hostel Sports Committee</p>
        <h1 className="mb-8 mt-2 font-display text-6xl font-black uppercase leading-[0.85]">The desk</h1>
        {process.env.ADMIN_PASSWORD ? <LoginForm /> : <p className="text-accent">ADMIN_PASSWORD isn&apos;t set on the server yet.</p>}
        <p className="mt-10 text-sm text-mute">Only the committee has this password. Everyone else just needs the 6-digit event code.</p>
      </div>
    </div>
  );
}
