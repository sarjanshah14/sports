"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createEvent, deleteEvent, deleteParticipant, login, saveParticipant } from "@/app/admin/actions";
import { SPORTS } from "@/lib/sports";

function Submit({ children, pending: label }: { children: React.ReactNode; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn" disabled={pending}>
      {pending ? label : children}
    </button>
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="text-sm text-accent">{msg}</p> : null);

export function LoginForm() {
  const [state, action] = useFormState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Committee password</span>
        <input name="password" type="password" required autoFocus autoComplete="current-password" className="field mt-1.5" />
      </label>
      <Err msg={state?.error} />
      <Submit pending="Checking…">Open the desk</Submit>
    </form>
  );
}

export function CreateEvent() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createEvent, undefined);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn">
        <Plus size={16} /> New event
      </button>
    );
  return (
    <form action={action} className="space-y-4 rounded-xl border hair bg-sheet p-5">
      <label className="block">
        <span className="label">Event name</span>
        <input name="name" required autoFocus placeholder="Hostel Sports Week 2026" className="field mt-1.5 bg-paper" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Starts</span>
          <input name="starts_on" type="date" className="field mt-1.5 bg-paper" />
        </label>
        <label className="block">
          <span className="label">Ends</span>
          <input name="ends_on" type="date" className="field mt-1.5 bg-paper" />
        </label>
      </div>
      <Err msg={state?.error} />
      <div className="flex gap-2">
        <Submit pending="Creating…">Create and get code</Submit>
        <button type="button" onClick={() => setOpen(false)} className="btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}

export type EditablePerson = {
  id: string | null;
  name: string;
  phone: string;
  room: string;
  cricket_role: string;
  volleyball_role: string;
  tshirt_size: string;
  tshirt_name: string;
  tshirt_number: string;
  photo_url: string;
  entries: Record<string, "in" | "withdrawn">;
};

export function ParticipantForm({ code, person }: { code: string; person: EditablePerson }) {
  const [state, action] = useFormState(saveParticipant.bind(null, code, person.id), undefined);
  const [entries, setEntries] = useState(person.entries);
  const cycle = (slug: string) =>
    setEntries((e) => {
      const next = { ...e };
      // not entered → in → withdrawn (only if they were in before saving) → not entered
      if (!e[slug]) next[slug] = "in";
      else if (e[slug] === "in" && person.entries[slug]) next[slug] = "withdrawn";
      else delete next[slug];
      return next;
    });

  const input = (name: keyof EditablePerson, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} defaultValue={person[name] as string} className="field mt-1.5" {...props} />
    </label>
  );

  return (
    <form action={action} className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{input("name", "Name", { required: true, autoFocus: !person.id })}</div>
        {input("phone", "Phone", { inputMode: "tel" })}
        {input("room", "Room", { inputMode: "numeric" })}
      </section>

      <section>
        <h2 className="font-display text-2xl font-extrabold uppercase">Sports</h2>
        <p className="mt-1 text-sm text-mute">Tap to enter. Tap again to mark withdrawn: they stay on record but leave the draw.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SPORTS.map((s) => {
            const st = entries[s.slug];
            return (
              <button
                type="button"
                key={s.slug}
                onClick={() => cycle(s.slug)}
                aria-pressed={!!st}
                className={`rounded-lg border px-3 py-3 text-left transition ${
                  st === "in" ? "border-ink bg-ink text-paper" : st === "withdrawn" ? "border-dashed border-accent text-mute" : "hair text-ink hover:border-ink"
                }`}
              >
                <span className={`block font-display text-lg font-bold uppercase leading-none ${st === "withdrawn" ? "line-through" : ""}`}>{s.name}</span>
                <span className={`mt-1 block font-mono text-[10px] uppercase tracking-label ${st === "in" ? "text-paper/60" : st === "withdrawn" ? "text-accent" : "text-mute"}`}>
                  {st === "in" ? "Entered" : st === "withdrawn" ? "Withdrawn" : s.group}
                </span>
                {st && <input type="hidden" name={`sport:${s.slug}`} value={st} />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {entries.cricket && input("cricket_role", "Cricket role", { list: "cricket-roles" })}
        {entries.volleyball && input("volleyball_role", "Volleyball role", { list: "volley-roles" })}
        {input("tshirt_size", "T-shirt size", { list: "sizes" })}
        {input("tshirt_name", "T-shirt name")}
        {input("tshirt_number", "T-shirt number", { inputMode: "numeric" })}
        {input("photo_url", "Photo link", { type: "url" })}
        <datalist id="cricket-roles">{["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].map((r) => <option key={r} value={r} />)}</datalist>
        <datalist id="volley-roles">{["Setter", "Spiker", "Blocker", "Libero", "All-Rounder"].map((r) => <option key={r} value={r} />)}</datalist>
        <datalist id="sizes">{["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((r) => <option key={r} value={r} />)}</datalist>
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t hair bg-paper/95 px-4 py-4 backdrop-blur md:mx-0 md:px-0">
        <Submit pending="Saving…">{person.id ? "Save changes" : "Add participant"}</Submit>
        <Err msg={state?.error} />
      </div>
    </form>
  );
}

export function DeleteParticipant({ code, id, name }: { code: string; id: string; name: string }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  return sure ? (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      Delete {name} and all their entries? This can&apos;t be undone.
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await deleteParticipant(code, id);
        }}
        className="rounded-full bg-accent px-3 py-1.5 text-on-accent"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      <button onClick={() => setSure(false)} className="btn-quiet py-1.5">
        Keep
      </button>
    </span>
  ) : (
    <button onClick={() => setSure(true)} className="text-sm text-mute underline-offset-4 hover:text-accent hover:underline">
      Delete this person
    </button>
  );
}

export function DeleteEvent({ code, name }: { code: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-mute underline-offset-4 hover:text-accent hover:underline">
        Delete this event…
      </button>
    );
  return (
    <div className="max-w-md space-y-3 rounded-xl border-2 border-accent p-4">
      <p className="text-sm">
        This permanently deletes <b className="font-medium">{name}</b>: every participant, team, draw, result and the change log. The public link stops working. It can&apos;t be undone.
      </p>
      <label className="block">
        <span className="label">Type the code {code} to confirm</span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} inputMode="numeric" className="field num mt-1.5" autoFocus />
      </label>
      {err && <p className="text-sm text-accent">{err}</p>}
      <div className="flex gap-2">
        <button
          disabled={typed !== code || busy}
          onClick={async () => {
            setBusy(true);
            const r = await deleteEvent(code, typed);
            if (r?.error) {
              setErr(r.error);
              setBusy(false);
            }
          }}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete forever"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-quiet">
          Keep it
        </button>
      </div>
    </div>
  );
}
