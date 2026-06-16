# Military Flight Tracker

A Progressive Web App that shows **live military aircraft worldwide** on a dark
map. Works in the browser on iOS (Safari) and Android (Chrome) and installs to
the home screen — no app stores.

![status](https://img.shields.io/badge/status-MVP-blue)

## Features

- 🌍 Full-screen dark world map (CARTO basemap) with live military aircraft
- ✈️ Rotating plane icons colored by altitude, auto-refreshing every few seconds
- 👆 Tap an aircraft for details: callsign, type, registration, hex, squawk,
  altitude, vertical rate, speed, heading, position
- 🔎 Search/filter by callsign, type, hex, or registration
- 📋 Sortable list view of all tracked aircraft
- 🛰️ Per-aircraft flight trails (selected by default, or show all)
- 📲 Installable PWA with offline app shell

## How it works

```
airplanes.live /v2/mil/  ──(server polls ≤1×/2s)──►  Express proxy + cache
                                                          │  GET /api/mil
                                          same-origin     ▼
                            React PWA  ◄── (no CORS, no rate-limit risk)
```

A single Node/Express server polls the free [airplanes.live](https://airplanes.live)
military feed, caches it in memory, and serves both the cached data (`/api/mil`)
and the built PWA. The browser only ever talks to our own origin, so there's no
CORS issue and the upstream sees at most one request every couple of seconds no
matter how many users are connected (staying under its 1 req/sec limit).

## Getting started

```bash
npm install        # installs web + server workspaces
npm run dev        # Express on :3001, Vite on :5173 (open the Vite URL)
```

Then open http://localhost:5173.

### No outbound access to the data feed?

Some sandboxed/corporate networks block `api.airplanes.live`. Run with bundled
sample data so the whole UI is still demonstrable:

```bash
USE_SAMPLE_DATA=1 npm run dev
```

A `SAMPLE DATA` badge appears in the status bar when this is active.

## Production build

```bash
npm run build      # builds the PWA into web/dist
npm start          # single server serves the PWA + proxy on :3001
```

Open http://localhost:3001. On a phone (same network) use "Add to Home Screen".

## Configuration (env vars)

| Variable           | Default                                  | Purpose                              |
| ------------------ | ---------------------------------------- | ------------------------------------ |
| `PORT`             | `3001`                                   | Server port                          |
| `UPSTREAM_URL`     | `https://api.airplanes.live/v2/mil/`     | Aircraft feed (ADS-B Exchange v2)    |
| `POLL_INTERVAL_MS` | `2000`                                   | Upstream poll interval               |
| `USE_SAMPLE_DATA`  | _(off)_ set `1`                          | Serve bundled sample data on failure |

The upstream is swappable for any ADS-B Exchange v2-compatible feed (e.g.
adsb.fi) via `UPSTREAM_URL`.

## Project layout

```
shared/types.ts     Domain types shared by server + web
server/src/         Express proxy: milCache (poller), index (routes + static)
web/src/
  map/              MapView, AircraftLayer (imperative markers), TrailsLayer
  store/            Zustand store + selectors
  components/       SearchBar, DetailPanel, AircraftList, StatusBar
  hooks/usePolling  Visibility-aware poll loop
```

## Data & attribution

Aircraft data © [airplanes.live](https://airplanes.live) (free, non-commercial).
Basemap © OpenStreetMap contributors © CARTO.
