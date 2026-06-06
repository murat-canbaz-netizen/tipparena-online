create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  code text primary key,
  school text not null,
  class_name text not null,
  student_count integer not null check (student_count between 3 and 35),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  nickname text not null,
  avatar text not null default 'panda',
  created_at timestamptz not null default now(),
  unique (room_code, nickname)
);

create table if not exists public.picks (
  room_code text not null references public.rooms(code) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  match_id text not null,
  home_score integer not null check (home_score between 0 and 20),
  away_score integer not null check (away_score between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (player_id, match_id)
);

create index if not exists players_room_code_idx on public.players(room_code);
create index if not exists picks_room_code_idx on public.picks(room_code);
