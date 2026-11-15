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

-- Phase 3: format choice, sides (player / pair / team), recorded draws, matches.

create table public.sport_settings (
  event_id uuid not null references public.events on delete cascade,
  sport text not null,
  method text not null default 'rolling',
  options jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (event_id, sport)
);

-- One row per competitor: a player (singles), a pair (doubles) or a team.
create table public.sides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  sport text not null,
  name text not null,
  members uuid[] not null default '{}',
  captain uuid,
  created_at timestamptz not null default now()
);
create index sides_event_sport on public.sides (event_id, sport);

-- Every draw is kept, including ones that were redone (replaced_at + note say why).
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  sport text not null,
  kind text not null,          -- pairs | round
  round int,
  method text,
  seed text not null,
  input jsonb not null,        -- names in the public order the shuffle starts from
  output jsonb not null,
  replaced_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index draws_event_sport on public.draws (event_id, sport);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  sport text not null,
  draw_id uuid references public.draws on delete set null,
  stage text not null,         -- knockout | group | swiss
  round int not null,
  no int not null,
  grp text,
  side_a uuid references public.sides on delete cascade,
  side_b uuid references public.sides on delete cascade,
  winner uuid references public.sides on delete set null,
  score text,
  status text not null default 'scheduled', -- scheduled | bye | live | done
  created_at timestamptz not null default now()
);
create index matches_event_sport on public.matches (event_id, sport);

alter table public.sport_settings enable row level security;
alter table public.sides enable row level security;
alter table public.draws enable row level security;
alter table public.matches enable row level security;
