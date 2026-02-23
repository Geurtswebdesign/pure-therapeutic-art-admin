-- Seed credit packs for Pure Therapeutic ART
-- Run after: sql/credit_administration.sql

insert into public.credit_packs (
  slug,
  name,
  credit_scope,
  credits_base,
  bonus_credits,
  price_cents,
  currency,
  is_active,
  sort_order
)
values
  ('opdrachten-5', '5 opdrachten', 'assignment', 5, 0, 333, 'EUR', true, 10),
  ('opdrachten-10', '10 opdrachten', 'assignment', 10, 0, 666, 'EUR', true, 20),
  ('opdrachten-15', '15 opdrachten', 'assignment', 15, 0, 888, 'EUR', true, 30),
  ('opdrachten-20', '20 opdrachten', 'assignment', 20, 0, 1010, 'EUR', true, 40)
on conflict (slug)
do update set
  name = excluded.name,
  credit_scope = excluded.credit_scope,
  credits_base = excluded.credits_base,
  bonus_credits = excluded.bonus_credits,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- TODO: voeg deze packs toe zodra credits_base bekend is:
-- ??? = EUR 11.11
-- Boeken = EUR 18.18
-- Spellen = EUR 18.18
-- Verwijsbestand = EUR 22.22
-- Jaarabb. = EUR 33.33
--
-- Template:
-- insert into public.credit_packs (
--   slug, name, credits_base, bonus_credits, price_cents, currency, is_active, sort_order
-- ) values (
--   'jaarabonnement', 'Jaarabb.', 0, 0, 3333, 'EUR', true, 90
-- ) on conflict (slug) do update set
--   name = excluded.name,
--   credits_base = excluded.credits_base,
--   bonus_credits = excluded.bonus_credits,
--   price_cents = excluded.price_cents,
--   currency = excluded.currency,
--   is_active = excluded.is_active,
--   sort_order = excluded.sort_order,
--   updated_at = now();
