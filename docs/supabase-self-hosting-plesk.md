  # Supabase Self-Hosting On Plesk

This project can be moved from managed Supabase to a self-hosted Supabase stack on the existing Ubuntu 24.04 + Plesk server.

This document is tailored to the current codebase, not a generic Supabase setup.

## What this app currently uses from Supabase

The app depends on all major Supabase surfaces:

- Postgres database with custom tables, RLS, triggers, and multiple RPC functions
- Supabase Auth for sign up, sign in, sessions, admin user management, and TOTP MFA
- Supabase Storage for:
  - public `media` bucket
  - private `secure-ebooks` bucket
- Edge Functions:
  - `wp-events`

Important repo facts:

- The repo does not contain a complete reproducible Supabase project directory with migrations.
- There are useful SQL files in [`sql/`](/Users/dannygeurts/Documents/pure-therapeutic-art/sql), but they are partial and not enough on their own for a full rebuild.
- For this app, the database must be migrated from the live Supabase project with a proper dump.

## Recommended topology

Keep the existing Next.js app deployment as-is on Plesk and run Supabase as a separate Docker Compose project on the same server.

Recommended hostnames:

- App: `pure-therapeutic-art-therapy.com`
- Admin app: `admin.pure-therapeutic-art-therapy.com`
- Self-hosted Supabase public URL: `supabase.pure-therapeutic-art-therapy.com`

Why this shape:

- the app already expects one public Supabase base URL via `NEXT_PUBLIC_SUPABASE_URL`
- a dedicated Supabase subdomain keeps Auth, REST, Storage, and Functions stable
- Plesk can terminate TLS and reverse proxy the subdomain to Docker

## App-side migration changes already prepared

The app has been made less dependent on managed `*.supabase.co` URLs:

- [lib/events/getEvents.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/lib/events/getEvents.ts)
  - now supports self-hosted function fallback under `/functions/v1`
- [lib/images/isSupabaseStorageUrl.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/lib/images/isSupabaseStorageUrl.ts)
  - now uses `NEXT_PUBLIC_SUPABASE_URL` instead of a hardcoded managed Supabase hostname

## Required server prerequisites

Confirm all of this before starting:

- Root or equivalent shell access to the server
- Docker Engine installed
- Docker Compose available
- Plesk Docker extension installed if you want to manage containers from Plesk UI
- Enough free disk for:
  - the database copy
  - storage objects
  - Docker images
  - backups
- Off-server backups configured

Do not rely on Plesk backup alone for Docker data. Plesk documents that Docker containers are not migrated or backed up by Plesk itself, and volume data should be backed up separately.

## High-level migration order

1. Stand up a fresh self-hosted Supabase instance on the server.
2. Secure it properly with new secrets and HTTPS.
3. Restore the managed Supabase database into the self-hosted instance.
4. Copy storage objects from managed Supabase into self-hosted storage.
5. Copy the `wp-events` Edge Function.
6. Recreate any Auth provider and SMTP settings.
7. Point the app’s environment variables to the new Supabase URL.
8. Force users to log in again after cutover.
9. Run smoke tests.
10. Keep managed Supabase online until the self-hosted stack is validated.

## Step 1: Create the self-hosted Supabase project on the server

This repo now includes a ready-to-copy project scaffold in:

- [deploy/supabase-selfhost](/Users/dannygeurts/Documents/pure-therapeutic-art/deploy/supabase-selfhost)

On the server, create a dedicated directory outside the app deploy directory, for example:

```bash
mkdir -p /srv/supabase-selfhost
cd /srv
git clone --depth 1 https://github.com/supabase/supabase
cp -rf supabase/docker/* /srv/supabase-selfhost
cp supabase/docker/.env.example /srv/supabase-selfhost/.env
cd /srv/supabase-selfhost
```

Do not start it yet with the default `.env`.

## Step 2: Generate and set production secrets

In `/srv/supabase-selfhost/.env`, replace all placeholder secrets before first boot.

