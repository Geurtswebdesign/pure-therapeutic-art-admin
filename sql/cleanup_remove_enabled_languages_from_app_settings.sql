-- Remove deprecated `enabledLanguages` from general app settings JSON.
-- Safe to run multiple times.

begin;

update public.app_settings
set value = value - 'enabledLanguages',
    updated_at = now()
where key = 'general'
  and jsonb_typeof(value) = 'object'
  and value ? 'enabledLanguages';

commit;

-- Optional verification:
-- select id, key, value
-- from public.app_settings
-- where key = 'general';
