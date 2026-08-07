-- Apply this migration in the Supabase SQL editor after enabling Supabase Auth.
-- Every public table below uses RLS and verifies ownership through its board.

create extension if not exists pgcrypto;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  emoji text not null default '✦',
  labels jsonb not null default '[]',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  color text not null default '#94a3b8',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 250),
  description text not null default '',
  priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  labels text[] not null default '{}',
  due_date date,
  completed boolean not null default false,
  position integer not null default 0 check (position >= 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep the conflict-resolution timestamp current without trusting the browser clock.
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger boards_updated_at before update on public.boards for each row execute function public.set_updated_at();
create trigger columns_updated_at before update on public.columns for each row execute function public.set_updated_at();
create trigger cards_updated_at before update on public.cards for each row execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

create policy "board owner access" on public.boards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "column owner access" on public.columns for all to authenticated
  using (exists (select 1 from public.boards where boards.id = columns.board_id and boards.user_id = (select auth.uid())))
  with check (exists (select 1 from public.boards where boards.id = columns.board_id and boards.user_id = (select auth.uid())));

create policy "card owner access" on public.cards for all to authenticated
  using (exists (select 1 from public.columns join public.boards on boards.id = columns.board_id where columns.id = cards.column_id and boards.user_id = (select auth.uid())))
  with check (exists (select 1 from public.columns join public.boards on boards.id = columns.board_id where columns.id = cards.column_id and boards.user_id = (select auth.uid())));

create index cards_column_position_idx on public.cards(column_id, position);
create index columns_board_position_idx on public.columns(board_id, position);
