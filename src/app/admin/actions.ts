"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { eventTag } from "@/lib/public-data";
import { redirect } from "next/navigation";
import { checkPassword, clearSession, requireAdmin, setSession } from "@/lib/auth";
import { db, eventByCode, must } from "@/lib/db";
import { cleanName, cleanPhone, type Person } from "@/lib/import";
import { SPORTS } from "@/lib/sports";

export async function login(_: unknown, form: FormData) {
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "That's not the committee password." };
  setSession();
  redirect("/admin");
}

export async function logout() {
  clearSession();
  redirect("/admin/login");
}

export async function createEvent(_: unknown, form: FormData) {
  requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Give the event a name." };
  const row = { name, starts_on: form.get("starts_on") || null, ends_on: form.get("ends_on") || null };
  for (let tries = 0; tries < 5; tries++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error } = await db().from("events").insert({ ...row, code });
    if (!error) {
      revalidatePath("/admin");
      redirect(`/admin/e/${code}`);
    }
    if (error.code !== "23505") return { error: error.message }; // 23505 = code already taken, roll again
  }
  return { error: "Couldn't find a free code. Try again." };
}

async function eventOr404(code: string) {
  requireAdmin();
  const ev = await eventByCode(code);
  if (!ev) throw new Error("Event not found");
  return ev;
}

const SLUGS = new Set(SPORTS.map((s) => s.slug));

// PostgREST takes the column list from every key, so the sports array must not ride along.
function omitSports<T extends { sports?: unknown }>(p: T) {
  const row: Partial<T> = { ...p };
  delete row.sports;
  return row;
}

export async function importPeople(code: string, people: Person[]) {
  const ev = await eventOr404(code);
  const existing = must(await db().from("participants").select("phone, name").eq("event_id", ev.id)) as { phone: string | null; name: string }[];
  const phones = new Set(existing.map((p) => p.phone).filter(Boolean));
  const names = new Set(existing.map((p) => p.name.toLowerCase()));

  const fresh: Person[] = [];
  const already: string[] = [];
  for (const p of people) {
    const name = cleanName(p.name ?? "");
    const sports = (p.sports ?? []).filter((s) => SLUGS.has(s));
    if (!name || !sports.length) continue;
    const phone = cleanPhone(p.phone ?? "");
    if ((phone && phones.has(phone)) || (!phone && names.has(name.toLowerCase()))) {
      already.push(name);
      continue;
    }
    if (phone) phones.add(phone);
    // Arguments to a server action come from the browser: keep only known fields, as short strings.
    const str = (v: unknown) => String(v ?? "").trim().slice(0, 300);
    fresh.push({
      name,
      phone,
      sports,
      room: str(p.room),
      cricket_role: str(p.cricket_role),
      volleyball_role: str(p.volleyball_role),
      tshirt_size: str(p.tshirt_size).toUpperCase(),
      tshirt_name: str(p.tshirt_name),
      tshirt_number: str(p.tshirt_number),
      photo_url: str(p.photo_url),
      submitted_at: str(p.submitted_at),
    });
  }

  if (fresh.length) {
    const inserted = must(
      await db()
        .from("participants")
        .insert(fresh.map((p) => omitSports({ ...p, event_id: ev.id, phone: p.phone || null })))
        .select("id"),
    ) as { id: string }[];
    // Postgres returns inserted rows in insert order.
    const entries = inserted.flatMap((row, i) => fresh[i].sports.map((sport) => ({ participant_id: row.id, sport })));
    must(await db().from("entries").insert(entries));
  }
  revalidatePath(`/admin/e/${code}`, "layout");
  revalidateTag(eventTag(code));
  return { added: fresh.length, already };
}

const FIELDS = ["name", "phone", "room", "cricket_role", "volleyball_role", "tshirt_size", "tshirt_name", "tshirt_number", "photo_url"] as const;

export async function saveParticipant(code: string, id: string | null, _: unknown, form: FormData) {
  const ev = await eventOr404(code);
  const row: Record<string, string | null> = {};
  for (const f of FIELDS) row[f] = String(form.get(f) ?? "").trim() || null;
  row.name = cleanName(row.name ?? "");
  row.phone = row.phone ? cleanPhone(row.phone) : null;
  row.tshirt_size = row.tshirt_size?.toUpperCase() ?? null;
  if (!row.name) return { error: "Name is required." };

  const states = SPORTS.map((s) => ({ sport: s.slug, state: String(form.get(`sport:${s.slug}`) ?? "") }));
  if (!states.some((s) => s.state)) return { error: "Pick at least one sport, or delete this person instead." };

  let pid = id;
  if (pid) {
    const { error } = await db().from("participants").update({ ...row, updated_at: new Date().toISOString() }).eq("id", pid).eq("event_id", ev.id);
    if (error) return { error: error.code === "23505" ? "Someone else already has that phone number." : error.message };
  } else {
    const { data, error } = await db().from("participants").insert({ ...row, event_id: ev.id }).select("id").single();
    if (error) return { error: error.code === "23505" ? "Someone already has that phone number." : error.message };
    pid = data.id as string;
  }

  const current = must(await db().from("entries").select("sport, withdrawn_at").eq("participant_id", pid)) as { sport: string; withdrawn_at: string | null }[];
  const was = new Map(current.map((e) => [e.sport, e.withdrawn_at]));
  const now = new Date().toISOString();
  const keep = states.filter((s) => s.state);
  const drop = states.filter((s) => !s.state && was.has(s.sport)).map((s) => s.sport);
  if (drop.length) must(await db().from("entries").delete().eq("participant_id", pid).in("sport", drop));
  must(
    await db()
      .from("entries")
      .upsert(keep.map((s) => ({ participant_id: pid, sport: s.sport, withdrawn_at: s.state === "withdrawn" ? (was.get(s.sport) ?? now) : null }))),
  );

  revalidatePath(`/admin/e/${code}`, "layout");
  revalidateTag(eventTag(code));
  redirect(`/admin/e/${code}/people?saved=1`);
}

export async function deleteParticipant(code: string, id: string) {
  const ev = await eventOr404(code);
  must(await db().from("participants").delete().eq("id", id).eq("event_id", ev.id));
  revalidatePath(`/admin/e/${code}`, "layout");
  revalidateTag(eventTag(code));
  redirect(`/admin/e/${code}/people`);
}
