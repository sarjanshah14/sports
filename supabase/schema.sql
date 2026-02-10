-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tournaments Table
create table public.tournaments (
  id uuid not null default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  join_code text unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  config jsonb not null default '{}'::jsonb,
  constraint tournaments_pkey primary key (id)
);

-- Enable RLS for Tournaments
alter table public.tournaments enable row level security;

-- Policies for Tournaments
create policy "Public tournaments are viewable by everyone."
  on public.tournaments for select
  using (true);

create policy "Users can create their own tournaments."
  on public.tournaments for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own tournaments."
  on public.tournaments for update
  using (auth.uid() = created_by);

create policy "Users can delete their own tournaments."
  on public.tournaments for delete
  using (auth.uid() = created_by);

-- Participants Table
create table public.participants (
  id uuid not null default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint participants_pkey primary key (id)
);

-- Enable RLS for Participants
alter table public.participants enable row level security;

-- Policies for Participants
create policy "Participants are viewable by everyone."
  on public.participants for select
  using (true);

create policy "Tournament creators can manage participants."
  on public.participants for all
  using (auth.uid() in (
    select created_by from public.tournaments where id = participants.tournament_id
  ));

-- Matches Table
create table public.matches (
  id uuid not null default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null,
  match_number integer not null,
  participant_a_id uuid references public.participants(id),
  participant_b_id uuid references public.participants(id),
  winner_id uuid references public.participants(id),
  next_match_id uuid references public.matches(id),
  score_json jsonb,
  created_at timestamptz not null default now(),
  constraint matches_pkey primary key (id)
);

-- Enable RLS for Matches
alter table public.matches enable row level security;

-- Policies for Matches
create policy "Matches are viewable by everyone."
  on public.matches for select
  using (true);

create policy "Tournament creators can manage matches."
  on public.matches for all
  using (auth.uid() in (
    select created_by from public.tournaments where id = matches.tournament_id
  ));
