import type { Aircraft } from "../../../shared/types";
import {
  formatAltitude as fmtAltitude,
  formatSpeed as fmtSpeed,
  formatVerticalRate as fmtVertical,
  type UnitSystem,
} from "./units";
import { formatCoords, type CoordFormat } from "./coords";

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

export function formatAltitude(ac: Aircraft, sys: UnitSystem = "aviation"): string {
  if (ac.alt_baro === "ground") return "Ground";
  const a = altitudeFt(ac);
  return a === null ? "—" : fmtAltitude(a, sys);
}

export function formatSpeed(ac: Aircraft, sys: UnitSystem = "aviation"): string {
  return typeof ac.gs === "number" ? fmtSpeed(ac.gs, sys) : "—";
}

export function formatHeading(ac: Aircraft): string {
  return typeof ac.track === "number" ? `${Math.round(ac.track)}°` : "—";
}

export function formatVerticalRate(ac: Aircraft, sys: UnitSystem = "aviation"): string {
  if (typeof ac.baro_rate !== "number" || ac.baro_rate === 0) return "Level";
  return fmtVertical(ac.baro_rate, sys);
}

export function formatPosition(ac: Aircraft, fmt: CoordFormat = "decimal"): string {
  if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return "—";
  return formatCoords(ac.lat, ac.lon, fmt);
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
