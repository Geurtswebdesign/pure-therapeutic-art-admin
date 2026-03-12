begin;

-- Gebruik dit bestand als invulbare blueprint voor echte themapagina's.
-- Vervang de voorbeeldwaarden hieronder door jullie eigen slugs, teksten en beeld-URLs.
-- Als het thema uit de zip-structuur komt, vul dan ook een unieke source_key in.
--
-- Layout-richtlijnen:
-- content_theme_pages.hero_image_position:
--   'top'        = grote afbeelding boven de intro
--   'right'      = afbeelding rechts naast de intro
--   'background' = afbeelding als hero-achtergrond
--
-- content_theme_sections.layout_style:
--   'featured' = eerste, meer redactionele sectie
--   'grid'     = kaarten in raster
--   'list'     = compactere lijst
--
-- content_theme_sections.section_image_position:
--   'none'  = geen sectie-afbeelding
--   'top'   = afbeelding boven sectie-inhoud
--   'left'  = afbeelding links van sectie-inhoud
--   'right' = afbeelding rechts van sectie-inhoud
--
-- content_theme_section_items.override_image_position:
--   'inherit' = gebruik image van content_item of sectiekaartlogica
--   'top'     = afbeelding boven de kaart
--   'left'    = afbeelding links in een horizontale kaart
--   'right'   = afbeelding rechts in een horizontale kaart
--   'hidden'  = geen afbeelding tonen voor dit item

with selected_category as (
  select id
  from public.content_terms
  where slug = 'vervang-door-categorie-slug'
  limit 1
),
selected_parent_theme as (
  select id
  from public.content_theme_pages
  where source_key = 'optionele-parent-source-key'
  limit 1
),
upsert_theme as (
  insert into public.content_theme_pages (
    parent_theme_page_id,
    source_key,
    slug,
    eyebrow,
    title,
    description,
    hero_image_url,
    hero_image_alt,
    hero_image_position,
    primary_category_term_id,
    is_published,
    sort_order
  )
  select
    selected_parent_theme.id,
    'optionele-unieke-source-key',
    'vervang-door-thema-slug',
    'Thema',
    'Vervang door thematitel',
    'Korte introductie waarin je uitlegt waarom deze route bestaat en voor wie hij bedoeld is.',
    'https://jouwdomein.nl/uploads/themas/hero.jpg',
    'Omschrijf hier de hero-afbeelding',
    'right',
    selected_category.id,
    false,
    10
  from selected_category
  left join selected_parent_theme on true
  on conflict (slug) do update
  set
    parent_theme_page_id = excluded.parent_theme_page_id,
    source_key = excluded.source_key,
    eyebrow = excluded.eyebrow,
    title = excluded.title,
    description = excluded.description,
    hero_image_url = excluded.hero_image_url,
    hero_image_alt = excluded.hero_image_alt,
    hero_image_position = excluded.hero_image_position,
    primary_category_term_id = excluded.primary_category_term_id,
    is_published = excluded.is_published,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
),
section_seed(
  slug,
  title,
  description,
  layout_style,
  section_image_url,
  section_image_alt,
  section_image_position,
  sort_order
) as (
  values
    (
      'intro',
      'Begin hier',
      'Open de route met een eerste selectie die veilig, licht en uitnodigend voelt.',
      'featured',
      'https://jouwdomein.nl/uploads/themas/secties/intro.jpg',
      'Omschrijf hier de intro-afbeelding',
      'top',
      10
    ),
    (
      'verdieping',
      'Verdieping',
      'Bundel hier de kernitems die inhoudelijk bij elkaar horen en samen een middenstuk vormen.',
      'grid',
      'https://jouwdomein.nl/uploads/themas/secties/verdieping.jpg',
      'Omschrijf hier de verdiepingsafbeelding',
      'right',
      20
    ),
    (
      'integratie',
      'Integratie',
      'Sluit af met toepasbare items voor dagelijks gebruik of vervolg in de praktijk.',
      'list',
      null,
      null,
      'none',
      30
    )
)
insert into public.content_theme_sections (
  theme_page_id,
  slug,
  title,
  description,
  layout_style,
  section_image_url,
  section_image_alt,
  section_image_position,
  sort_order
)
select
  upsert_theme.id,
  section_seed.slug,
  section_seed.title,
  section_seed.description,
  section_seed.layout_style,
  section_seed.section_image_url,
  section_seed.section_image_alt,
  section_seed.section_image_position,
  section_seed.sort_order
from section_seed
cross join upsert_theme
on conflict (theme_page_id, slug) do update
set
  title = excluded.title,
  description = excluded.description,
  layout_style = excluded.layout_style,
  section_image_url = excluded.section_image_url,
  section_image_alt = excluded.section_image_alt,
  section_image_position = excluded.section_image_position,
  sort_order = excluded.sort_order,
  updated_at = now();

with theme_page as (
  select id
  from public.content_theme_pages
  where slug = 'vervang-door-thema-slug'
  limit 1
),
section_map as (
  select
    s.id,
    s.slug
  from public.content_theme_sections s
  join theme_page on theme_page.id = s.theme_page_id
),
content_map as (
  select id, slug
  from public.content_items
  where slug in (
    'eerste-content-slug',
    'tweede-content-slug',
    'derde-content-slug',
    'vierde-content-slug',
    'vijfde-content-slug'
  )
),
item_seed(
  section_slug,
  content_slug,
  custom_title,
  custom_excerpt,
  featured,
  override_image_url,
  override_image_alt,
  override_image_position,
  sort_order
) as (
  values
    (
      'intro',
      'eerste-content-slug',
      null,
      'Optionele aangepaste teasertekst voor deze routekaart.',
      true,
      'https://jouwdomein.nl/uploads/themas/items/item-1.jpg',
      'Omschrijf hier de itemafbeelding',
      'top',
      10
    ),
    (
      'intro',
      'tweede-content-slug',
      null,
      null,
      false,
      null,
      null,
      'inherit',
      20
    ),
    (
      'verdieping',
      'derde-content-slug',
      'Aangepaste kaarttitel voor dit thema',
      'Gebruik dit wanneer de themapagina een andere insteek nodig heeft dan de originele contenttitel.',
      false,
      'https://jouwdomein.nl/uploads/themas/items/item-3.jpg',
      'Omschrijf hier de itemafbeelding',
      'top',
      10
    ),
    (
      'verdieping',
      'vierde-content-slug',
      null,
      null,
      false,
      null,
      null,
      'inherit',
      20
    ),
    (
      'integratie',
      'vijfde-content-slug',
      null,
      'Compact item onderaan de route, zonder beeld voor extra rust.',
      false,
      null,
      null,
      'hidden',
      10
    )
)
insert into public.content_theme_section_items (
  theme_section_id,
  content_item_id,
  custom_title,
  custom_excerpt,
  featured,
  override_image_url,
  override_image_alt,
  override_image_position,
  sort_order
)
select
  section_map.id,
  content_map.id,
  item_seed.custom_title,
  item_seed.custom_excerpt,
  item_seed.featured,
  item_seed.override_image_url,
  item_seed.override_image_alt,
  item_seed.override_image_position,
  item_seed.sort_order
from item_seed
join section_map on section_map.slug = item_seed.section_slug
join content_map on content_map.slug = item_seed.content_slug
on conflict (theme_section_id, content_item_id) do update
set
  custom_title = excluded.custom_title,
  custom_excerpt = excluded.custom_excerpt,
  featured = excluded.featured,
  override_image_url = excluded.override_image_url,
  override_image_alt = excluded.override_image_alt,
  override_image_position = excluded.override_image_position,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
