-- Seed credit packs

begin;

insert into public.credit_packs (key, name, description, credits, price_cents, is_active)
values
  ('starter', 'Starter', 'Voor het uitproberen van het platform.', 10, 499, true),
  ('plus', 'Plus', 'Extra credits voor regelmatige gebruikers.', 25, 999, true),
  ('pro', 'Pro', 'Voor intensief gebruik en teams.', 60, 1999, true)
on conflict (key)
  do update set
    name = excluded.name,
    description = excluded.description,
    credits = excluded.credits,
    price_cents = excluded.price_cents,
    is_active = excluded.is_active;

commit;
