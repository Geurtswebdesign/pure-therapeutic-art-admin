begin;

alter table public.content_items
  add column if not exists translation_source_id uuid null references public.content_items(id) on delete set null;

create index if not exists content_items_translation_source_idx
  on public.content_items (translation_source_id);

create unique index if not exists content_items_translation_source_language_uidx
  on public.content_items (translation_source_id, language)
  where translation_source_id is not null;

commit;
