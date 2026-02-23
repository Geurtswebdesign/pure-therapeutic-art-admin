-- Content access scopes + scoped credit balances + yearly assignment entitlement.
-- Run AFTER:
--   1) sql/credit_administration.sql
--   2) existing unlock/credits schema (credit_wallets, content_unlocks, admin_adjust_credits, etc)

-- 1) Content item scope
alter table public.content_items
add column if not exists access_scope text not null default 'assignment'
check (access_scope in ('assignment', 'book', 'game', 'referral'));

create index if not exists content_items_access_scope_idx
on public.content_items (access_scope, status);

-- 2) Pack scope (assignment = old behavior)
alter table public.credit_packs
add column if not exists credit_scope text not null default 'assignment'
check (credit_scope in ('assignment', 'book', 'game', 'referral'));

create index if not exists credit_packs_scope_idx
on public.credit_packs (credit_scope, is_active, sort_order);

-- 3) Scoped balances for non-assignment credits
create table if not exists public.user_credit_scopes (
  user_id uuid not null,
  credit_scope text not null check (credit_scope in ('book', 'game', 'referral')),
  credits_available integer not null default 0 check (credits_available >= 0),
  credits_total_purchased integer not null default 0 check (credits_total_purchased >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, credit_scope)
);

create index if not exists user_credit_scopes_updated_idx
on public.user_credit_scopes (updated_at desc);

-- 4) Scoped transactions (book/game/referral)
create table if not exists public.credit_scope_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  credit_scope text not null check (credit_scope in ('book', 'game', 'referral')),
  delta integer not null check (delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  admin_id uuid null,
  ref_id text null,
  created_at timestamptz not null default now()
);

create index if not exists credit_scope_transactions_user_created_idx
on public.credit_scope_transactions (user_id, credit_scope, created_at desc);

-- 5) Entitlements (e.g. yearly assignments access)
create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entitlement_key text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  is_active boolean not null default true,
  source text not null default 'admin',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists user_entitlements_lookup_idx
on public.user_entitlements (user_id, entitlement_key, is_active, starts_at, ends_at);

-- 6) RLS
alter table public.user_credit_scopes enable row level security;
alter table public.credit_scope_transactions enable row level security;
alter table public.user_entitlements enable row level security;

drop policy if exists "Admins can read user_credit_scopes" on public.user_credit_scopes;
create policy "Admins can read user_credit_scopes"
on public.user_credit_scopes
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can write user_credit_scopes" on public.user_credit_scopes;
create policy "Admins can write user_credit_scopes"
on public.user_credit_scopes
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can read credit_scope_transactions" on public.credit_scope_transactions;
create policy "Admins can read credit_scope_transactions"
on public.credit_scope_transactions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can write credit_scope_transactions" on public.credit_scope_transactions;
create policy "Admins can write credit_scope_transactions"
on public.credit_scope_transactions
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can read user_entitlements" on public.user_entitlements;
create policy "Admins can read user_entitlements"
on public.user_entitlements
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can write user_entitlements" on public.user_entitlements;
create policy "Admins can write user_entitlements"
on public.user_entitlements
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

-- 7) Function: adjust scoped credits
create or replace function public.admin_adjust_credit_scope(
  p_user_id uuid,
  p_credit_scope text,
  p_delta integer,
  p_reason text,
  p_admin_id uuid,
  p_ref_id text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  if p_credit_scope not in ('book', 'game', 'referral') then
    raise exception 'INVALID_CREDIT_SCOPE';
  end if;

  if coalesce(p_delta, 0) = 0 then
    raise exception 'DELTA_MUST_NOT_BE_ZERO';
  end if;

  insert into public.user_credit_scopes (user_id, credit_scope, credits_available)
  values (p_user_id, p_credit_scope, 0)
  on conflict (user_id, credit_scope) do nothing;

  update public.user_credit_scopes
  set credits_available = credits_available + p_delta,
      updated_at = now()
  where user_id = p_user_id
    and credit_scope = p_credit_scope
    and credits_available + p_delta >= 0
  returning credits_available into v_next;

  if v_next is null then
    raise exception 'INSUFFICIENT_SCOPE_CREDITS';
  end if;

  insert into public.credit_scope_transactions (
    user_id, credit_scope, delta, balance_after, reason, admin_id, ref_id
  )
  values (
    p_user_id, p_credit_scope, p_delta, v_next, p_reason, p_admin_id, p_ref_id
  );

  return v_next;
end;
$$;

revoke all on function public.admin_adjust_credit_scope(uuid, text, integer, text, uuid, text) from public;
grant execute on function public.admin_adjust_credit_scope(uuid, text, integer, text, uuid, text) to authenticated;

-- 8) Function: entitlement check
create or replace function public.has_active_entitlement(
  p_user_id uuid,
  p_entitlement_key text
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_entitlements e
    where e.user_id = p_user_id
      and e.entitlement_key = p_entitlement_key
      and e.is_active = true
      and e.starts_at <= now()
      and (e.ends_at is null or e.ends_at > now())
  );
