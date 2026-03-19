# Production Runbook

This runbook is for the Plesk + PM2 deployment of this app.

## Current production shape

- Public site: `https://pure-therapeutic-art-therapy.com`
- Admin site: `https://admin.pure-therapeutic-art-therapy.com`
- One shared Next.js app process
- PM2 app name: `pure-therapeutic-art`
- Internal app port: `127.0.0.1:3000`
- Plesk handles SSL and reverse proxying

## Required files in the deployed app root

These files must be present in the server app root:

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `postcss.config.mjs`
- `proxy.ts`
- `tsconfig.json`
- `server.cjs`
- `.node-version`
- `.env.production`
- `app/`
- `assets/`
- `components/`
- `deploy/`
- `docs/`
- `lib/`
- `public/`
- `scripts/`
- `styles/`

## Pre-release checks

Before pushing a release to production:

1. Confirm `.env.production` on the server still matches the required keys in `.env.production.example`.
2. Confirm `postcss.config.mjs` is included in the upload.
3. Confirm the PM2 app is currently healthy:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

## Release

Run this on the server as the Plesk system user for this subscription.
Do not run the release as `root`.

If you are currently logged in as `root`, determine the app owner first and switch to that user:

```bash
APP_DIR=/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current
stat -c '%U %G' "${APP_DIR}"
sudo -u "$(stat -c '%U' "${APP_DIR}")" -H bash -lc "cd '${APP_DIR}' && bash deploy/release-server.sh"
```

If you are already logged in as the subscription user, run:

```bash
bash deploy/release-server.sh
```

The script:

- uses the Plesk Node 24 binary
- loads `.env.production`
- runs `npm ci --include=dev`
- rebuilds the standalone bundle
- restarts or starts the PM2 app
- saves the PM2 process list
- does a local health probe on `127.0.0.1:3000`

For automatic GitHub-driven deploys, use:

- workflow: `.github/workflows/deploy-production.yml`
- server updater: `deploy/update-server-from-git.sh`
- setup guide: `docs/github-auto-deploy.md`

## Smoke test

Run:

```bash
bash scripts/smoke-check.sh
```

This checks:

- public homepage
- admin subdomain
- admin login route
- redirect from `/admin` on the main host

## Runtime checks

Quick health commands:

```bash
whoami
pm2 status
pm2 logs pure-therapeutic-art --lines 100
ss -ltnp | grep :3000
curl -I http://127.0.0.1:3000
```

Run PM2 as the Plesk system user for this subscription, not as `root`.
That keeps GitHub-driven deploys, the git checkout, and the process owner aligned.

If `whoami` returns `root`, stop and switch to the subscription user first.

## Troubleshooting

### Admin subdomain shows Plesk 403/404

The subdomain is not reaching the Node.js app.

Check the subdomain's `Apache & nginx Settings` in Plesk:

- `Proxy mode` disabled
- `Serve static files directly by nginx` disabled
- custom nginx reverse proxy present for `127.0.0.1:3000`

### Admin subdomain shows Bad Gateway

Nginx is proxying, but the app is not listening on port `3000`.

Check:

```bash
pm2 status
ss -ltnp | grep :3000
curl -I http://127.0.0.1:3000
```

### Page HTML loads but styling is broken

Most likely `postcss.config.mjs` is missing from the server copy.

Check:

```bash
ls -la postcss.config.mjs
wc -c .next/static/chunks/*.css
```

The main production CSS should be in the tens of kilobytes, not a tiny single-digit KB file.

## Rollback

Use your previous known-good deployment copy and repeat the release flow.

Avoid destructive git commands in a dirty production tree.
Prefer restoring a previous release directory or re-uploading the previous tested build.