At minimum set:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY`
- `SERVICE_ROLE_KEY`
- `SECRET_KEY_BASE`
- `VAULT_ENC_KEY`
- `PG_META_CRYPTO_KEY`
- `LOGFLARE_PUBLIC_ACCESS_TOKEN`
- `LOGFLARE_PRIVATE_ACCESS_TOKEN`
- `S3_PROTOCOL_ACCESS_KEY_ID`
- `S3_PROTOCOL_ACCESS_KEY_SECRET`
- `MINIO_ROOT_PASSWORD`
- `DASHBOARD_USERNAME`
- `DASHBOARD_PASSWORD`

Set the public URLs to the final Supabase subdomain:

```env
SUPABASE_PUBLIC_URL=https://supabase.pure-therapeutic-art-therapy.com
API_EXTERNAL_URL=https://supabase.pure-therapeutic-art-therapy.com
SITE_URL=https://pure-therapeutic-art-therapy.com
```

If you use the built-in function runtime, also keep `FUNCTIONS_VERIFY_JWT` aligned with what `wp-events` expects.

## Step 3: Put HTTPS in front of Supabase

Proxy `supabase.pure-therapeutic-art-therapy.com` to the Supabase gateway on `127.0.0.1:8000`.

Requirements:

- WebSocket support enabled
- `X-Forwarded-*` headers forwarded
- TLS terminated at Plesk or another reverse proxy

If you use Plesk for the reverse proxy, keep the Supabase Docker ports bound only to localhost where possible.

## Step 4: Start the self-hosted stack

From `/srv/supabase-selfhost`:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Wait until the core services are healthy.

Basic checks:

```bash
curl -I http://127.0.0.1:8000/auth/v1/
curl -I https://supabase.pure-therapeutic-art-therapy.com/auth/v1/
```

The Auth endpoint should return `401`, which is the expected basic connectivity check.

## Step 5: Dump the managed Supabase database

From your workstation or another machine with Supabase CLI:

```bash
supabase db dump --db-url "[MANAGED_CONNECTION_STRING]" -f roles.sql --role-only
supabase db dump --db-url "[MANAGED_CONNECTION_STRING]" -f schema.sql
supabase db dump --db-url "[MANAGED_CONNECTION_STRING]" -f data.sql --use-copy --data-only
```

Use `supabase db dump`, not raw `pg_dump`, because Supabase’s docs explicitly warn that raw `pg_dump` includes Supabase internals that cause restore problems on self-hosted.

## Step 6: Restore the database into self-hosted Supabase

Connect to the self-hosted database via Supavisor or direct Postgres, then restore:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "postgres://postgres.your-tenant-id:[POSTGRES_PASSWORD]@supabase.pure-therapeutic-art-therapy.com:5432/postgres"
```

Expected caveats:

- if your managed project runs newer internals than the self-hosted image, `data.sql` may need small manual edits
- test restore once before the final cutover

## Step 7: Restore storage

This app needs at least these buckets:

- `media`
- `secure-ebooks`

Do not copy files manually into storage volumes. Supabase docs explicitly say to copy storage objects through the S3 protocol so metadata is created correctly.

Recommended flow:

1. Generate managed project S3 credentials in the Supabase dashboard.
2. Ensure matching buckets exist on self-hosted storage.
3. Use `rclone` to copy bucket contents from managed Supabase to self-hosted Supabase.

You should verify:

- public media URLs load
- private EPUB references still resolve through the app route [`app/api/account/ebooks/[slug]/file/route.ts`](/Users/dannygeurts/Documents/pure-therapeutic-art/app/api/account/ebooks/%5Bslug%5D/file/route.ts)

## Step 8: Restore Edge Functions

This repo currently includes:

- [supabase/functions/wp-events/index.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/supabase/functions/wp-events/index.ts)

Copy it to the self-hosted functions volume:

```bash
scp -r supabase/functions/wp-events user@your-server:/srv/supabase-selfhost/volumes/functions/
ssh user@your-server 'cd /srv/supabase-selfhost && docker compose restart functions --no-deps'
```

Then test:

```bash
curl https://supabase.pure-therapeutic-art-therapy.com/functions/v1/wp-events
```

