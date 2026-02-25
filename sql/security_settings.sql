-- Security settings + login attempts storage
-- Run after sql/app_settings.sql

begin;

insert into public.app_settings (scope, scope_id, key, value)
select
  'global',
  null,
  'security',
  jsonb_build_object(
    'loginAttemptLimit', 5,
    'loginWindowMinutes', 15,
    'adminSessionTimeoutMinutes', 60,
    'maintenanceMode', false
  )
where not exists (
  select 1
  from public.app_settings
  where scope = 'global'
    and scope_id is null
    and key = 'security'
);

create table if not exists public.auth_login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address text null,
  user_agent text null,
  is_success boolean not null default false,
  error_code text null,
  attempted_at timestamptz not null default now()
);

create index if not exists auth_login_attempts_email_time_idx
  on public.auth_login_attempts (email, attempted_at desc);

create index if not exists auth_login_attempts_ip_time_idx
  on public.auth_login_attempts (ip_address, attempted_at desc)
  where ip_address is not null;

alter table public.auth_login_attempts enable row level security;

drop policy if exists "Admins can read auth_login_attempts" on public.auth_login_attempts;
create policy "Admins can read auth_login_attempts"
on public.auth_login_attempts
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

-- Writes happen via service role in server actions.

commit;
