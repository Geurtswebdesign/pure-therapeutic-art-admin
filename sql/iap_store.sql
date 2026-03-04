-- In-app purchase plumbing (Apple/Google)
-- Run after sql/credit_administration.sql

begin;

create table if not exists public.iap_products (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  store_product_id text not null,
  pack_id uuid not null references public.credit_packs(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists iap_products_platform_store_idx
  on public.iap_products (platform, store_product_id);

create table if not exists public.iap_transactions (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  store_transaction_id text not null,
  store_product_id text not null,
  user_id uuid null,
  pack_id uuid null references public.credit_packs(id) on delete set null,
  quantity integer not null default 1,
  amount_cents integer null,
  currency text null,
  status text not null default 'pending',
  raw_payload jsonb null,
  created_at timestamptz not null default now()
);

create unique index if not exists iap_transactions_platform_tx_idx
  on public.iap_transactions (platform, store_transaction_id);

create index if not exists iap_transactions_product_idx
  on public.iap_transactions (store_product_id);

create table if not exists public.iap_notifications (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  notification_type text null,
  subtype text null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

alter table public.iap_products enable row level security;
alter table public.iap_transactions enable row level security;
alter table public.iap_notifications enable row level security;

-- No policies: writes are via service role only.

commit;
