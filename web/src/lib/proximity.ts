// Pure proximity helpers: rank contacts by great-circle distance and turn a
// bearing into a compass point. No store/React dependency so they stay testable.

import { bearingDeg, haversineNm, type LatLon } from "./geo";

export interface NearItem<T> {
  item: T;
  distanceNm: number;
  bearing: number;
}

/** The `limit` items nearest to `origin`, closest first, with distance + bearing. */
export function nearest<T extends LatLon>(origin: LatLon, items: T[], limit = 5): NearItem<T>[] {
  return items
    .map((item) => ({
      item,
      distanceNm: haversineNm(origin, item),
      bearing: bearingDeg(origin, item),
    }))
    .sort((a, b) => a.distanceNm - b.distanceNm)
    .slice(0, limit);
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** 8-point compass abbreviation for a bearing in degrees. */
export function compassPoint(bearing: number): string {
  const norm = ((bearing % 360) + 360) % 360;
  return POINTS[Math.round(norm / 45) % 8];
}
