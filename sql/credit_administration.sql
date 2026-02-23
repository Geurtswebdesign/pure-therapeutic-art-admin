-- Credit administration module
-- - credit_packs: configurable products
-- - credit_pack_purchases: immutable business/audit log
-- - admin_record_credit_pack_purchase: atomic business transaction

create table if not exists public.credit_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  credits_base integer not null check (credits_base > 0),
  bonus_credits integer not null default 0 check (bonus_credits >= 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'EUR',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null
);

create index if not exists credit_packs_active_sort_idx
on public.credit_packs (is_active, sort_order, created_at desc);

create table if not exists public.credit_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  pack_id uuid not null references public.credit_packs(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  credits_base integer not null check (credits_base > 0),
  bonus_credits integer not null default 0 check (bonus_credits >= 0),
  credits_total integer not null check (credits_total > 0),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null default 'completed',
  source text not null default 'admin',
  external_ref text null,
  note text null,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists credit_pack_purchases_user_created_idx
on public.credit_pack_purchases (user_id, created_at desc);

create index if not exists credit_pack_purchases_pack_created_idx
on public.credit_pack_purchases (pack_id, created_at desc);

-- Shared trigger for updated_at if it exists already; fallback create.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_credit_packs_updated_at on public.credit_packs;
create trigger trg_credit_packs_updated_at
before update on public.credit_packs
for each row execute function public.set_updated_at();

alter table public.credit_packs enable row level security;
alter table public.credit_pack_purchases enable row level security;

drop policy if exists "Admins can read credit_packs" on public.credit_packs;
create policy "Admins can read credit_packs"
on public.credit_packs
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

drop policy if exists "Admins can write credit_packs" on public.credit_packs;
create policy "Admins can write credit_packs"
on public.credit_packs
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

drop policy if exists "Admins can read credit_pack_purchases" on public.credit_pack_purchases;
create policy "Admins can read credit_pack_purchases"
on public.credit_pack_purchases
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

drop policy if exists "Admins can write credit_pack_purchases" on public.credit_pack_purchases;
create policy "Admins can write credit_pack_purchases"
on public.credit_pack_purchases
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

create or replace function public.admin_record_credit_pack_purchase(
  p_user_id uuid,
  p_pack_id uuid,
  p_quantity integer,
  p_admin_id uuid,
  p_note text default null,
  p_external_ref text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pack public.credit_packs%rowtype;
  v_quantity integer := greatest(coalesce(p_quantity, 1), 1);
  v_credits_base integer;
  v_bonus_credits integer;
  v_credits_total integer;
  v_amount_cents integer;
  v_purchase_id uuid;
begin
  select *
  into v_pack
  from public.credit_packs
  where id = p_pack_id
  limit 1;

  if v_pack.id is null then
    raise exception 'CREDIT_PACK_NOT_FOUND';
  end if;

  if not v_pack.is_active then
    raise exception 'CREDIT_PACK_INACTIVE';
  end if;

  v_credits_base := v_pack.credits_base * v_quantity;
  v_bonus_credits := v_pack.bonus_credits * v_quantity;
  v_credits_total := v_credits_base + v_bonus_credits;
  v_amount_cents := v_pack.price_cents * v_quantity;

  insert into public.credit_pack_purchases (
    user_id,
    pack_id,
    quantity,
    credits_base,
    bonus_credits,
    credits_total,
    amount_cents,
    currency,
    status,
    source,
    external_ref,
    note,
    created_by
  )
  values (
    p_user_id,
    p_pack_id,
    v_quantity,
    v_credits_base,
    v_bonus_credits,
    v_credits_total,
    v_amount_cents,
    v_pack.currency,
    'completed',
    'admin',
    p_external_ref,
    p_note,
    p_admin_id
  )
  returning id into v_purchase_id;

  -- Existing balance + audit logic.
  perform public.admin_adjust_credits(
    p_user_id,
    v_credits_total,
    'pack_purchase',
    p_admin_id,
    v_purchase_id::text
  );

  -- Keep "purchased total" in sync for reporting.
  insert into public.credit_wallets (user_id, credits_available, credits_total_purchased)
  values (p_user_id, 0, v_credits_total)
  on conflict (user_id)
  do update set
    credits_total_purchased = public.credit_wallets.credits_total_purchased + excluded.credits_total_purchased,
    updated_at = now();

  return v_purchase_id;
end;
$$;

revoke all on function public.admin_record_credit_pack_purchase(uuid, uuid, integer, uuid, text, text) from public;
grant execute on function public.admin_record_credit_pack_purchase(uuid, uuid, integer, uuid, text, text) to authenticated;