## Step 9: Reconfigure Auth and email

The database restore keeps users and most auth data, but platform-issued tokens will no longer be valid after migration.

Plan for:

- users logging in again
- reconfiguring any OAuth provider settings
- reconfiguring SMTP and email templates if you rely on them
- rechecking MFA/TOTP flows for admin users

This app uses:

- email/password sign-in
- admin-created users
- TOTP MFA for admin flows

Relevant code paths:

- [components/login/actions.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/components/login/actions.ts)
- [app/admin/users/actions.ts](/Users/dannygeurts/Documents/pure-therapeutic-art/app/admin/users/actions.ts)
- [components/admin/settings/AdminTwoFactorCard.tsx](/Users/dannygeurts/Documents/pure-therapeutic-art/components/admin/settings/AdminTwoFactorCard.tsx)

## Step 10: Update app environment variables

In the app production environment on Plesk, change:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.pure-therapeutic-art-therapy.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new self-hosted anon key>
SUPABASE_SERVICE_ROLE_KEY=<new self-hosted service role key>
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://supabase.pure-therapeutic-art-therapy.com/functions/v1
DATABASE_URL=postgresql://postgres.your-tenant-id:<POSTGRES_PASSWORD>@supabase.pure-therapeutic-art-therapy.com:5432/postgres
```

Leave your app domains as they are:

```env
NEXT_PUBLIC_SITE_URL=https://pure-therapeutic-art-therapy.com
NEXT_PUBLIC_ADMIN_URL=https://admin.pure-therapeutic-art-therapy.com
APP_COOKIE_DOMAIN=.pure-therapeutic-art-therapy.com
```

Then redeploy the app.

## Step 11: Smoke test checklist

Run these after cutover:

- home page loads
- shop loads
- login works
- registration works
- admin login works
- admin MFA enroll / verify / unenroll works
- content unlock flows work
- account page loads wallet/profile data
- public media thumbnails load
- EPUB download route works
- analytics writes still succeed
- `wp-events` response loads on the events page

## App-specific risk list

These areas make this migration more than a simple host swap:

- many server-side reads use `createAdminClient()`, so the service role key must be correct everywhere
- the app uses several database RPC functions; they must come across in the database restore
- storage is used for both public images and private ebooks
- auth admin APIs and TOTP MFA are in active use
- at least one feature depends on an Edge Function

## Suggested cutover strategy

Use a staged migration, not a direct switch:

1. Stand up self-hosted Supabase on `supabase-staging` or internal hostname.
2. Restore database and storage there first.
3. Point a staging copy of the app to the self-hosted instance.
4. Validate login, admin, storage, ebook delivery, and `wp-events`.
5. Freeze admin writes briefly during production cutover.
6. Take a final database dump and final storage sync.
7. Switch production env vars.
8. Redeploy app.
9. Monitor logs closely for at least 24 hours.

## What I would do next

If continuing from this repo, the next concrete tasks are:

1. Add a server provisioning checklist for `/srv/supabase-selfhost`
2. Export a complete feature inventory of the live database:
   - extensions
   - buckets
   - RPC functions
   - auth providers
3. Prepare the production `.env` values for the new Supabase subdomain
4. Create a cutover checklist with rollback

## Sources

- Supabase self-hosting with Docker:
  https://supabase.com/docs/guides/self-hosting/docker
- Supabase reverse proxy and HTTPS for self-hosting:
  https://supabase.com/docs/guides/self-hosting/self-hosted-proxy-https
- Supabase restore from managed platform to self-hosted:
  https://supabase.com/docs/guides/self-hosting/restore-from-platform
- Supabase copy storage objects from platform:
  https://supabase.com/docs/guides/self-hosting/copy-from-platform-s3
- Supabase self-hosted functions:
  https://supabase.com/docs/guides/self-hosting/self-hosted-functions
- Supabase egress billing:
  https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Plesk Docker documentation:
  https://docs.plesk.com/en-US/obsidian/administrator-guide/plesk-administration/using-docker.75823/
