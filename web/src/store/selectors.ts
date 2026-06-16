import type { Aircraft, TrackedAircraft } from "../../../shared/types";
import { altitudeFt, callsign } from "../lib/format";
import type { SortDir, SortKey } from "./useAircraftStore";

/** Filter aircraft by a free-text query over callsign, type, hex, registration. */
export function filterAircraft<T extends Aircraft>(list: T[], filterText: string): T[] {
  const q = filterText.trim().toLowerCase();
  if (!q) return list;
  return list.filter((ac) => {
    return (
      callsign(ac).toLowerCase().includes(q) ||
      ac.hex.toLowerCase().includes(q) ||
      (ac.t?.toLowerCase().includes(q) ?? false) ||
      (ac.r?.toLowerCase().includes(q) ?? false)
    );
  });
}

/** Sort aircraft by the chosen key/direction. Returns a new array. */
export function sortAircraft(
  list: TrackedAircraft[],
  sortKey: SortKey,
  sortDir: SortDir,
): TrackedAircraft[] {
  const dir = sortDir === "asc" ? 1 : -1;
  const sorted = [...list];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "callsign":
        cmp = callsign(a).localeCompare(callsign(b));
        break;
      case "type":
        cmp = (a.t ?? "").localeCompare(b.t ?? "");
        break;
      case "altitude":
        cmp = (altitudeFt(a) ?? -1) - (altitudeFt(b) ?? -1);
        break;
      case "speed":
        cmp = (a.gs ?? -1) - (b.gs ?? -1);
        break;
    }
    return cmp * dir;
  });
  return sorted;
}
