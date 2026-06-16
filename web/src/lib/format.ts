import type { Aircraft } from "../../../shared/types";

/** Trimmed callsign, falling back to registration then hex. */
export function callsign(ac: Aircraft): string {
  const f = ac.flight?.trim();
  if (f) return f;
  if (ac.r) return ac.r;
  return ac.hex.toUpperCase();
}

/** Numeric barometric altitude in feet; "ground" → 0, missing → null. */
export function altitudeFt(ac: Aircraft): number | null {
  if (ac.alt_baro === "ground") return 0;
  if (typeof ac.alt_baro === "number") return ac.alt_baro;
  if (typeof ac.alt_geom === "number") return ac.alt_geom;
  return null;
}

export function formatAltitude(ac: Aircraft): string {
  if (ac.alt_baro === "ground") return "Ground";
  const a = altitudeFt(ac);
  return a === null ? "—" : `${a.toLocaleString()} ft`;
}

export function formatSpeed(ac: Aircraft): string {
  return typeof ac.gs === "number" ? `${Math.round(ac.gs)} kt` : "—";
}

export function formatHeading(ac: Aircraft): string {
  return typeof ac.track === "number" ? `${Math.round(ac.track)}°` : "—";
}

export function formatVerticalRate(ac: Aircraft): string {
  if (typeof ac.baro_rate !== "number" || ac.baro_rate === 0) return "Level";
  const arrow = ac.baro_rate > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(ac.baro_rate).toLocaleString()} ft/min`;
}

export function formatPosition(ac: Aircraft): string {
  if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return "—";
  return `${ac.lat.toFixed(3)}, ${ac.lon.toFixed(3)}`;
}

/** True when the aircraft has a usable map position. */
export function hasPosition<T extends Aircraft>(
  ac: T,
): ac is T & { lat: number; lon: number } {
  return typeof ac.lat === "number" && typeof ac.lon === "number";
}

/** Human-friendly age string for a millisecond duration. */
export function formatAge(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s ago`;
}
