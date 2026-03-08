begin;

alter table public.content_terms
  add column if not exists featured_image_url text,
  add column if not exists featured_image_alt text;

commit;
