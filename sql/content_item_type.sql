alter table public.content_items
  add column if not exists item_type text not null default 'article';
