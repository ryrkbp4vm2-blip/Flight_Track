// Pure unit-conversion / formatting helpers. No React or Leaflet dependency so
// they stay unit-testable. Canonical inputs mirror the feed: altitude in feet,
// speed in knots, distance in nautical miles, vertical rate in feet/min, ship
// length in metres. The chosen UnitSystem decides how each is rendered.

import { NM_TO_KM } from "./geo";

/** Unit system for altitude / speed / distance display. */
export type UnitSystem = "aviation" | "metric" | "imperial";

/** Selectable systems with short labels + hints for the settings UI. */
export const UNIT_SYSTEMS: { key: UnitSystem; label: string; hint: string }[] = [
  { key: "aviation", label: "Aviation", hint: "ft · kt · nm" },
  { key: "metric", label: "Metric", hint: "m · km/h · km" },
  { key: "imperial", label: "Imperial", hint: "ft · mph · mi" },
];

const M_PER_FT = 0.3048;
const KMH_PER_KT = 1.852;
const MPH_PER_KT = 1.150779;
const NM_TO_MI = 1.150779;

const round = (v: number) => Math.round(v).toLocaleString();

/** Format an altitude given in feet. */
export function formatAltitude(ft: number, sys: UnitSystem): string {
  return sys === "metric" ? `${round(ft * M_PER_FT)} m` : `${round(ft)} ft`;
}

/** Format a speed given in knots. */
export function formatSpeed(kt: number, sys: UnitSystem): string {
  if (sys === "metric") return `${round(kt * KMH_PER_KT)} km/h`;
  if (sys === "imperial") return `${round(kt * MPH_PER_KT)} mph`;
  return `${round(kt)} kt`;
}

/** Format a vertical rate given in feet/min (caller handles the level/0 case). */
export function formatVerticalRate(ftmin: number, sys: UnitSystem): string {
  const arrow = ftmin > 0 ? "▲" : "▼";
  if (sys === "metric") {
    return `${arrow} ${((Math.abs(ftmin) * M_PER_FT) / 60).toFixed(1)} m/s`;
  }
  return `${arrow} ${Math.abs(ftmin).toLocaleString()} ft/min`;
}

/** Format a distance given in nautical miles. */
export function formatDistance(nm: number, sys: UnitSystem): string {
  const val = sys === "metric" ? nm * NM_TO_KM : sys === "imperial" ? nm * NM_TO_MI : nm;
  const unit = sys === "metric" ? "km" : sys === "imperial" ? "mi" : "nm";
  const f = val >= 100 ? Math.round(val).toLocaleString() : val.toFixed(1);
  return `${f} ${unit}`;
}

/** Format a ship length given in metres. */
export function formatLength(m: number, sys: UnitSystem): string {
  return sys === "imperial" ? `${round(m / M_PER_FT)} ft` : `${round(m)} m`;
}

/**
 * Concentric range-ring set for a unit system: nice round numbers in the
 * displayed unit, with the physical radius carried in nautical miles.
 */
export function rangeRingSet(sys: UnitSystem): { nm: number; label: string }[] {
  if (sys === "metric") {
    return [50, 100, 200, 500].map((km) => ({ nm: km / NM_TO_KM, label: `${km} km` }));
  }
  if (sys === "imperial") {
    return [50, 100, 200, 500].map((mi) => ({ nm: mi / NM_TO_MI, label: `${mi} mi` }));
  }
  return [50, 100, 200, 400].map((nm) => ({ nm, label: `${nm} nm` }));
}
