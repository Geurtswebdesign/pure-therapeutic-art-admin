begin;

alter table public.content_terms
  add column if not exists is_homepage_seed boolean not null default false,
  add column if not exists homepage_sort_order integer null;

-- Optioneel: behoud huidige seed-weergave na migratie.
update public.content_terms
set
  is_homepage_seed = true,
  homepage_sort_order = case slug
    when 'cognitie-inzicht' then 10
    when 'emoties-innerlijke-beleving' then 20
    when 'gedrag-interactie' then 30
    when 'lichaam-zintuigen' then 40
    when 'natuur-symbolische-kracht' then 50
    when 'symbolen' then 55
    when 'zingeving-ritualen-spiritualiteit' then 60
    when 'specifieke-doelgroepen-context' then 70
    when 'gratis' then 80
    else homepage_sort_order
  end
where slug in (
  'cognitie-inzicht',
  'emoties-innerlijke-beleving',
  'gedrag-interactie',
  'lichaam-zintuigen',
  'natuur-symbolische-kracht',
  'symbolen',
  'zingeving-ritualen-spiritualiteit',
  'specifieke-doelgroepen-context',
  'gratis'
);

commit;
