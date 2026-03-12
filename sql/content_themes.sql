begin;

create table if not exists public.content_theme_pages (
  id uuid primary key default gen_random_uuid(),
  parent_theme_page_id uuid null references public.content_theme_pages(id) on delete set null,
  source_key text null unique,
  slug text not null unique,
  eyebrow text null,
  title text not null,
  description text null,
  hero_image_url text null,
  hero_image_alt text null,
  hero_image_position text not null default 'right',
  primary_category_term_id uuid null references public.content_terms(id) on delete set null,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_theme_sections (
  id uuid primary key default gen_random_uuid(),
  theme_page_id uuid not null references public.content_theme_pages(id) on delete cascade,
  slug text not null,
  title text not null,
  description text null,
  layout_style text not null default 'grid' check (layout_style in ('featured', 'grid', 'list')),
  section_image_url text null,
  section_image_alt text null,
  section_image_position text not null default 'none',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_page_id, slug)
);

create table if not exists public.content_theme_section_items (
  id uuid primary key default gen_random_uuid(),
  theme_section_id uuid not null references public.content_theme_sections(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  custom_title text null,
  custom_excerpt text null,
  featured boolean not null default false,
  override_image_url text null,
  override_image_alt text null,
  override_image_position text not null default 'inherit',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_section_id, content_item_id)
);

alter table public.content_theme_pages
  add column if not exists parent_theme_page_id uuid null references public.content_theme_pages(id) on delete set null,
  add column if not exists source_key text null,
  add column if not exists hero_image_url text null,
  add column if not exists hero_image_alt text null,
  add column if not exists hero_image_position text not null default 'right';

create unique index if not exists content_theme_pages_source_key_uidx
  on public.content_theme_pages (source_key)
  where source_key is not null;

alter table public.content_theme_sections
  add column if not exists section_image_url text null,
  add column if not exists section_image_alt text null,
  add column if not exists section_image_position text not null default 'none';

alter table public.content_theme_section_items
  add column if not exists override_image_url text null,
  add column if not exists override_image_alt text null,
  add column if not exists override_image_position text not null default 'inherit';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content_theme_pages'
      and column_name = 'featured_image_url'
  ) then
    execute '
      update public.content_theme_pages
      set hero_image_url = coalesce(hero_image_url, featured_image_url)
      where featured_image_url is not null
    ';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content_theme_pages'
      and column_name = 'featured_image_alt'
  ) then
    execute '
      update public.content_theme_pages
      set hero_image_alt = coalesce(hero_image_alt, featured_image_alt)
      where featured_image_alt is not null
    ';
  end if;
end $$;

do $$
begin
  alter table public.content_theme_pages
    add constraint content_theme_pages_hero_image_position_check
    check (hero_image_position in ('top', 'right', 'background'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.content_theme_sections
    add constraint content_theme_sections_image_position_check
    check (section_image_position in ('none', 'top', 'left', 'right'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.content_theme_section_items
    add constraint content_theme_section_items_image_position_check
    check (override_image_position in ('inherit', 'top', 'left', 'right', 'hidden'));
exception
  when duplicate_object then null;
end $$;

create index if not exists content_theme_pages_publish_sort_idx
  on public.content_theme_pages (is_published, sort_order, title);

create index if not exists content_theme_pages_parent_sort_idx
  on public.content_theme_pages (parent_theme_page_id, sort_order, title);

create index if not exists content_theme_sections_page_sort_idx
  on public.content_theme_sections (theme_page_id, sort_order);

create index if not exists content_theme_section_items_section_sort_idx
  on public.content_theme_section_items (theme_section_id, sort_order);

create index if not exists content_theme_section_items_content_idx
  on public.content_theme_section_items (content_item_id);

alter table public.content_theme_pages enable row level security;
alter table public.content_theme_sections enable row level security;
alter table public.content_theme_section_items enable row level security;

commit;
