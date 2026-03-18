# Admin Subdomain Setup

This app now supports:

- public site on `https://pure-therapeutic-art-therapy.com`
- admin site on `https://admin.pure-therapeutic-art-therapy.com`

Both hosts should point to the same Next.js deployment. The app itself routes the admin host to the internal `/admin/*` area.

## Required environment variables

Set these in production:

```env
NEXT_PUBLIC_SITE_URL=https://pure-therapeutic-art-therapy.com
NEXT_PUBLIC_ADMIN_URL=https://admin.pure-therapeutic-art-therapy.com
APP_COOKIE_DOMAIN=.pure-therapeutic-art-therapy.com
```

Notes:

- `NEXT_PUBLIC_SITE_URL` is the canonical public origin.
- `NEXT_PUBLIC_ADMIN_URL` is the canonical admin origin.
- `APP_COOKIE_DOMAIN` shares auth cookies across the main domain and the admin subdomain.
- If `NEXT_PUBLIC_ADMIN_URL` is omitted, the app falls back to the old same-host `/admin/*` behavior.

## DNS / platform setup

Point both hosts to the same app:

- `pure-therapeutic-art-therapy.com`
- `admin.pure-therapeutic-art-therapy.com`

If you use a hosting platform with domain mapping, add both domains to the same project.

## Reverse proxy requirements

If you run Next.js behind Nginx, Caddy, Apache, or another reverse proxy, make sure the original host and protocol are forwarded.

Example Nginx snippet:

```nginx
server {
    server_name pure-therapeutic-art-therapy.com admin.pure-therapeutic-art-therapy.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Without these headers the app cannot reliably detect whether a request came in on the admin host.

## Supabase auth notes

If you use invite links, email auth redirects, or OAuth later, make sure both origins are allowed in Supabase auth settings:

- `https://pure-therapeutic-art-therapy.com`
- `https://admin.pure-therapeutic-art-therapy.com`

## Expected behavior

- Visiting `https://pure-therapeutic-art-therapy.com/admin/...` redirects to the admin subdomain.
- Visiting `https://admin.pure-therapeutic-art-therapy.com/` opens the admin dashboard entry.
- Visiting `https://admin.pure-therapeutic-art-therapy.com/content` opens the admin content area.
- The admin login flow stays on the admin subdomain.
- The login page on the admin host hides public registration.

## Smoke test

1. Open `https://pure-therapeutic-art-therapy.com/admin`.
2. Confirm you are redirected to `https://admin.pure-therapeutic-art-therapy.com/`.
3. Log in with an admin account.
4. Confirm you land on the admin subdomain and can open `/dashboard`, `/content`, and `/users`.
5. Open the public site in another tab and confirm the normal public routes still work.