$$;

-- 9) Function: unlock scoped content (book/game/referral)
create or replace function public.unlock_scoped_content_item(
  p_content_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item record;
  v_existing record;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select id, access_scope, credit_cost
  into v_item
  from public.content_items
  where id = p_content_item_id
  limit 1;

  if v_item.id is null then
    raise exception 'CONTENT_NOT_FOUND';
  end if;

  if v_item.access_scope not in ('book', 'game', 'referral') then
    raise exception 'INVALID_SCOPE_FOR_SCOPED_UNLOCK';
  end if;

  select id
  into v_existing
  from public.content_unlocks
  where user_id = v_user_id and content_item_id = p_content_item_id
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object(
      'unlocked', true,
      'already_unlocked', true,
      'scope', v_item.access_scope
    );
  end if;

  perform public.admin_adjust_credit_scope(
    v_user_id,
    v_item.access_scope,
    -coalesce(v_item.credit_cost, 0),
    'content_unlock',
    v_user_id,
    p_content_item_id::text
  );

  insert into public.content_unlocks (user_id, content_item_id, credits_spent)
  values (v_user_id, p_content_item_id, coalesce(v_item.credit_cost, 0));

  select credits_available
  into v_balance
  from public.user_credit_scopes
  where user_id = v_user_id and credit_scope = v_item.access_scope
  limit 1;

  return jsonb_build_object(
    'unlocked', true,
    'scope', v_item.access_scope,
    'cost', coalesce(v_item.credit_cost, 0),
    'balance', coalesce(v_balance, 0)
  );
exception
  when others then
    if sqlerrm = 'INSUFFICIENT_SCOPE_CREDITS' then
      select credits_available
      into v_balance
      from public.user_credit_scopes
      where user_id = v_user_id and credit_scope = v_item.access_scope
      limit 1;

      return jsonb_build_object(
        'unlocked', false,
        'error', 'INSUFFICIENT_SCOPE_CREDITS',
        'scope', v_item.access_scope,
        'cost', coalesce(v_item.credit_cost, 0),
        'balance', coalesce(v_balance, 0)
      );
    end if;
    raise;
end;
$$;

revoke all on function public.unlock_scoped_content_item(uuid) from public;
grant execute on function public.unlock_scoped_content_item(uuid) to authenticated;

-- 10) Function: has content access (unlocks + yearly assignments entitlement)
create or replace function public.has_content_access(
  p_user_id uuid,
  p_content_item_id uuid
)
returns boolean
language plpgsql
stable
as $$
declare
  v_scope text := 'assignment';
  v_unlocked boolean := false;
begin
  select coalesce(access_scope, 'assignment')
  into v_scope
  from public.content_items
  where id = p_content_item_id
  limit 1;

  if v_scope = 'assignment' then
    if public.has_active_entitlement(p_user_id, 'year_assignments') then
      return true;
    end if;
  end if;

  select exists (
    select 1 from public.content_unlocks
    where user_id = p_user_id and content_item_id = p_content_item_id
  )
  into v_unlocked;

  return v_unlocked;
end;
$$;

-- 11) Upgrade pack purchase RPC to route by scope
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
  v_scope text;
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

  v_scope := coalesce(v_pack.credit_scope, 'assignment');
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

  if v_scope = 'assignment' then
    perform public.admin_adjust_credits(
      p_user_id,
      v_credits_total,
      'pack_purchase',
      p_admin_id,
      v_purchase_id::text
    );

    insert into public.credit_wallets (user_id, credits_available, credits_total_purchased)
    values (p_user_id, 0, v_credits_total)
    on conflict (user_id)
    do update set
      credits_total_purchased = public.credit_wallets.credits_total_purchased + excluded.credits_total_purchased,
      updated_at = now();
  elsif v_scope in ('book', 'game', 'referral') then
    perform public.admin_adjust_credit_scope(
      p_user_id,
      v_scope,
      v_credits_total,
      'pack_purchase',
      p_admin_id,
      v_purchase_id::text
    );

    insert into public.user_credit_scopes (user_id, credit_scope, credits_total_purchased)
    values (p_user_id, v_scope, v_credits_total)
    on conflict (user_id, credit_scope)
    do update set
      credits_total_purchased = public.user_credit_scopes.credits_total_purchased + excluded.credits_total_purchased,
      updated_at = now();
  else
    raise exception 'INVALID_CREDIT_SCOPE';
  end if;

  return v_purchase_id;
end;
$$;
