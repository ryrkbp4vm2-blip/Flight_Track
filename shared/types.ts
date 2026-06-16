// Shared domain types for the Military Flight Tracker.
// Imported by both the Express server and the React web app.

/**
 * A single aircraft as returned by the airplanes.live `/v2/mil/` feed
 * (ADS-B Exchange v2 shape). Almost every field is optional — the feed omits
 * keys when data is unavailable, and some have unusual sentinel values
 * (e.g. `alt_baro` can be the string "ground"). Read everything defensively.
 */
export interface Aircraft {
  /** 24-bit ICAO address as 6 hex digits — the stable unique key. */
  hex: string;
  /** ADS-B message source/type, e.g. "adsb_icao". */
  type?: string;
  /** Callsign — often space-padded, trim before display. */
  flight?: string;
  /** Registration / tail number. */
  r?: string;
  /** Aircraft type code, e.g. "F16", "C130", "KC135". */
  t?: string;
  /** Barometric altitude in feet, or "ground" when on the surface. */
  alt_baro?: number | "ground";
  /** Geometric (GPS) altitude in feet. */
  alt_geom?: number;
  /** Ground speed in knots. */
  gs?: number;
  /** True track over ground in degrees — used to rotate the icon. */
  track?: number;
  /** Barometric vertical rate, feet/min. */
  baro_rate?: number;
  /** Transponder squawk code. */
  squawk?: string;
  /** Emergency status, e.g. "none", "general". */
  emergency?: string;
  /** Wake / category code, e.g. "A3". */
  category?: string;
  lat?: number;
  lon?: number;
  /** Seconds since the last message of any kind. */
  seen?: number;
  /** Seconds since the last positional message. */
  seen_pos?: number;
  /** Signal strength (dB). */
  rssi?: number;
}

/** Top-level response from `/v2/mil/`. */
export interface MilResponse {
  ac: Aircraft[];
  /** Server timestamp in ms. */
  now: number;
  /** Number of aircraft in `ac`. */
  total: number;
}

/** Health/diagnostics payload from the proxy. */
export interface HealthResponse {
  ok: boolean;
  /** ms epoch of the last successful upstream fetch, or null. */
  lastFetchedAt: number | null;
  /** Age of the cached data in ms, or null if never fetched. */
  ageMs: number | null;
  /** Last upstream error message, or null. */
  lastError: string | null;
  /** Aircraft count in the current cache. */
  total: number;
  /** True when the proxy is serving bundled sample data, not the live feed. */
  sample: boolean;
}

/** A single point in an aircraft's client-side trail. */
export interface TrackPoint {
  lat: number;
  lon: number;
  /** Altitude in feet (0 when on ground), or null when unknown. */
  alt: number | null;
  /** Client receive time in ms. */
  t: number;
}

/** An aircraft enriched with client-side bookkeeping. */
export interface TrackedAircraft extends Aircraft {
  /** Client time (ms) we last received a position for this aircraft. */
  lastSeen: number;
}

/**
 * A naval/maritime vessel, modeled on AIS fields. Used for military ship
 * tracking. Like aircraft, most fields can be absent depending on source.
 */
export interface Vessel {
  /** Maritime Mobile Service Identity — the stable unique key. */
  mmsi: string;
  name?: string;
  /** Radio callsign. */
  callsign?: string;
  lat?: number;
  lon?: number;
  /** Speed over ground, knots. */
  sog?: number;
  /** Course over ground, degrees. */
  cog?: number;
  /** True heading, degrees (used for icon rotation; falls back to cog). */
  heading?: number;
  /** Free-text vessel type, e.g. "Aircraft Carrier", "Destroyer". */
  type?: string;
  /** Operating navy / flag state, e.g. "USA", "UK". */
  country?: string;
  /** Pennant / hull number, e.g. "CVN-78". */
  hull?: string;
  /** AIS navigational status, e.g. "Under way using engine". */
  navStatus?: string;
  /** Length overall, meters. */
  length?: number;
  /** Seconds since the last position report. */
  seen_pos?: number;
}

export interface VesselResponse {
  vessels: Vessel[];
  now: number;
  total: number;
}

/** A vessel enriched with client-side bookkeeping. */
export interface TrackedVessel extends Vessel {
  lastSeen: number;
}
