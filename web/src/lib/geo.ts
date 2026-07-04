// Pure great-circle geometry helpers. No Leaflet dependency so they're unit-testable.

export interface LatLon {
  lat: number;
  lon: number;
}

const R_NM = 3440.065; // Earth radius in nautical miles
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance between two points, in nautical miles. */
export function haversineNm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a → b, in degrees (0–360, 0 = north). */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Great-circle destination: the point reached from `from` after travelling
 * `distanceNm` nautical miles along an initial `bearing` (degrees). Used for
 * dead-reckoning a contact's projected track.
 */
export function destinationPoint(from: LatLon, bearing: number, distanceNm: number): LatLon {
  const ang = distanceNm / R_NM; // angular distance in radians
  const brg = toRad(bearing);
  const lat1 = toRad(from.lat);
  const lon1 = toRad(from.lon);
  const sinLat2 =
    Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(brg);
  const lat2 = Math.asin(Math.min(1, Math.max(-1, sinLat2)));
  const y = Math.sin(brg) * Math.sin(ang) * Math.cos(lat1);
  const x = Math.cos(ang) - Math.sin(lat1) * sinLat2;
  const lon2 = lon1 + Math.atan2(y, x);
  // Normalise longitude to −180…180.
  return { lat: toDeg(lat2), lon: (((toDeg(lon2) + 540) % 360) - 180) };
}

/**
 * Dead-reckoned track ahead of a moving contact: the projected positions at
 * each `stepMin` interval up to `horizonMin`, assuming constant heading/speed.
 */
export function projectedTrack(
  from: LatLon,
  bearing: number,
  speedKt: number,
  horizonMin = 15,
  stepMin = 5,
): { minutes: number; point: LatLon }[] {
  const out: { minutes: number; point: LatLon }[] = [];
  for (let m = stepMin; m <= horizonMin; m += stepMin) {
    out.push({ minutes: m, point: destinationPoint(from, bearing, speedKt * (m / 60)) });
  }
  return out;
}

export const NM_TO_KM = 1.852;
