-- Security settings + login attempts storage
-- Run after sql/app_settings.sql

begin;

insert into public.app_settings (scope, scope_id, key, value)
select
  'global',
  null,
  'security',
  jsonb_build_object(
    'loginAttemptLimit', 3,
    'ipAttemptLimit', 15,
    'loginWindowMinutes', 15,
    'escalationThreshold', 10,
    'escalationWindowMinutes', 60,
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

create index if not exists auth_login_attempts_user_agent_time_idx
  on public.auth_login_attempts (user_agent, attempted_at desc)
  where user_agent is not null;

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  actor_user_id uuid null,
  target_user_id uuid null,
  ip_address text null,
  user_agent text null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_logs_created_idx
  on public.security_audit_logs (created_at desc);

create index if not exists security_audit_logs_event_idx
  on public.security_audit_logs (event_type, created_at desc);

create table if not exists public.security_alert_events (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null,
  channel text not null default 'email',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists security_alert_events_key_time_idx
  on public.security_alert_events (alert_key, created_at desc);

create table if not exists public.auth_session_invalidations (
  user_id uuid primary key,
  invalid_after timestamptz not null default now(),
  reason text null,
  updated_by uuid null,
  updated_at timestamptz not null default now()
);

create index if not exists auth_session_invalidations_time_idx
  on public.auth_session_invalidations (invalid_after desc);

alter table public.auth_login_attempts enable row level security;
alter table public.security_audit_logs enable row level security;
alter table public.security_alert_events enable row level security;
alter table public.auth_session_invalidations enable row level security;

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

drop policy if exists "Admins can read security_audit_logs" on public.security_audit_logs;
create policy "Admins can read security_audit_logs"
on public.security_audit_logs
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

drop policy if exists "Admins can read security_alert_events" on public.security_alert_events;
create policy "Admins can read security_alert_events"
on public.security_alert_events
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

drop policy if exists "Admins can read auth_session_invalidations" on public.auth_session_invalidations;
create policy "Admins can read auth_session_invalidations"
on public.auth_session_invalidations
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

commit;
