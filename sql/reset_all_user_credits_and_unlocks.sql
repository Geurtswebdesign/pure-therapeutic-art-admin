-- Reset all user credits and unlocked content.
-- Safe for environments where some tables may not exist yet.
--
-- What this resets for ALL users:
-- - assignment credits: wallets + transactions
-- - scoped credits (book/game/referral): wallets + transactions
-- - unlocked content records
-- - year entitlement records
--
-- What this does NOT reset by default:
-- - credit_packs (catalog)
-- - credit_pack_purchases (financial purchase history)
--
-- Optional: also clear purchase history by uncommenting the line below.
-- select public._admin_safe_delete_table('public.credit_pack_purchases');

begin;

do $$
declare
  v_table text;
begin
  create or replace function public._admin_safe_delete_table(p_table text)
  returns void
  language plpgsql
  as $f$
  begin
    if to_regclass(p_table) is not null then
      execute format('delete from %s', p_table);
    end if;
  end;
  $f$;

  -- Delete in dependency-safe order.
  perform public._admin_safe_delete_table('public.credit_scope_transactions');
  perform public._admin_safe_delete_table('public.credit_transactions');
  perform public._admin_safe_delete_table('public.content_unlocks');
  perform public._admin_safe_delete_table('public.user_credit_scopes');
  perform public._admin_safe_delete_table('public.credit_wallets');
  perform public._admin_safe_delete_table('public.user_entitlements');
end
$$;

drop function if exists public._admin_safe_delete_table(text);

commit;

