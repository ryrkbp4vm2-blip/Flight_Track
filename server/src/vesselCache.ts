import { config } from "./config.js";
import { BASE_VESSELS } from "./vesselSample.js";
import { startAisStream, getAisVessels, getAisError } from "./aisStream.js";
import type { Vessel, VesselResponse } from "../../shared/types.js";

/**
 * Vessel feed cache. If `vesselsUpstreamUrl` is configured it polls that AIS
 * source; otherwise it serves the curated BASE_VESSELS with simulated movement
 * (dead-reckoning from each ship's course/speed with a gentle heading drift) so
 * the map shows live motion and trails build up.
 */
interface CacheState {
  data: VesselResponse | null;
  fetchedAt: number | null;
  lastError: string | null;
  sample: boolean;
}

const state: CacheState = { data: null, fetchedAt: null, lastError: null, sample: false };
const EPOCH = Date.now();
let fetching = false;
let timer: NodeJS.Timeout | null = null;

/** Knots → degrees of latitude per second. 1 kn = 1/60 nm-deg per hour. */
const KN_TO_DEG_PER_S = 1 / 60 / 3600;

/** Advance the curated vessels along their courses for the elapsed time. */
function simulate(): VesselResponse {
  const elapsed = (Date.now() - EPOCH) / 1000; // seconds
  const vessels: Vessel[] = BASE_VESSELS.map((v) => {
    const baseCog = v.cog ?? 0;
    const sog = v.sog ?? 0;
    // Gentle S-curve so ships stay near their area and trails look natural.
    const cog = baseCog + 18 * Math.sin(elapsed / 700 + (v.lat ?? 0));
    const rad = (cog * Math.PI) / 180;
    const distDeg = sog * KN_TO_DEG_PER_S * elapsed;
    const lat0 = v.lat ?? 0;
    const lat = lat0 + Math.cos(rad) * distDeg;
    const lon = (v.lon ?? 0) + (Math.sin(rad) * distDeg) / Math.cos((lat0 * Math.PI) / 180);
    return {
      ...v,
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      cog: Number(((cog % 360) + 360) % 360),
      heading: Number(((cog % 360) + 360) % 360),
      seen_pos: 0,
    };
  });
  return { vessels, now: Date.now(), total: vessels.length };
}

async function pollOnce(): Promise<void> {
  // Live aisstream.io feed takes precedence when a key is configured.
  if (config.aisApiKey) {
    const vessels = getAisVessels();
    state.data = { vessels, now: Date.now(), total: vessels.length };
    state.fetchedAt = Date.now();
    state.sample = false;
    state.lastError = getAisError();
    return;
  }

  // No upstream configured → serve the simulated curated fleet.
  if (!config.vesselsUpstreamUrl) {
    state.data = simulate();
    state.fetchedAt = Date.now();
    state.sample = true;
    state.lastError = null;
    return;
  }

  if (fetching) return;
  fetching = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fetchTimeoutMs);
  try {
    const res = await fetch(config.vesselsUpstreamUrl, {
      headers: { "User-Agent": config.userAgent, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`vessels upstream ${res.status} ${res.statusText}`);
    const json = (await res.json()) as Partial<VesselResponse>;
    const vessels = Array.isArray(json.vessels) ? json.vessels : [];
    state.data = { vessels, now: json.now ?? Date.now(), total: json.total ?? vessels.length };
    state.fetchedAt = Date.now();
    state.lastError = null;
    state.sample = false;
  } catch (err) {
    state.lastError = err instanceof Error ? err.message : String(err);
    if (state.data === null) {
      state.data = simulate();
      state.fetchedAt = Date.now();
      state.sample = true;
    }
  } finally {
    clearTimeout(timeout);
    fetching = false;
  }
}

export function startVesselPolling(): void {
  if (timer) return;
  startAisStream();
  void pollOnce();
  timer = setInterval(() => void pollOnce(), config.pollIntervalMs);
  timer.unref?.();
}

export function getVessels(): VesselResponse {
  return state.data ?? { vessels: [], now: Date.now(), total: 0 };
}

export function getVesselHealth() {
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
