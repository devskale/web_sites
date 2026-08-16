# lubu.skale.dev — landing page

This folder is the **source of truth** for the lubu.skale.dev landing page.
It is served **directly from this directory** by nginx — no build step, no copy needed.

- Live URL: `https://lubu.skale.dev` (port 8001)
- Served from: this folder (`/home/woodmastr/code/web_sites/lubu.skale.dev/`)
- Backend: nginx virtual host at `/etc/nginx/sites-enabled/lubu.skale.dev`

---

## The most important thing: permissions

nginx runs as `www-data`. The whole path from `/` down to this folder **must stay
traversable and readable** by that user. If you tighten permissions on your home
dir or this folder, the site breaks.

Required perms (current state):
- every parent dir: world-executable (`drwxr-xr-x` or `drwxr-x--x` is fine)
- `index.html` and any new files: world-readable (`-rw-r--r--`)

Quick check:
```bash
namei -l /home/woodmastr/code/web_sites/lubu.skale.dev/index.html
sudo -u www-data cat /home/woodmastr/code/web_sites/lubu.skale.dev/index.html >/dev/null && echo OK
```

---

## How to change the site

1. Edit `index.html` here (or add new files in this folder).
2. Test locally:
   ```bash
   curl -sk https://localhost:8001/ -H "Host: lubu.skale.dev"
   ```
   (nginx serves this folder directly, so no reload is needed for content changes.)
3. Commit + push so the change is version-controlled:
   ```bash
   git add -A
   git commit -m "describe your change"
   git push
   ```

That's it — the change is **live immediately** after you save the file, because
nginx reads straight from this directory. The git push is just for history/backup.

---

## If you change nginx config (add a route, new app, etc.)

The nginx config is NOT in this repo — it's at `/etc/nginx/sites-enabled/lubu.skale.dev`.

After editing it, you must test + reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

Add any new static folders the same way this one is wired up
(`root /home/woodmastr/code/web_sites/lubu.skale.dev;`).

---

## Adding new assets (images, css, js)

Just drop them in this folder and reference them relatively, e.g. `/style.css`.
Keep them world-readable (see permissions above). Commit them with the rest.

---

## Workflow summary

| Task | Command |
|------|---------|
| Edit content | edit files here — **live immediately** |
| Save history | `git add -A && git commit -m "..." && git push` |
| Verify serving | `curl -sk https://localhost:8001/ -H "Host: lubu.skale.dev"` |
| Check perms | `namei -l .../index.html` |
| nginx config change | edit `/etc/nginx/sites-enabled/lubu.skale.dev`, then `sudo nginx -t && sudo systemctl reload nginx` |

---

## Google login for family pages (/family/)

The `/family/` area on lubu.skale.dev is protected by **Google login** via
[oauth2-proxy](https://oauth2-proxy.github.io/oauth2-proxy/) (MIT, free, open source).

Only family members whose Google email is in the allow-list can view those pages.
Everything else on the hub stays public.

### Architecture
```
Browser → nginx (lubu:8001) ─ auth_request → oauth2-proxy (127.0.0.1:4180) → Google
              └─ /family/ served only to allow-listed emails
```

### Config files (all root-owned, NOT in git)
| File | Purpose |
|------|---------|
| `/etc/oauth2-proxy/oauth2-proxy.cfg` | main oauth2-proxy config (client id/secret, scopes) |
| `/etc/oauth2-proxy/authenticated_emails.txt` | family email allow-list (one per line) — **live-reloaded, no restart** |
| `/etc/oauth2-proxy/cookie_secret` | random 32-byte cookie signing key |
| `/etc/systemd/system/oauth2-proxy.service` | systemd unit |
| `/etc/nginx/sites-enabled/lubu.skale.dev` | nginx vhost with the `/oauth2/` + `/family/` blocks |

### To add/remove a family member
Edit `/etc/oauth2-proxy/authenticated_emails.txt` (one email per line). It's watched
and reloaded automatically — no restart needed.

### To change Google app / scopes
Edit `/etc/oauth2-proxy/oauth2-proxy.cfg`, then:
```bash
sudo systemctl restart oauth2-proxy
```

### Useful commands
```bash
sudo systemctl status oauth2-proxy     # is it running?
sudo journalctl -u oauth2-proxy -f     # watch auth logs
sudo systemctl restart oauth2-proxy    # after config change
sudo nginx -t && sudo systemctl reload nginx
```

### Manual-approval workflow (watch attempts, then allow)

Instead of pre-listing everyone, you can **watch login attempts live** and approve
people by adding their email when they try to log in.

```bash
sudo oauth2-approve watch     # follow login attempts live (Ctrl-C to stop)
sudo oauth2-approve attempts  # show the last 50 attempts (incl. denied)
sudo oauth2-approve list      # show the allow-list
sudo oauth2-approve add mom@gmail.com     # approve (live, no restart)
sudo oauth2-approve remove mom@gmail.com  # revoke (live, no restart)
```

- A family member **not yet allowed** shows up in the log as `[AuthFailure]` with
  their email. Copy it, run `sudo oauth2-approve add <email>`, and they're in —
  no restart. The allow-list is hot-reloaded by oauth2-proxy.
- Statuses: `AuthSuccess` = allowed, `AuthFailure` = denied (not in list),
  `AuthError` = something went wrong during the OAuth exchange.
- Raw logs anytime: `sudo journalctl -u oauth2-proxy -f`
