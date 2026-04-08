# Supabase Docker Project For Plesk

This directory is the starting point for the self-hosted Supabase stack for this app.

It is based on the official Supabase Docker setup and is intended to be copied to the server as a standalone Docker Compose project, separate from the Next.js app.

Recommended server path:

```bash
/srv/supabase-selfhost
```

## Source

This snapshot was copied from the official Supabase Docker project at:

```text
b694fbdc753b96ce824869e296c62c7799c4703b
```

Official references:

- https://supabase.com/docs/guides/self-hosting/docker
- https://github.com/supabase/supabase/tree/master/docker

## What is included here

- official `docker-compose.yml`
- official `.env.example`
- official helper scripts in `utils/`
- official Kong, Postgres, pooler, logs, snippets, and starter Edge Functions files

This project intentionally does not include the optional Caddy/Nginx compose variants because Plesk will handle the reverse proxy and TLS for the final setup.

## First server-side steps

1. Copy this directory to the server, for example to `/srv/supabase-selfhost`.
2. Duplicate `.env.example` to `.env`.
3. Run:

```bash
cd /srv/supabase-selfhost
sh ./utils/generate-keys.sh
```

4. Review `.env` manually and replace all placeholder values before the first start.
5. Apply the project-specific URL values from `.env.plesk.example`.
6. Start the stack with:

```bash
docker compose pull
docker compose up -d
```

## App-specific notes

- The final public Supabase base URL should be:

```text
https://supabase.pure-therapeutic-art-therapy.com
```

- This app uses:
  - database RPC functions
  - Auth
  - admin user APIs
  - TOTP MFA
  - public `media` storage
  - private `secure-ebooks` storage
  - `wp-events` Edge Function

- The `wp-events` function from this repo must be copied into:

```text
volumes/functions/wp-events/index.ts
```

- This folder only creates the Docker project. It does not restore your live managed Supabase database or storage yet.

For the full migration order, use:

- [docs/supabase-self-hosting-plesk.md](/Users/dannygeurts/Documents/pure-therapeutic-art/docs/supabase-self-hosting-plesk.md)
