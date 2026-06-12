create table if not exists public.leaderboard_snapshots (
  room_code text primary key
    references public.rooms(code)
    on delete cascade,
  result_fingerprint text not null default '',
  snapshot jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint leaderboard_snapshots_snapshot_is_array
    check (jsonb_typeof(snapshot) = 'array')
);

comment on table public.leaderboard_snapshots is
  'Speichert den letzten serverseitigen Ranglistenstand und die Bewegungen pro Klassenraum.';

comment on column public.leaderboard_snapshots.result_fingerprint is
  'Verhindert, dass derselbe Ergebnisstand bei normalen Reloads erneut verarbeitet wird.';

comment on column public.leaderboard_snapshots.snapshot is
  'JSON-Array mit playerId, rank, points, movement und Punktebeitraegen pro Spiel.';

alter table public.leaderboard_snapshots enable row level security;
