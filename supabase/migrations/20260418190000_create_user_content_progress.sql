create extension if not exists pgcrypto;

create table if not exists public.user_content_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  is_saved boolean not null default false,
  progress_status text not null default 'not_started',
  note_text text null,
  saved_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  last_viewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_content_progress_status_check
    check (progress_status in ('not_started', 'in_progress', 'completed')),
  constraint user_content_progress_unique unique (user_id, content_item_id)
);

create index if not exists idx_user_content_progress_user
  on public.user_content_progress (user_id);

create index if not exists idx_user_content_progress_user_saved
  on public.user_content_progress (user_id, is_saved);

create index if not exists idx_user_content_progress_user_status
  on public.user_content_progress (user_id, progress_status);

create index if not exists idx_user_content_progress_user_viewed
  on public.user_content_progress (user_id, last_viewed_at desc);

create or replace function public.set_user_content_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_content_progress_updated_at
  on public.user_content_progress;

create trigger trg_user_content_progress_updated_at
before update on public.user_content_progress
for each row
execute function public.set_user_content_progress_updated_at();
