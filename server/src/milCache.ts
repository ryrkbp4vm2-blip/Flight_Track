import { config } from "./config.js";
import { buildSample } from "./sampleData.js";
import type { MilResponse } from "../../shared/types.js";

/**
 * Single in-memory cache of the latest military feed. A lone timer is the only
 * caller of the upstream API, so the upstream sees at most one request per
 * `pollIntervalMs` regardless of how many browser clients are connected — this
 * is what keeps us safely under the 1 req/sec rate limit and avoids browser
 * CORS entirely (the only upstream call is server-to-server).
 */
interface CacheState {
  data: MilResponse | null;
  fetchedAt: number | null;
  lastError: string | null;
  /** True when `data` is bundled sample data rather than the live feed. */
  sample: boolean;
}

const state: CacheState = {
  data: null,
  fetchedAt: null,
  lastError: null,
  sample: false,
};

let fetching = false;
let timer: NodeJS.Timeout | null = null;

async function pollOnce(): Promise<void> {
  // Guard against overlapping fetches if upstream is slow.
  if (fetching) return;
  fetching = true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fetchTimeoutMs);

  try {
    const res = await fetch(config.upstreamUrl, {
      headers: { "User-Agent": config.userAgent, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`upstream ${res.status} ${res.statusText}`);

    const json = (await res.json()) as Partial<MilResponse>;
    const ac = Array.isArray(json.ac) ? json.ac : [];
    state.data = {
      ac,
      now: typeof json.now === "number" ? json.now : Date.now(),
      total: typeof json.total === "number" ? json.total : ac.length,
    };
    state.fetchedAt = Date.now();
    state.lastError = null;
    state.sample = false;
  } catch (err) {
    // Keep serving the last good payload; just record the error.
    state.lastError = err instanceof Error ? err.message : String(err);
    // If we've never had real data and sample mode is on, seed the sample so
    // the app is demonstrable in restricted environments.
    if (config.useSampleData && (state.data === null || state.sample)) {
      state.data = buildSample();
      state.fetchedAt = Date.now();
      state.sample = true;
    }
  } finally {
    clearTimeout(timeout);
    fetching = false;
  }
}

/** Start the background poll loop. Safe to call once at startup. */
export function startPolling(): void {
  if (timer) return;
  // Seed immediately in sample mode so the first request has data even before
  // the first (likely failing) upstream attempt resolves.
  if (config.useSampleData && state.data === null) {
    state.data = buildSample();
    state.fetchedAt = Date.now();
    state.sample = true;
  }
  void pollOnce();
  timer = setInterval(() => void pollOnce(), config.pollIntervalMs);
  // Don't keep the process alive solely for the poll timer.
  timer.unref?.();
}

/** The latest cached feed, or an empty payload if nothing has loaded yet. */
export function getMil(): MilResponse {
  return state.data ?? { ac: [], now: Date.now(), total: 0 };
}

/** Diagnostics for the `/api/health` endpoint. */
export function getHealth() {
  const ageMs = state.fetchedAt === null ? null : Date.now() - state.fetchedAt;
  return {
    ok: state.data !== null,
    lastFetchedAt: state.fetchedAt,
    ageMs,
    lastError: state.lastError,
    total: state.data?.total ?? 0,
    sample: state.sample,
  };
}
