# Bulk Translation Runbook

Use this when adding app content translations for Portuguese, Spanish, Arabic,
and Italian.

## Prerequisites

Apply the translation database migrations first:

- `supabase/migrations/20260418193000_add_content_item_translation_source.sql`
- `supabase/migrations/20260506120000_create_content_theme_translations.sql`

The environment must include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Optional:

- `OPENAI_TRANSLATION_MODEL`
- `OPENAI_TRANSLATION_TIMEOUT_MS`
- `CONTENT_TRANSLATION_CONCURRENCY`

## Check Missing Translations

```bash
npm run content:translate:backfill -- --dry-run --language pt --language es --language ar --language it
npm run themes:translate:backfill -- --dry-run --language pt --language es --language ar --language it
```

## Create Missing Translations

```bash
npm run content:translate:backfill -- --language pt --language es --language ar --language it
npm run themes:translate:backfill -- --language pt --language es --language ar --language it
```

New content items are created as drafts. Theme translations are upserted into
their translation tables.

