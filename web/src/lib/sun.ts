// Pure solar-position helpers for the day/night terminator overlay. Low-precision
// NOAA-style formulas — accurate to a fraction of a degree, which is plenty for a
// map shade. Everything is UTC (driven by Date.getTime), so it's deterministic
// and unit-testable regardless of the host timezone.

import type { LatLon } from "./geo";

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

/** Greenwich Mean Sidereal Time in degrees (0–360). */
function gmstDeg(jd: number): number {
  const d = jd - 2451545.0;
  let hours = (18.697374558 + 24.06570982441908 * d) % 24;
  if (hours < 0) hours += 24;
  return (hours * 15) % 360;
}

interface EqPos {
  /** Right ascension, degrees. */
  alpha: number;
  /** Declination, degrees. */
  delta: number;
}

function sunEquatorial(jd: number): EqPos {
  const n = jd - 2451545.0;
  let L = (280.46 + 0.9856474 * n) % 360; // mean longitude
  let g = (357.528 + 0.9856003 * n) % 360; // mean anomaly
  if (L < 0) L += 360;
  if (g < 0) g += 360;
  const lambda = L + 1.915 * Math.sin(g * D2R) + 0.02 * Math.sin(2 * g * D2R); // ecliptic longitude
  const eps = 23.439 - 0.0000004 * n; // obliquity of the ecliptic
  const alpha =
    Math.atan2(Math.cos(eps * D2R) * Math.sin(lambda * D2R), Math.cos(lambda * D2R)) * R2D;
  const delta = Math.asin(Math.sin(eps * D2R) * Math.sin(lambda * D2R)) * R2D;
  return { alpha, delta };
}

export interface SolarPosition {
  /** Solar declination, degrees (latitude of the subsolar point). */
  declination: number;
  /** Longitude where the sun is directly overhead, −180…180. */
  subsolarLon: number;
}

export function solarPosition(date: Date): SolarPosition {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const lon = ((alpha - gmstDeg(jd) + 540) % 360) - 180; // hour angle 0 ⇒ subsolar meridian
  return { declination: delta, subsolarLon: lon };
}

/** The point on Earth where the sun is directly overhead. */
export function subsolarPoint(date: Date): LatLon {
  const { declination, subsolarLon } = solarPosition(date);
  return { lat: declination, lon: subsolarLon };
}

/**
 * The day/night terminator as a latitude curve sampled across all longitudes,
 * plus which pole lies in darkness (the hemisphere opposite the sun).
 */
export function terminator(
  date: Date,
  stepDeg = 2,
): { curve: LatLon[]; nightCapLat: 90 | -90 } {
  const jd = julianDay(date);
  const { alpha, delta } = sunEquatorial(jd);
  const gst = gmstDeg(jd);
  const curve: LatLon[] = [];
  for (let lon = -180; lon <= 180; lon += stepDeg) {
    const ha = (gst + lon - alpha) * D2R; // hour angle at this longitude
    const lat = Math.atan(-Math.cos(ha) / Math.tan(delta * D2R)) * R2D;
    curve.push({ lat, lon });
  }
  // Sun over the northern hemisphere (declination > 0) ⇒ the south pole is dark.
  return { curve, nightCapLat: delta > 0 ? -90 : 90 };
}
