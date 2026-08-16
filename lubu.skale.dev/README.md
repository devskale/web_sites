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
