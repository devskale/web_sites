# Auth for the family home page on lubu.skale.dev

**Goal:** A home page on lubu.skale.dev hosting temp pages, private — only the
family can access. Login via Google. Open source + free, lightweight (no Docker),
nginx reverse proxy.

## Recommendation: oauth2-proxy + nginx `auth_request`

Use **[oauth2-proxy](https://github.com/oauth2-proxy/oauth2-proxy)** as a small
reverse-proxy auth layer in front of nginx, with Google as the identity provider.

- **MIT licensed, open source, free.** ([source: repo license](https://github.com/oauth2-proxy/oauth2-proxy))
- Supports Google OAuth2 / OpenID Connect natively.
- Designed to sit in front of nginx via the `auth_request` directive:
  nginx sends every request to oauth2-proxy's `/oauth2/auth` endpoint; a `202`
  means allow through, a `401` triggers the login flow.
  ([source: nginx integration docs](https://oauth2-proxy.github.io/oauth2-proxy/configuration/integrations/nginx/),
  [repo](https://github.com/oauth2-proxy/oauth2-proxy/blob/master/contrib/local-environment/nginx.conf))
- **Restrict to family** by allow-listing exact Google email addresses
  (`--email-domain` / `--authenticated-emails-file`), so only your family's
  accounts can log in — not the whole world.
- Single small Go binary, no Docker, runs fine as a systemd service on this box.

### Why not the alternatives

| Option | Verdict | Why |
|--------|---------|-----|
| **Authelia** | Overkill here | Full SSO/MFA portal; powerful but needs its own user DB, config, and is heavier than needed for "Google login for family". |
| **Authentik / Keycloak** | Overkill | Full-blown IdP platforms (Docker-centric, DB-backed). Way more than a family page needs. |
| **Roll your own OAuth in the app** | More work | Fine, but you'd reimplement session/CSRF handling. oauth2-proxy gives you this for any static page with zero app code. |

## How it would work (architecture)

```
Browser ──HTTPS──> nginx (lubu:8001)
                     │  auth_request → /oauth2/auth
                     ▼
              oauth2-proxy (127.0.0.1:4180)  ──OAuth/OIDC──> Google
                     │ 202 = allowed, 401 = redirect to Google login
                     ▼
              serves /home/woodmastr/code/web_sites/lubu.skale.dev/
              (only to family emails; everyone else gets login / 403)
```

- oauth2-proxy runs as a systemd service on 127.0.0.1:4180.
- nginx `location /` uses `auth_request /oauth2/auth;` + `error_page 401` redirect
  to the proxy's sign-in.
- Only the *family* pages get protected; existing public routes (restaurants,
  mdsites, firmenbuch, etc.) stay as they are unless you choose to protect them too.

## What you'd need to set up

1. A **Google Cloud OAuth 2.0 Client ID + secret** (free, at console.cloud.google.com)
   with the redirect URI pointing at the proxy's `/oauth2/callback` on lubu.skale.dev.
2. Download the oauth2-proxy binary (or build from source with Go 1.23 — already
   installed) and a small systemd unit.
3. An **allow-list file** of family Google email addresses.
4. A new nginx `location /oauth2/` block + `auth_request` on the protected paths.

## Open questions to confirm before building

- Which exact Google email addresses are "family"? (drives the allow-list)
- Should the *whole* lubu home page be protected, or just a `/family/` sub-path
  while the public hub stays open?
- Do you already have a Google Cloud project / OAuth client, or do we create one?
