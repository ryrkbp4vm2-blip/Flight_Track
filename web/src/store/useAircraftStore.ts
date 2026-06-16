import { create } from "zustand";
import type { MilResponse, TrackedAircraft, TrackPoint } from "../../../shared/types";
import { altitudeFt, hasPosition } from "../lib/format";
import { appendTrackPoint } from "../lib/trails";
import { useVesselStore } from "./useVesselStore";

/** Drop aircraft we haven't heard from in this long (ms). */
const STALE_MS = 120_000;

export type SortKey = "callsign" | "type" | "altitude" | "speed";
export type SortDir = "asc" | "desc";

interface Status {
  lastUpdate: number | null;
  error: string | null;
  total: number;
  /** True when the proxy reported it is serving bundled sample data. */
  sample: boolean;
}

interface AircraftState {
  /** Live aircraft keyed by hex. A new Map identity is set on each ingest. */
  aircraft: Map<string, TrackedAircraft>;
  /** Recent track points keyed by hex. */
  trails: Map<string, TrackPoint[]>;
  selectedHex: string | null;
  filterText: string;
  sortKey: SortKey;
  sortDir: SortDir;
  /** When true, keep the selected aircraft centered as it moves. */
  followSelected: boolean;
  status: Status;

  ingest: (resp: MilResponse, meta?: { sample?: boolean }) => void;
  select: (hex: string | null) => void;
  toggleFollow: () => void;
  setFilter: (text: string) => void;
  setSort: (key: SortKey) => void;
  setError: (message: string | null) => void;
}

export const useAircraftStore = create<AircraftState>((set) => ({
  aircraft: new Map(),
  trails: new Map(),
  selectedHex: null,
  filterText: "",
  sortKey: "callsign",
  sortDir: "asc",
  followSelected: false,
  status: { lastUpdate: null, error: null, total: 0, sample: false },

  ingest: (resp, meta) =>
    set((state) => {
      const now = Date.now();
      const aircraft = new Map(state.aircraft);
      const trails = new Map(state.trails);

      for (const ac of resp.ac) {
        if (!ac.hex) continue;
        aircraft.set(ac.hex, { ...ac, lastSeen: now });
        if (hasPosition(ac)) {
          const pt: TrackPoint = {
            lat: ac.lat,
            lon: ac.lon,
            alt: altitudeFt(ac),
            t: now,
          };
          trails.set(ac.hex, appendTrackPoint(trails.get(ac.hex), pt));
        }
      }

      // Prune aircraft (and their trails) we haven't seen recently.
      for (const [hex, ac] of aircraft) {
        if (now - ac.lastSeen > STALE_MS) {
          aircraft.delete(hex);
          trails.delete(hex);
        }
      }

      return {
        aircraft,
        trails,
        status: {
          lastUpdate: now,
          error: null,
          total: aircraft.size,
          sample: meta?.sample ?? state.status.sample,
        },
      };
    }),

  // Clearing the selection also stops following. Selecting an aircraft clears
  // any vessel selection so only one detail panel shows.
  select: (hex) => {
    if (hex === null) set({ selectedHex: null, followSelected: false });
    else {
      set({ selectedHex: hex });
      useVesselStore.getState().clearSelection();
    }
  },
  toggleFollow: () => set((state) => ({ followSelected: !state.followSelected })),
  setFilter: (text) => set({ filterText: text }),
  setSort: (key) =>
    set((state) =>
      state.sortKey === key
        ? { sortDir: state.sortDir === "asc" ? "desc" : "asc" }
        : { sortKey: key, sortDir: "asc" },
    ),
  setError: (message) =>
    set((state) => ({ status: { ...state.status, error: message } })),
}));
