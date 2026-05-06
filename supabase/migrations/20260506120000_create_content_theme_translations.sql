create table if not exists public.content_theme_page_translations (
  id uuid primary key default gen_random_uuid(),
  theme_page_id uuid not null references public.content_theme_pages(id) on delete cascade,
  language text not null,
  eyebrow text null,
  title text not null,
  description text null,
  hero_image_alt text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_theme_page_translations_theme_page_language_uidx unique (theme_page_id, language)
);

create index if not exists content_theme_page_translations_theme_page_id_idx
  on public.content_theme_page_translations (theme_page_id);

create index if not exists content_theme_page_translations_language_idx
  on public.content_theme_page_translations (language);

create table if not exists public.content_theme_section_translations (
  id uuid primary key default gen_random_uuid(),
  theme_section_id uuid not null references public.content_theme_sections(id) on delete cascade,
  language text not null,
  title text not null,
  description text null,
  section_image_alt text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_theme_section_translations_theme_section_language_uidx unique (theme_section_id, language)
);

create index if not exists content_theme_section_translations_theme_section_id_idx
  on public.content_theme_section_translations (theme_section_id);

create index if not exists content_theme_section_translations_language_idx
  on public.content_theme_section_translations (language);

create table if not exists public.content_theme_section_item_translations (
  id uuid primary key default gen_random_uuid(),
  theme_section_item_id uuid not null references public.content_theme_section_items(id) on delete cascade,
  language text not null,
  custom_title text null,
  custom_excerpt text null,
  override_image_alt text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_theme_section_item_translations_theme_section_item_language_uidx unique (theme_section_item_id, language)
);

create index if not exists content_theme_section_item_translations_theme_section_item_id_idx
  on public.content_theme_section_item_translations (theme_section_item_id);

create index if not exists content_theme_section_item_translations_language_idx
  on public.content_theme_section_item_translations (language);
