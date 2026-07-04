// Pure helpers for time-scrub playback: clip a trail to a moment and
// interpolate a contact's position at that moment from its trail buffer.

import type { TrackPoint } from "../../../shared/types";
import type { LatLon } from "./geo";

/** Seconds of history the playback slider can rewind. */
export const PLAYBACK_WINDOW_S = 300;

/** The trail points recorded at or before `tMs`. */
export function clipTrail(pts: TrackPoint[], tMs: number): TrackPoint[] {
  let end = pts.length;
  while (end > 0 && pts[end - 1].t > tMs) end--;
  return pts.slice(0, end);
}

/**
 * Where the contact was at `tMs`, linearly interpolated between the two
 * bracketing trail points. Clamps to the newest point for future times and
 * returns null before the first record (the contact wasn't tracked yet).
 */
export function positionAt(pts: TrackPoint[], tMs: number): LatLon | null {
  if (pts.length === 0 || tMs < pts[0].t) return null;
  const last = pts[pts.length - 1];
  if (tMs >= last.t) return { lat: last.lat, lon: last.lon };
  // pts is time-ordered; find the first point after tMs.
  let hi = 1;
  while (pts[hi].t <= tMs) hi++;
  const a = pts[hi - 1];
  const b = pts[hi];
  const f = b.t === a.t ? 0 : (tMs - a.t) / (b.t - a.t);
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

/** "LIVE" at zero offset, otherwise a T−m:ss rewind label. */
export function playbackLabel(offsetSec: number): string {
  if (offsetSec >= 0) return "LIVE";
  const s = Math.round(-offsetSec);
  return `T−${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
