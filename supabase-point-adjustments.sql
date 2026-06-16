create table if not exists public.point_adjustments (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  points integer not null check (points between -50 and 50),
  reason text not null check (char_length(trim(reason)) between 1 and 160),
  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists point_adjustments_room_code_idx
  on public.point_adjustments(room_code);

create index if not exists point_adjustments_player_id_idx
  on public.point_adjustments(player_id);

create index if not exists point_adjustments_room_player_idx
  on public.point_adjustments(room_code, player_id);
