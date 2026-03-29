-- Temporary emergency override for login throttling.
-- This keeps MFA enabled, but effectively disables login attempt blocking.
-- Restore values afterwards via admin settings or a follow-up SQL update.

begin;

update public.app_settings
set value =
  jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(value, '{}'::jsonb),
        '{loginAttemptLimit}',
        to_jsonb(999999),
        true
      ),
      '{ipAttemptLimit}',
      to_jsonb(999999),
      true
    ),
    '{escalationThreshold}',
    to_jsonb(999999),
    true
  )
where scope = 'global'
  and scope_id is null
  and key = 'security';

commit;
