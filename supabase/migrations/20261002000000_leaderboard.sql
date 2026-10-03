-- Endless (endless) leaderboard. Players are Supabase anonymous users (the game signs one in on first use, so a
-- later Apple / Google sign-in can link to the same account). Only the `leaderboard` Edge Function touches these
-- tables, with the service role: RLS is on with no policies, so the public API keys can't read or write them.

create table public.players (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 2 and 20),
  created_at timestamptz not null default now()
);

create table public.endless_runs (
  id           bigint generated always as identity primary key,
  player_id    uuid not null references public.players (id) on delete cascade,
  waves        int  not null check (waves >= 0),
  kills        int  not null check (kills >= 0),
  score        int  not null check (score >= 0),
  seed         bigint,
  duration_sec int,
  version      text,
  created_at   timestamptz not null default now()
);
create index endless_runs_player_idx on public.endless_runs (player_id, created_at desc);
create index endless_runs_score_idx  on public.endless_runs (score desc, waves desc);

alter table public.players      enable row level security;
alter table public.endless_runs enable row level security;

-- Each player's best run (by score, then waves).
create or replace function public.endless_best()
returns table (player_id uuid, name text, waves int, kills int, score int, created_at timestamptz)
language sql stable set search_path = public as $$
  select distinct on (r.player_id) r.player_id, p.name, r.waves, r.kills, r.score, r.created_at
  from endless_runs r join players p on p.id = r.player_id
  order by r.player_id, r.score desc, r.waves desc, r.created_at
$$;

-- The top n best runs, ranked.
create or replace function public.endless_top(n int default 50)
returns table (rank bigint, player_id uuid, name text, waves int, kills int, score int, created_at timestamptz)
language sql stable set search_path = public as $$
  select rank() over (order by b.score desc, b.waves desc), b.player_id, b.name, b.waves, b.kills, b.score, b.created_at
  from endless_best() b
  order by 1, b.created_at
  limit n
$$;

-- One player's rank and best run, and how many players there are.
create or replace function public.endless_rank(pid uuid)
returns table (rank bigint, total bigint, waves int, kills int, score int)
language sql stable set search_path = public as $$
  with b as (select * from endless_best()), me as (select * from b where b.player_id = pid)
  select (select count(*) from b where b.score > me.score or (b.score = me.score and b.waves > me.waves)) + 1,
         (select count(*) from b), me.waves, me.kills, me.score
  from me
$$;

revoke execute on function public.endless_best(), public.endless_top(int), public.endless_rank(uuid) from public, anon, authenticated;
grant  execute on function public.endless_best(), public.endless_top(int), public.endless_rank(uuid) to service_role;
