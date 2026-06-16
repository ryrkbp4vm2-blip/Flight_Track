// Server configuration, overridable via environment variables.

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  /** Port the Express server listens on. */
  port: num("PORT", 3001),

  /** Upstream military aircraft feed (ADS-B Exchange v2 schema). */
  upstreamUrl: process.env.UPSTREAM_URL ?? "https://api.airplanes.live/v2/mil/",

  /**
   * Optional upstream feed for military vessels (AIS). There is no free
   * "military vessels only" feed, so when this is unset the server serves a
   * curated set of notable navy vessels with simulated movement. Set this to a
   * source returning `{ vessels: [...] }` to use live AIS data.
   */
  vesselsUpstreamUrl: process.env.VESSELS_UPSTREAM_URL ?? "",

  /**
   * How often the server polls upstream, in ms. The free airplanes.live API is
   * rate-limited to 1 req/sec; we stay comfortably under it. A single shared
   * poller means client count never affects upstream load.
   */
  pollIntervalMs: num("POLL_INTERVAL_MS", 2000),

  /** Timeout for a single upstream fetch, in ms. */
  fetchTimeoutMs: num("FETCH_TIMEOUT_MS", 12000),

  /** User-Agent sent upstream — good-citizen identification for a free API. */
  userAgent:
    process.env.UPSTREAM_USER_AGENT ??
    "FlightTrack/0.1 (military flight tracker; +https://github.com/airplanes-live)",

  /**
   * When true, the server seeds its cache with bundled sample data and serves
   * it whenever the live feed has never succeeded. Lets the app be demoed in
   * environments without outbound access to the upstream API. Off by default.
   */
  useSampleData: process.env.USE_SAMPLE_DATA === "1",
};
