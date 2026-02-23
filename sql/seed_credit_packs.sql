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
  ('opdrachten-20', '20 opdrachten', 'assignment', 20, 0, 1010, 'EUR', true, 40),
  ('jaarabonnement', 'Jaarabonnement', 'assignment', 1, 0, 3333, 'EUR', true, 90),
  ('boek-gekleurde-tranen', 'Gekleurde Tranen', 'book', 1, 0, 1818, 'EUR', true, 100),
  ('boek-liefdevol-koesteren', 'Liefdevol Koesteren', 'book', 1, 0, 1818, 'EUR', true, 110),
  ('boek-onzichtbaar-verdriet', 'Onzichtbaar verdriet', 'book', 1, 0, 1818, 'EUR', true, 120),
  ('boek-in-stilte-rouw-verbeelden', 'In stilte Rouw verbeelden', 'book', 1, 0, 1818, 'EUR', true, 130),
  ('spel-memospel-vergeet-niet-me-verdrietjes', 'Memospel: vergeet-niet-me-verdrietjes', 'game', 1, 0, 1818, 'EUR', true, 200),
  ('spel-kwartetspel-niet-hier-wel-dichtbij', 'Kwartetspel: Niet hier, wel dichtbij', 'game', 1, 0, 1818, 'EUR', true, 210)
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
