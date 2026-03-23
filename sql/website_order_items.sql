create table if not exists public.website_order_items (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'website',
  external_order_id text not null,
  external_line_id text not null,
  user_id uuid null,
  customer_email text null,
  item_kind text not null check (item_kind in ('purchase', 'ebook', 'subscription', 'credit_pack')),
  title text not null,
  subtitle text null,
  amount_cents integer null,
  currency text null,
  occurred_at timestamptz not null default timezone('utc', now()),
  href text null,
  content_item_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source, external_order_id, external_line_id)
);

create index if not exists website_order_items_user_idx
  on public.website_order_items (user_id, occurred_at desc);

create index if not exists website_order_items_email_idx
  on public.website_order_items (lower(customer_email), occurred_at desc);

create index if not exists website_order_items_content_idx
  on public.website_order_items (content_item_id);

create index if not exists website_order_items_kind_idx
  on public.website_order_items (item_kind, occurred_at desc);

alter table public.website_order_items enable row level security;
