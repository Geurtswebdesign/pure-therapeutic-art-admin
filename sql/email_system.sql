-- Email system foundation:
-- - email_templates
-- - email_branding_settings
-- - email_logs
--
-- Run after profiles/admin RLS model exists.

begin;

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  sender_key text not null default 'noreply',
  subject text not null,
  html text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null
);
alter table public.email_templates
  add column if not exists sender_key text;

create table if not exists public.email_sender_profiles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  email text null,
  reply_to text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

insert into public.email_sender_profiles (key, name, email, reply_to, is_active)
values
  ('techsupport', 'Tech Support', null, null, true),
  ('noreply', 'No Reply', null, null, true),
  ('meldingen', 'Meldingen', null, null, true),
  ('klantenservice', 'Klantenservice', null, null, true),
  ('facturatie', 'Facturatie', null, null, true)
on conflict (key) do nothing;

-- Normalize legacy key naming before constraints.
update public.email_templates
set sender_key = 'noreply'
where sender_key = 'norepl';

update public.email_templates
set sender_key = coalesce(sender_key, 'noreply')
where sender_key is null;

delete from public.email_sender_profiles
where key = 'norepl';

alter table public.email_templates
  alter column sender_key set default 'noreply';
alter table public.email_templates
  alter column sender_key set not null;

alter table public.email_sender_profiles
  drop constraint if exists email_sender_profiles_key_check;
alter table public.email_sender_profiles
  add constraint email_sender_profiles_key_check
  check (key in ('techsupport', 'noreply', 'meldingen', 'klantenservice', 'facturatie'));

alter table public.email_templates
  drop constraint if exists email_templates_type_check;
alter table public.email_templates
  add constraint email_templates_type_check
  check (type in ('unlock_content', 'reminder', 'credits_added', 'welcome'));

create table if not exists public.email_branding_settings (
  id uuid primary key default gen_random_uuid(),
  app_name text not null default 'Pure Therapeutic ART Therapy',
  primary_color text not null default '#111827',
  logo_url text null,
  support_email text null,
  footer_text text null,
  website_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  template_type text null,
  recipient text not null,
  subject text not null,
  status text not null default 'queued',
  provider text not null default 'google_oauth2',
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz null,
  created_by uuid null
);

create index if not exists email_logs_created_idx
  on public.email_logs (created_at desc);

create index if not exists email_logs_status_idx
  on public.email_logs (status, created_at desc);

create or replace function public.set_email_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at
before update on public.email_templates
for each row execute function public.set_email_updated_at();

drop trigger if exists trg_email_sender_profiles_updated_at on public.email_sender_profiles;
create trigger trg_email_sender_profiles_updated_at
before update on public.email_sender_profiles
for each row execute function public.set_email_updated_at();

drop trigger if exists trg_email_branding_updated_at on public.email_branding_settings;
create trigger trg_email_branding_updated_at
before update on public.email_branding_settings
for each row execute function public.set_email_updated_at();

alter table public.email_templates
  drop constraint if exists email_templates_sender_key_fkey;
alter table public.email_templates
  add constraint email_templates_sender_key_fkey
  foreign key (sender_key) references public.email_sender_profiles(key) on update cascade;

insert into public.email_templates (type, sender_key, subject, html, is_active)
values
  (
    'unlock_content',
    'meldingen',
    'Je content is ontgrendeld',
    '<h1>Je content is ontgrendeld 🎉</h1><p>Hi {{user_name}},</p><p>Je hebt <strong>{{content_title}}</strong> succesvol ontgrendeld.</p><p>Je hebt nog {{remaining_credits}} credits over.</p><p><a href="{{app_url}}">Bekijk de content</a></p>',
    true
  ),
  (
    'reminder',
    'meldingen',
    'Herinnering van {{app_name}}',
    '<h1>Herinnering</h1><p>Hi {{user_name}},</p><p>{{reminder_text}}</p><p><a href="{{action_url}}">Ga verder</a></p>',
    true
  ),
  (
    'credits_added',
    'facturatie',
    'Credits bijgewerkt',
    '<h1>Credits bijgewerkt</h1><p>Hi {{user_name}},</p><p>Er zijn credits toegevoegd aan je account.</p><p>Nieuw saldo: <strong>{{remaining_credits}}</strong></p>',
    true
  ),
  (
    'welcome',
    'noreply',
    'Welkom bij {{app_name}}',
    '<h1>Welkom</h1><p>Hi {{user_name}},</p><p>Fijn dat je er bent. Je kunt direct starten via onderstaande knop.</p><p><a href="{{app_url}}">Start nu</a></p>',
    true
  )
on conflict (type) do nothing;

insert into public.email_branding_settings (
  app_name,
  primary_color,
  footer_text
)
select
  'Pure Therapeutic ART Therapy',
  '#111827',
  '© Pure Therapeutic ART Therapy'
where not exists (
  select 1 from public.email_branding_settings
);

alter table public.email_templates enable row level security;
alter table public.email_sender_profiles enable row level security;
alter table public.email_branding_settings enable row level security;
alter table public.email_logs enable row level security;

drop policy if exists "Admins can read email_templates" on public.email_templates;
create policy "Admins can read email_templates"
on public.email_templates
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

drop policy if exists "Admins can write email_templates" on public.email_templates;
create policy "Admins can write email_templates"
on public.email_templates
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

drop policy if exists "Admins can read email_sender_profiles" on public.email_sender_profiles;
create policy "Admins can read email_sender_profiles"
on public.email_sender_profiles
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

drop policy if exists "Admins can write email_sender_profiles" on public.email_sender_profiles;
create policy "Admins can write email_sender_profiles"
on public.email_sender_profiles
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

drop policy if exists "Admins can read email_branding_settings" on public.email_branding_settings;
create policy "Admins can read email_branding_settings"
on public.email_branding_settings
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

drop policy if exists "Admins can write email_branding_settings" on public.email_branding_settings;
create policy "Admins can write email_branding_settings"
on public.email_branding_settings
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

drop policy if exists "Admins can read email_logs" on public.email_logs;
create policy "Admins can read email_logs"
on public.email_logs
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

drop policy if exists "Admins can write email_logs" on public.email_logs;
create policy "Admins can write email_logs"
on public.email_logs
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

commit;
