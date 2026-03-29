-- Fix delete trigger on public.profiles.
-- The profiles table has no email column, so the trigger must resolve email from auth.users.

create or replace function public.prevent_protected_user_delete()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  protected_email text;
begin
  select u.email
    into protected_email
  from auth.users u
  where u.id = old.user_id;

  if public.is_protected_user(old.user_id, protected_email) then
    raise exception 'This user is protected and cannot be deleted';
  end if;

  return old;
end;
$$;
