# Plesk Deployment For Next.js

This project is prepared for self-hosting on a regular Node.js process behind Plesk.

Important:

- Plesk does not officially support Next.js.
- The practical setup is: one Node.js process on the server, with Plesk handling domains, SSL, and reverse proxying.
- Both `pure-therapeutic-art-therapy.com` and `admin.pure-therapeutic-art-therapy.com` should point to the same app process.

## Required server checks

Before deployment, confirm:

```bash
node -v
npm -v
```

Use Node.js `20.9.0` or newer.

This repo includes:

- `.node-version` set to `24`
- `.npmrc` with `scripts-prepend-node-path=true`
- `postcss.config.mjs` for the Tailwind/PostCSS production build

These files are part of the production build setup for Plesk.
`postcss.config.mjs` must also be present in the application root on the server, otherwise the build can succeed but ship incomplete CSS without Tailwind utility classes.

## Environment variables

Set these in your production environment:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SITE_URL=https://pure-therapeutic-art-therapy.com
NEXT_PUBLIC_ADMIN_URL=https://admin.pure-therapeutic-art-therapy.com
APP_COOKIE_DOMAIN=.pure-therapeutic-art-therapy.com

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Add any existing mail, analytics, or Google credentials your app already uses.

## Build and run on the server

Deploy the project into a server directory, for example:

```text
/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current
```

Then run:

```bash
npm -v
npm ci
npm run build:standalone
node server.cjs
```

Do not run `npm audit fix` on the production server as part of deployment.
That can mutate `package-lock.json` and change the dependency tree away from the tested repo state.

For a persistent process, use PM2:

```bash
npm install -g pm2
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
```

Update the `cwd` value in `deploy/pm2/ecosystem.config.cjs` before starting PM2.

`server.cjs` is checked into the repo, so Plesk can use it as a stable startup file.
It starts `.next/standalone/server.js` after the standalone build exists.

## If Plesk reports `nodenv: node: command not found`

This is a Plesk/nodenv PATH issue. The usual fix is:

1. Make sure the repo files `.node-version` and `.npmrc` are present in the application root.
2. If needed, run in the application root:

```bash
nodenv local 24
```

3. Retry:

```bash
npm ci
npm run build:standalone
```

## Plesk setup

### 1. Domains

In Plesk:

1. Add `pure-therapeutic-art-therapy.com`.
2. Add the subdomain `admin.pure-therapeutic-art-therapy.com`.
3. Enable SSL for both.

### 2. Reverse proxy

Both hosts must proxy to the same internal Node.js process, for example `http://127.0.0.1:3000`.

If you use Plesk's Apache & Nginx settings with extra Nginx directives, configure proxying so these headers are forwarded:

- `Host`
- `X-Forwarded-Host`
- `X-Forwarded-Proto`
- `X-Forwarded-For`

Example Nginx shape:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Apply this for both the main domain and the admin subdomain.

## If the admin subdomain shows a Plesk 403/404 page

If `https://admin.pure-therapeutic-art-therapy.com` returns a plain Plesk error page instead of the app:

- the subdomain is not reaching the Node.js process yet
- the host-based admin rewrite in the app is not the problem

Typical symptoms:

- `https://pure-therapeutic-art-therapy.com/admin` redirects correctly to the admin subdomain
- `https://admin.pure-therapeutic-art-therapy.com` shows a Plesk `403 Forbidden`
- `https://admin.pure-therapeutic-art-therapy.com/login` or `/admin` shows a Plesk `404`

That means the subdomain is still being served as a normal static/PHP site by Plesk instead of proxying to the same Node.js app.

Fix:

1. Keep the Node.js app running only once on the server.
2. Make the admin subdomain proxy to the same internal app port, for example `127.0.0.1:3000`.
3. Forward these headers:
   - `Host`
   - `X-Forwarded-Host`
   - `X-Forwarded-Proto`
   - `X-Forwarded-For`

Example extra Nginx directives for the admin subdomain:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

After applying that config, restart the web server and the Node.js app, then test:

- `https://admin.pure-therapeutic-art-therapy.com`
- `https://admin.pure-therapeutic-art-therapy.com/login`

## Deploy flow for updates

For each release:

```bash
bash deploy/release-server.sh
```

See also:

- `docs/production-runbook.md`
- `docs/secret-rotation-checklist.md`

## Smoke test

1. Open `https://pure-therapeutic-art-therapy.com`.
2. Open `https://pure-therapeutic-art-therapy.com/admin` and confirm it redirects to the admin subdomain.
3. Open `https://admin.pure-therapeutic-art-therapy.com`.
4. Log in with an admin account.
5. Confirm the admin area stays on the admin subdomain.
