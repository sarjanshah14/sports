import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only: the secret key bypasses RLS. Never import this from a "use client" file.
let client: SupabaseClient | undefined;

export function db() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not connected: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return (client ??= createClient(url, key, {
    auth: { persistSession: false },
    // Next 14 caches server fetch() by default; database reads must always be fresh.
    // (Public pages cache on purpose via unstable_cache in public-data.ts, cleared on every change.)
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  }));
}

export type EventRow = { id: string; code: string; name: string; starts_on: string | null; ends_on: string | null; created_at: string };

export type ParticipantRow = {
  id: string;
  event_id: string;
  name: string;
  phone: string | null;
  room: string | null;
  cricket_role: string | null;
  volleyball_role: string | null;
  tshirt_size: string | null;
  tshirt_name: string | null;
  tshirt_number: string | null;
  photo_url: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  entries: { sport: string; withdrawn_at: string | null }[];
};

export async function eventByCode(code: string) {
  const { data } = await db().from("events").select("*").eq("code", code).maybeSingle();
  return data as EventRow | null;
}

/** Unwraps a Supabase result or throws its error message. */
export function must<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}
