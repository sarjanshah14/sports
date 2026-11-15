import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="label text-accent">404</p>
        <h1 className="mt-2 font-display text-6xl font-black uppercase leading-none">No such event</h1>
        <p className="mt-3 text-mute">Check the code on the notice board and try again.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
          Enter a code
        </Link>
      </div>
    </div>
  );
}
