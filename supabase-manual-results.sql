create table if not exists public.manual_results (
  match_id text primary key,
  home_score integer not null check (home_score between 0 and 20),
  away_score integer not null check (away_score between 0 and 20),
  status text not null check (status in ('open', 'live', 'finished')),
  minute integer check (minute between 0 and 150),
  updated_at timestamptz not null default now()
);
