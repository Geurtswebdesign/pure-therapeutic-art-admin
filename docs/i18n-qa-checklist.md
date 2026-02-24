# i18n QA Checklist

Use this checklist after any UI/content/admin change that can affect translations.

## 1. Test Setup
- Set `Primary language` in `/admin/settings/general` to `nl`, save, hard refresh.
- Repeat the same flow for `en` and `de`.
- Verify `<html lang="...">` changes with selected primary language.

## 2. Core Public Flows
- Home `/`:
  - Title, subtitle, CTA buttons are translated.
- Login `/login`:
  - Title, labels, submit button are translated.
- Content locked page `/content/[slug]`:
  - Lock copy, pricing/balance line, CTA buttons, errors are translated.
- Localized public page `/[locale]/[slug]`:
  - Featured image fallback alt text is translated.

## 3. Account Flows
- Account `/account`:
  - Header and subtitle translated.
  - Tabs translated (`Overview`, `Profile`, `Credits`, `Unlocked`).
  - Role labels translated.
  - Date formatting follows locale (`nl-NL`, `en-US`, `de-DE`).
- Profile form:
  - Labels/buttons/messages translated.
- Credits:
  - Overview title translated.
  - Transactions table headers/empty state translated.
- Unlocked content table:
  - Headers/empty state/fallback text translated.

## 4. Admin Core
- Dashboard `/admin/dashboard` translated.
- Administration `/admin/administration` translated:
  - Overview cards
  - Credits tab (packs/forms/messages)
  - Wallets tables
  - Transactions table
- Content list `/admin/content` translated:
  - Tabs, bulk actions, search, table headers, row actions.
- Settings `/admin/settings/*` translated:
  - Section title, tabs, page copy.

## 5. Admin User Detail
- `/admin/users/[user_id]` translated:
  - Header, tabs, general form labels/placeholders/buttons.
  - Role editor texts.
  - Reset password card texts.
  - Credits tab actions/messages/year-subscription texts.
  - Unlocked table texts.

## 6. Admin Content Editor
- `/admin/content/[id]` translated:
  - Metadata sidebar section labels/actions/messages.
  - Publish block always open behavior unchanged.
  - Slug auto-generation still works when title changes.

## 7. Media & Category Helpers
- Media library `/admin/content/media` translated:
  - Tabs, upload area, library labels, metadata panel actions/errors.
- Category quick row actions translated:
  - Quick edit, delete, save/cancel states.

## 8. Regression & Data
- No runtime errors in console during language switch/save.
- No 500 errors on pages that now depend on translations.
- `general.primaryLanguage` persists after save/reload.
- `app_settings.value` no longer depends on `enabledLanguages`.

## 9. Engineering Gate
- Run:
  - `npm run -s lint`
  - `npx tsc --noEmit`
- Both must pass before merge/deploy.

