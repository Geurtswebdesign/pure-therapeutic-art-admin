begin;

create table if not exists public.customizer_headers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  logo_alt text null,
  subtitle text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customizer_header_rules (
  id uuid primary key default gen_random_uuid(),
  header_id uuid not null references public.customizer_headers(id) on delete cascade,
  target_type text not null check (target_type in ('category', 'route', 'page')),
  target_value text not null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_value)
);

create index if not exists customizer_header_rules_header_idx
  on public.customizer_header_rules (header_id);

alter table public.customizer_headers enable row level security;
alter table public.customizer_header_rules enable row level security;

commit;
