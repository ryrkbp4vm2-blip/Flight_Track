import type { MilResponse } from "../../shared/types.js";

/**
 * Bundled sample of military aircraft used only when `USE_SAMPLE_DATA=1` and
 * the live feed is unreachable. Shapes mirror the airplanes.live `/v2/mil/`
 * feed so the full client pipeline (map, detail, list, trails) can be
 * exercised without outbound network access. Positions are spread worldwide
 * and dead-reckoned from each aircraft's track/speed (with a gentle altitude
 * oscillation) so trails and the altitude profile build up over time.
 */
const BASE_AIRCRAFT = [
  { hex: "ae1234", flight: "RCH285 ", t: "C17", r: "08-8201", alt_baro: 33000, gs: 451, track: 78, squawk: "1234", lat: 38.95, lon: -77.46, category: "A5", type: "adsb_icao" },
  { hex: "ae5d29", flight: "PLF21  ", t: "C130", r: "62-1863", alt_baro: 24000, gs: 286, track: 152, squawk: "4517", lat: 36.12, lon: -115.18, category: "A4", type: "adsb_icao" },
  { hex: " adfd09".trim(), flight: "REAP31 ", t: "MQ9", alt_baro: 18500, gs: 190, track: 245, squawk: "6112", lat: 32.6, lon: -97.05, category: "B1", type: "adsb_icao" },
  { hex: "43c801", flight: "RRR7211", t: "A400", r: "ZM415", alt_baro: 28000, gs: 372, track: 105, squawk: "3401", lat: 51.15, lon: -1.57, category: "A5", type: "adsb_icao" },
  { hex: "3fbe88", flight: "GAF642 ", t: "A332", r: "10+27", alt_baro: 37000, gs: 478, track: 92, squawk: "2200", lat: 50.04, lon: 8.56, category: "A5", type: "adsb_icao" },
  { hex: "738a51", flight: "IAF7    ", t: "C30J", alt_baro: 22000, gs: 305, track: 200, squawk: "5566", lat: 28.56, lon: 77.1, category: "A4", type: "adsb_icao" },
  { hex: "7c6def", flight: "ASY305 ", t: "P8", r: "A47-005", alt_baro: 15000, gs: 410, track: 33, squawk: "1100", lat: -33.95, lon: 151.18, category: "A3", type: "adsb_icao" },
  { hex: "ae08c4", flight: "KNIFE71", t: "KC135", r: "63-8025", alt_baro: 30000, gs: 430, track: 270, squawk: "4012", lat: 39.05, lon: -104.7, category: "A5", type: "adsb_icao" },
  { hex: "ae4a1b", flight: "VADER01", t: "F22", alt_baro: 41000, gs: 540, track: 318, squawk: "7001", lat: 64.84, lon: -147.72, category: "A1", type: "adsb_icao" },
  { hex: "06a0f3", flight: "QID11  ", t: "C17", r: "A7-MAB", alt_baro: 35000, gs: 462, track: 128, squawk: "3320", lat: 25.27, lon: 51.61, category: "A5", type: "adsb_icao" },
  { hex: "3998b2", flight: "FNF4501", t: "RFAL", r: "4-HG", alt_baro: 26000, gs: 488, track: 60, squawk: "2710", lat: 43.55, lon: 1.37, category: "A1", type: "adsb_icao" },
  { hex: "8a02d7", flight: "IFC123 ", t: "B738", alt_baro: "ground" as const, gs: 8, track: 45, squawk: "1000", lat: 35.55, lon: 139.78, category: "A3", type: "adsb_icao" },
  { hex: "ae6f10", flight: "DUSTOFF", t: "H60", r: "16-20801", alt_baro: 1200, gs: 120, track: 215, squawk: "5140", lat: 35.13, lon: -79.01, category: "A7", type: "adsb_icao" },
  { hex: "3c4d22", flight: "GAM77  ", t: "EC35", alt_baro: 800, gs: 95, track: 140, squawk: "3677", lat: 48.13, lon: 11.55, category: "A7", type: "adsb_icao" },
  { hex: "a1b2c3", flight: "RES911 ", t: "C130", r: "64-0512", alt_baro: 9000, gs: 240, track: 95, squawk: "7700", emergency: "general", lat: 30.2, lon: -85.7, category: "A4", type: "adsb_icao" },
];

/** Simulation start; movement is dead-reckoned from here. */
export const SAMPLE_EPOCH = Date.now();

/** Knots → degrees of latitude per second. */
const KN_TO_DEG_PER_S = 1 / 60 / 3600;
/** Altitude oscillation: ±1,500 ft over a ~30-minute cycle. */
const ALT_AMPLITUDE_FT = 1500;
const ALT_PERIOD_S = 300;

export function buildSample(now: number = Date.now()): MilResponse {
  const elapsed = (now - SAMPLE_EPOCH) / 1000; // seconds
  const ac = BASE_AIRCRAFT.map((a) => {
    // Slow ±8° weave keeps aircraft near their theater while trails look flown.
    const track = ((a.track + 8 * Math.sin(elapsed / 500 + a.lat) + 360) % 360);
    const rad = (track * Math.PI) / 180;
    const distDeg = a.gs * KN_TO_DEG_PER_S * elapsed;
    const lat = a.lat + Math.cos(rad) * distDeg;
    const lon = a.lon + (Math.sin(rad) * distDeg) / Math.cos((a.lat * Math.PI) / 180);

    const phase = elapsed / ALT_PERIOD_S + a.lon;
    const airborne = typeof a.alt_baro === "number";
    const alt_baro = airborne
      ? Math.max(500, Math.round(((a.alt_baro as number) + ALT_AMPLITUDE_FT * Math.sin(phase)) / 25) * 25)
      : a.alt_baro;
    // Vertical rate is the oscillation's derivative, in ft/min.
    const baro_rate = airborne
      ? Math.round(((ALT_AMPLITUDE_FT * Math.cos(phase)) / ALT_PERIOD_S) * 60 / 5) * 5
      : 0;

    return {
      ...a,
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      track: Number(track.toFixed(1)),
      alt_baro,
      baro_rate,
      seen: 0,
      seen_pos: 0,
    };
  });
  return { ac, now, total: ac.length };
}
