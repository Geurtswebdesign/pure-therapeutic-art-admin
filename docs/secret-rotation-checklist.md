# Secret Rotation Checklist

These secrets were exposed during deployment troubleshooting and should be rotated.

## Rotate now

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `WP_EVENTS_TOKEN`

Also rotate these if they are configured and currently trusted:

- `IAP_INTERNAL_SECRET`
- `IAP_WEBHOOK_SECRET`

## Rotation order

1. Create replacement secrets in the provider dashboard.
2. Update `.env.production` on the server.
3. Update the same values in Plesk environment variables.
4. Restart the app:

```bash
bash deploy/release-server.sh
```

5. Verify public site, admin login, mail sending and event loading.

## Supabase

This app currently uses:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The current values are legacy JWT-based keys. In the legacy system, `anon` and `service_role` are tied to the JWT secret and should be treated as a linked pair.

Immediate containment:

- rotate the legacy JWT secret or complete the migration to the new signing keys system
- update both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in production

Important:

- rotating legacy JWT secrets can affect existing sessions
- long-term, migrate to Supabase signing keys plus publishable/secret API keys

Production follow-up after the emergency rotation:

- review server-only usage in `lib/supabase/admin.ts`
- keep browser usage limited to the public client key
- plan a migration away from the legacy JWT-secret based model

## Google mail OAuth

This app sends mail through Gmail OAuth2 using:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_SENDER_EMAIL`
- `GOOGLE_ALLOWED_SENDER_EMAILS`

Rotate by:

1. Revoking the compromised OAuth grant or credentials on the Google side.
2. Creating a new refresh token for the same sender setup.
3. Updating the production environment values.
4. Testing an actual outbound mail flow from the admin email settings page.

## WordPress events integration

This app uses:

- `WP_EVENTS_TOKEN`
- `WP_EVENTS_URL`

Rotate the token on the WordPress side, then update production.

After rotation, test:

- `https://pure-therapeutic-art-therapy.com/trainingen`

## Verification after rotation

Check:

```bash
pm2 status
curl -I http://127.0.0.1:3000
bash scripts/smoke-check.sh
```

Then test in the browser:

- public homepage
- admin login
- email send test
- trainingen/events page

## Official references

- Supabase signing keys and legacy JWT secret migration:
  `https://supabase.com/docs/guides/auth/signing-keys`
- Google OAuth 2.0 for server-side web apps:
  `https://developers.google.com/identity/protocols/oauth2/web-server`
- Google OAuth token revocation:
  `https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke`
