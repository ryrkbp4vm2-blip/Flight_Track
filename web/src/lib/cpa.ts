// Closest point of approach between two moving contacts, using a local
// flat-earth approximation (fine at tactical ranges) and constant velocity.
// Pure math — no store or Leaflet dependency — so it's unit-testable.

export interface MotionState {
  lat: number;
  lon: number;
  /** Ground speed, knots. */
  speedKt: number;
  /** Course over ground, degrees true. */
  headingDeg: number;
}

export interface CpaResult {
  /** Distance between the contacts right now, nm. */
  distanceNowNm: number;
  /** Separation at the closest point of approach, nm. */
  cpaNm: number;
  /** Minutes until CPA. 0 when the contacts are already at CPA/opening. */
  minutesToCpa: number;
  /** True when the range is currently decreasing. */
  closing: boolean;
}

const D2R = Math.PI / 180;

/**
 * Relative-motion CPA of `b` with respect to `a`. Returns null when either
 * contact has no usable velocity solution (both stationary ⇒ range is fixed).
 */
export function closestPointOfApproach(a: MotionState, b: MotionState): CpaResult | null {
  // Local east/north frame centered on `a`, in nautical miles.
  const midLat = ((a.lat + b.lat) / 2) * D2R;
  const rx = (b.lon - a.lon) * 60 * Math.cos(midLat);
  const ry = (b.lat - a.lat) * 60;

  // Velocities in nm/h (knots), heading measured clockwise from north.
  const vx = b.speedKt * Math.sin(b.headingDeg * D2R) - a.speedKt * Math.sin(a.headingDeg * D2R);
  const vy = b.speedKt * Math.cos(b.headingDeg * D2R) - a.speedKt * Math.cos(a.headingDeg * D2R);

  const distanceNowNm = Math.hypot(rx, ry);
  const vv = vx * vx + vy * vy;
  if (vv < 1e-9) return null; // no relative motion — separation never changes

  const tHours = -(rx * vx + ry * vy) / vv;
  if (tHours <= 0) {
    // CPA is in the past: the contacts are opening.
    return { distanceNowNm, cpaNm: distanceNowNm, minutesToCpa: 0, closing: false };
  }
  const cpaNm = Math.hypot(rx + vx * tHours, ry + vy * tHours);
  return { distanceNowNm, cpaNm, minutesToCpa: tHours * 60, closing: true };
}

/** CPA screening thresholds for the "converging" chip. */
export const CPA_MAX_MINUTES = 60;
export const CPA_MAX_NM = 20;

/** True when a CPA result is worth flagging in the UI. */
export function isConverging(r: CpaResult | null): r is CpaResult {
  return (
    r !== null &&
    r.closing &&
    r.minutesToCpa <= CPA_MAX_MINUTES &&
    r.cpaNm <= CPA_MAX_NM &&
    // It must be a real approach, not a graze at effectively current range.
    r.cpaNm < r.distanceNowNm * 0.95
  );
}
