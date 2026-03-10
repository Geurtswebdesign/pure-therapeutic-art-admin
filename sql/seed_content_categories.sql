-- Seed: categorieen voor de publieke categoriepagina
-- Vereist dat taxonomy "category" al bestaat in public.content_taxonomies

with category_taxonomy as (
  select id
  from public.content_taxonomies
  where slug = 'category'
  limit 1
),
seed_rows(name, slug, description, sort_order) as (
  values
    (
      'Symbolen',
      'symbolen',
      'Toegang tot gratis oefeningen, meditaties en wellness tools. Begin vandaag nog met jouw welzijnsreis.',
      90
    )
)
insert into public.content_terms (
  taxonomy_id,
  name,
  slug,
  description,
  sort_order,
  is_active
)
select
  ct.id,
  s.name,
  s.slug,
  s.description,
  s.sort_order,
  true
from seed_rows s
cross join category_taxonomy ct
where not exists (
  select 1
  from public.content_terms t
  where t.taxonomy_id = ct.id
    and t.slug = s.slug
);

with category_taxonomy as (
  select id
  from public.content_taxonomies
  where slug = 'category'
  limit 1
),
seed_rows(name, slug, description, sort_order) as (
  values
    (
      'Gratis Content',
      'gratis',
      'Toegang tot gratis oefeningen, meditaties en wellness tools. Begin vandaag nog met jouw welzijnsreis.',
      80
    ),
    (
      'Cognitie & Inzicht',
      'cognitie-inzicht',
      'Verken je gedachten en mentale processen. Krijg inzicht in hoe je denkt en beslissingen maakt.',
      10
    ),
    (
      'Emoties & Innerlijke Beleving',
      'emoties-innerlijke-beleving',
      'Verbind met je emoties en innerlijke wereld. Ontwikkel emotioneel bewustzijn en veerkracht.',
      20
    ),
    (
      'Gedrag & Interactie',
      'gedrag-interactie',
      'Verbeter je sociale vaardigheden en interacties. Leer patronen herkennen in jouw gedrag.',
      30
    ),
    (
      'Lichaam & Zintuigen',
      'lichaam-zintuigen',
      'Ontwikkel lichaamsbesef en zintuiglijk bewustzijn. Voel wat je lichaam je vertelt.',
      40
    ),
    (
      'Natuur & Symbolische Kracht',
      'natuur-symbolische-kracht',
      'Ontdek de helende kracht van natuur en symboliek. Vind verbinding met jezelf en je omgeving.',
      50
    ),
    (
      'Zingeving, Ritualen & Spiritualiteit',
      'zingeving-ritualen-spiritualiteit',
      'Vind betekenis door rituelen en spirituele praktijken. Verdiep je innerlijke rust en richting.',
      60
    ),
    (
      'Specifieke Doelgroepen & Context',
      'specifieke-doelgroepen-context',
      'Gerichte ondersteuning voor jouw unieke situatie en context. Voor iedereen een passende route.',
      70
    )
)
update public.content_terms t
set
  name = s.name,
  description = s.description,
  sort_order = s.sort_order,
  is_active = true
from seed_rows s
cross join category_taxonomy ct
where t.taxonomy_id = ct.id
  and t.slug = s.slug;
