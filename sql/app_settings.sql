-- App settings store for admin-managed platform configuration.
-- Scope is currently global; scope_id enables future role/user/tenant overrides.

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  scope_id uuid null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

-- Required for upsert on conflict (scope,scope_id,key), including NULL scope_id.
create unique index if not exists app_settings_scope_key_unique
on public.app_settings (scope, scope_id, key) nulls not distinct;

create index if not exists app_settings_key_idx
on public.app_settings (key);

create or replace function public.set_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_app_settings_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "Admins can read app_settings" on public.app_settings;
create policy "Admins can read app_settings"
on public.app_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admins can write app_settings" on public.app_settings;
create policy "Admins can write app_settings"
on public.app_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);
