create table if not exists public.app_ebook_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_title text null,
  amount_cents integer null check (amount_cents is null or amount_cents >= 0),
  currency text not null default 'EUR',
  source text not null default 'app',
  purchase_status text not null default 'paid'
    check (purchase_status in ('paid', 'granted', 'revoked')),
  external_reference text null,
  metadata jsonb not null default '{}'::jsonb,
  purchased_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create index if not exists app_ebook_purchases_user_idx
  on public.app_ebook_purchases (user_id, purchased_at desc);

create index if not exists app_ebook_purchases_product_idx
  on public.app_ebook_purchases (product_id, purchased_at desc);

alter table public.app_ebook_purchases enable row level security;

drop policy if exists "Users can read their own ebook purchases"
  on public.app_ebook_purchases;

create policy "Users can read their own ebook purchases"
  on public.app_ebook_purchases
  for select
  to authenticated
  using (auth.uid() = user_id);
