# Deploying Military Flight Tracker

The app is one Node service: it builds the PWA (`web/dist`) and the Express
server serves both the static app and the proxy API on a single port. Any host
that runs a Node web service or a Dockerfile will work. Pick one below.

The server listens on `PORT` (injected by every host) and exposes a health
check at **`/api/health`**.

---

## Option A — Render (easiest, free tier)

This repo includes [`render.yaml`](./render.yaml), a Render Blueprint.

1. Push this branch to GitHub (already done).
2. Go to <https://dashboard.render.com> → **New → Blueprint**.
3. Connect the repo and select this branch. Render reads `render.yaml`,
   creates the web service, and deploys.
4. When it's live you'll get a URL like `https://miltrack.onrender.com`.

No build config needed — the Blueprint sets build (`npm ci && npm run build`),
start (`npm start`), the health check, and Node 22.

> Free instances sleep after inactivity and cold-start in ~30s on first hit.

## Option B — Railway

1. <https://railway.app> → **New Project → Deploy from GitHub repo**.
2. Railway autodetects Node. Set:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
3. Deploy, then open the generated domain (Settings → Networking → Generate Domain).

## Option C — Fly.io (Docker)

Uses the included [`Dockerfile`](./Dockerfile).

```bash
brew install flyctl          # or see fly.io/docs/hands-on/install-flyctl
fly auth login
fly launch --no-deploy       # accept the Dockerfile; pick a region
fly deploy
fly open
```

## Option D — Any Docker host

```bash
docker build -t miltrack .
docker run -p 3001:3001 miltrack
# open http://localhost:3001
```

---

## Environment variables (all optional)

| Variable               | Default                              | Purpose                                   |
| ---------------------- | ------------------------------------ | ----------------------------------------- |
| `PORT`                 | `3001`                               | Set by the host automatically             |
| `UPSTREAM_URL`         | `https://api.airplanes.live/v2/mil/` | Military aircraft feed (ADS-B Exchange v2) |
| `VESSELS_UPSTREAM_URL` | _(unset)_                            | Live vessel feed returning `{ vessels: [] }` |
| `AISSTREAM_API_KEY`    | _(unset)_                            | Live military AIS via aisstream.io        |
| `USE_SAMPLE_DATA`      | _(off)_                              | Set `1` to serve bundled sample aircraft  |

If a host's network blocks `api.airplanes.live`, set `USE_SAMPLE_DATA=1` so the
app still demonstrates with bundled data.

---

## Install on your phone (no app store)

Once you have a live URL:

- **iOS (Safari):** open the URL → Share → **Add to Home Screen**.
- **Android (Chrome):** open the URL → ⋮ menu → **Install app** / **Add to Home Screen**.

It launches full-screen like a native app and works offline for the app shell
(live data always requires a connection).
