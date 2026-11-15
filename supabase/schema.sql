-- Hostel Sports Week: run once in the Supabase SQL editor.
-- Every read and write goes through the Next.js server with the secret key,
-- so RLS is on with no policies: the public anon key can read nothing (phone numbers stay private).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^\d{6}$'),
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  name text not null,
  phone text,
  room text,
  cricket_role text,
  volleyball_role text,
  tshirt_size text,
  tshirt_name text,
  tshirt_number text,
  photo_url text,
  submitted_at text, -- the Google Form timestamp, kept as written
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index participants_event on public.participants (event_id);
-- One person per phone number per event: re-imports skip people already in.
create unique index participants_event_phone on public.participants (event_id, phone) where phone is not null and phone <> '';

-- Which sports each person entered. Withdrawing keeps the row so the history stays visible.
create table public.entries (
  participant_id uuid not null references public.participants on delete cascade,
  sport text not null,
  withdrawn_at timestamptz,
  primary key (participant_id, sport)
);

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.entries enable row level security;
