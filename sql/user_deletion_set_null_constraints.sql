-- Preserve content and credit history when deleting a user/admin.
-- Both columns are nullable, so the FK should release instead of blocking.

begin;

alter table public.content_items
  drop constraint if exists content_items_created_by_fkey;

alter table public.content_items
  add constraint content_items_created_by_fkey
  foreign key (created_by)
  references auth.users(id)
  on delete set null
  deferrable initially deferred;

alter table public.credit_transactions
  drop constraint if exists credit_transactions_admin_id_fkey;

alter table public.credit_transactions
  add constraint credit_transactions_admin_id_fkey
  foreign key (admin_id)
  references public.profiles(user_id)
  on delete set null;

commit;
