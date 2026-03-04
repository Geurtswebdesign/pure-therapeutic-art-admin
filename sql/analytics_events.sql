-- Analytics events (pageviews, traffic sources, devices)
-- Run after sql/app_settings.sql

begin;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_type text not null,
  event_name text null,
  event_category text null,
  event_label text null,
  event_value numeric null,
  path text not null,
  page_title text null,
  referrer text null,
  referrer_host text null,
  referrer_type text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_content text null,
  utm_term text null,
  utm_id text null,
  anon_id text null,
  session_id text null,
  user_agent text null,
  device_type text null,
  os text null,
  browser text null,
  language text null,
  country text null,
  region text null,
  city text null,
  screen_width integer null,
  screen_height integer null
);

create index if not exists analytics_events_time_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_type_time_idx
  on public.analytics_events (event_type, occurred_at desc);

create index if not exists analytics_events_path_time_idx
  on public.analytics_events (path, occurred_at desc);

create index if not exists analytics_events_anon_time_idx
  on public.analytics_events (anon_id, occurred_at desc);

create index if not exists analytics_events_session_time_idx
  on public.analytics_events (session_id, occurred_at desc);

alter table public.analytics_events enable row level security;

-- No policies: writes are via service role only.

alter table public.analytics_events
  add column if not exists event_name text,
  add column if not exists event_category text,
  add column if not exists event_label text,
  add column if not exists event_value numeric,
  add column if not exists page_title text,
  add column if not exists referrer_host text,
  add column if not exists referrer_type text,
  add column if not exists utm_id text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text;

create index if not exists analytics_events_event_idx
  on public.analytics_events (event_type, event_name, occurred_at desc);

create or replace function public.analytics_overview(from_ts timestamptz, to_ts timestamptz)
returns table (
  pageviews bigint,
  unique_visitors bigint,
  sessions bigint
)
language sql
as $$
  select
    count(*) filter (where event_type = 'pageview') as pageviews,
    count(distinct anon_id) as unique_visitors,
    count(distinct session_id) as sessions
  from public.analytics_events
  where occurred_at >= from_ts
    and occurred_at <= to_ts;
$$;

create or replace function public.analytics_top_pages(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  path text,
  pageviews bigint,
  unique_visitors bigint
)
language sql
as $$
  select
    path,
    count(*) as pageviews,
    count(distinct anon_id) as unique_visitors
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by path
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_top_referrers(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  referrer text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(referrer, ''), 'Direct') as referrer,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_top_sources(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  source text,
  pageviews bigint
)
language sql
as $$
  select
    case
      when coalesce(utm_source, '') = '' and coalesce(utm_medium, '') = '' then 'Direct'
      when coalesce(utm_medium, '') = '' then utm_source
      else concat(utm_source, ' / ', utm_medium)
    end as source,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_device_breakdown(from_ts timestamptz, to_ts timestamptz)
returns table (
  device text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(device_type, ''), 'unknown') as device,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc;
$$;

create or replace function public.analytics_campaigns(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  campaign text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(utm_campaign, ''), 'unknown') as campaign,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_social_referrers(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  network text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(referrer_host, ''), 'unknown') as network,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
    and referrer_type = 'social'
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_ai_referrers(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  source text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(referrer_host, ''), 'unknown') as source,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
    and referrer_type = 'ai'
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_country_breakdown(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  country text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(country, ''), 'unknown') as country,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc
  limit limit_n;
$$;

create or replace function public.analytics_daily_pageviews(from_ts timestamptz, to_ts timestamptz)
returns table (
  day date,
  pageviews bigint
)
language sql
as $$
  select
    date_trunc('day', occurred_at)::date as day,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by day asc;
$$;

create or replace function public.analytics_realtime(minutes integer)
returns table (
  minute timestamptz,
  pageviews bigint
)
language sql
as $$
  select
    date_trunc('minute', occurred_at) as minute,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= now() - (minutes || ' minutes')::interval
  group by 1
  order by minute asc;
$$;

create or replace function public.analytics_top_events(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  event_name text,
  event_category text,
  total bigint
)
language sql
as $$
  select
    coalesce(nullif(event_name, ''), 'event') as event_name,
    coalesce(nullif(event_category, ''), 'general') as event_category,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1,2
  order by total desc
  limit limit_n;
$$;

create or replace function public.analytics_top_events_by_category(from_ts timestamptz, to_ts timestamptz, category_prefix text, limit_n integer)
returns table (
  event_name text,
  event_category text,
  total bigint
)
language sql
as $$
  select
    coalesce(nullif(event_name, ''), 'event') as event_name,
    coalesce(nullif(event_category, ''), 'general') as event_category,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category ilike (category_prefix || '%')
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1,2
  order by total desc
  limit limit_n;
$$;

create or replace function public.analytics_ecommerce_coupons(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  code text,
  total bigint
)
language sql
as $$
  select
    coalesce(nullif(event_label, ''), 'unknown') as code,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category = 'ecommerce'
    and event_name = 'coupon_applied'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by total desc
  limit limit_n;
$$;

create or replace function public.analytics_ecommerce_cart_abandonment(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  item text,
  total bigint
)
language sql
as $$
  select
    coalesce(nullif(event_label, ''), 'unknown') as item,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category = 'ecommerce'
    and event_name in ('cart_abandoned', 'checkout_abandoned')
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by total desc
  limit limit_n;
$$;

create or replace function public.analytics_ecommerce_funnel(from_ts timestamptz, to_ts timestamptz)
returns table (
  step text,
  total bigint
)
language sql
as $$
  select 'Checkout started' as step,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category = 'ecommerce'
    and event_name = 'checkout_started'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  union all
  select 'Payment submitted' as step,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category = 'ecommerce'
    and event_name = 'payment_submitted'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  union all
  select 'Purchase completed' as step,
    count(*) as total
  from public.analytics_events
  where event_type = 'event'
    and event_category = 'ecommerce'
    and event_name = 'purchase_completed'
    and occurred_at >= from_ts
    and occurred_at <= to_ts;
$$;

create or replace function public.analytics_perf_metrics(from_ts timestamptz, to_ts timestamptz)
returns table (
  metric text,
  avg_value numeric,
  p95_value numeric
)
language sql
as $$
  select
    coalesce(nullif(event_name, ''), 'metric') as metric,
    avg(event_value) as avg_value,
    percentile_cont(0.95) within group (order by event_value) as p95_value
  from public.analytics_events
  where event_type = 'performance'
    and event_value is not null
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by metric asc;
$$;

create or replace function public.analytics_recent_exceptions(from_ts timestamptz, to_ts timestamptz, limit_n integer)
returns table (
  event_label text,
  total bigint
)
language sql
as $$
  select
    coalesce(nullif(event_label, ''), 'exception') as event_label,
    count(*) as total
  from public.analytics_events
  where event_type = 'exception'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by total desc
  limit limit_n;
$$;

create or replace function public.analytics_os_breakdown(from_ts timestamptz, to_ts timestamptz)
returns table (
  os text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(os, ''), 'unknown') as os,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc;
$$;

create or replace function public.analytics_browser_breakdown(from_ts timestamptz, to_ts timestamptz)
returns table (
  browser text,
  pageviews bigint
)
language sql
as $$
  select
    coalesce(nullif(browser, ''), 'unknown') as browser,
    count(*) as pageviews
  from public.analytics_events
  where event_type = 'pageview'
    and occurred_at >= from_ts
    and occurred_at <= to_ts
  group by 1
  order by pageviews desc;
$$;

commit;
