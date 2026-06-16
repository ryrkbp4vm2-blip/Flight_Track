import type { TrackPoint } from "../../../shared/types";

/** Max points kept per aircraft trail (~a few minutes at the poll interval). */
export const MAX_TRAIL_POINTS = 60;

/** Min movement (degrees) before a new trail point is recorded. */
const MIN_MOVE_DEG = 0.0008; // ~90m

/**
 * Append a point to a trail, de-duplicating near-stationary samples and
 * capping length. Returns a new array (immutable update for the store).
 */
export function appendTrackPoint(
  trail: TrackPoint[] | undefined,
  pt: TrackPoint,
  maxPoints = MAX_TRAIL_POINTS,
): TrackPoint[] {
  if (!trail || trail.length === 0) return [pt];
  const last = trail[trail.length - 1];
  const moved =
    Math.abs(last.lat - pt.lat) > MIN_MOVE_DEG ||
    Math.abs(last.lon - pt.lon) > MIN_MOVE_DEG;
  if (!moved) return trail;
  const next = trail.length >= maxPoints ? trail.slice(trail.length - maxPoints + 1) : trail.slice();
  next.push(pt);
  return next;
}
