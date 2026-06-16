import { create } from "zustand";
import type { TrackedVessel, TrackPoint, VesselResponse } from "../../../shared/types";
import { appendTrackPoint } from "../lib/trails";

const STALE_MS = 300_000; // vessels move slowly; keep them longer than aircraft

export type VesselSortKey = "name" | "type" | "country" | "speed";
export type SortDir = "asc" | "desc";

interface Status {
  lastUpdate: number | null;
  error: string | null;
  total: number;
  sample: boolean;
}

interface VesselState {
  vessels: Map<string, TrackedVessel>;
  trails: Map<string, TrackPoint[]>;
  selectedMmsi: string | null;
  sortKey: VesselSortKey;
  sortDir: SortDir;
  status: Status;

  ingest: (resp: VesselResponse, meta?: { sample?: boolean }) => void;
  select: (mmsi: string | null) => void;
  clearSelection: () => void;
  setSort: (key: VesselSortKey) => void;
  setError: (message: string | null) => void;
}

export const useVesselStore = create<VesselState>((set) => ({
  vessels: new Map(),
  trails: new Map(),
  selectedMmsi: null,
  sortKey: "name",
  sortDir: "asc",
  status: { lastUpdate: null, error: null, total: 0, sample: false },

  ingest: (resp, meta) =>
    set((state) => {
      const now = Date.now();
      const vessels = new Map(state.vessels);
      const trails = new Map(state.trails);

      for (const v of resp.vessels) {
        if (!v.mmsi) continue;
        vessels.set(v.mmsi, { ...v, lastSeen: now });
        if (typeof v.lat === "number" && typeof v.lon === "number") {
          const pt: TrackPoint = { lat: v.lat, lon: v.lon, alt: null, t: now };
          trails.set(v.mmsi, appendTrackPoint(trails.get(v.mmsi), pt));
        }
      }

      for (const [mmsi, v] of vessels) {
        if (now - v.lastSeen > STALE_MS) {
          vessels.delete(mmsi);
          trails.delete(mmsi);
        }
      }

      return {
        vessels,
        trails,
        status: {
          lastUpdate: now,
          error: null,
          total: vessels.size,
          sample: meta?.sample ?? state.status.sample,
        },
      };
    }),

  // Selecting a vessel clears any aircraft selection (lazy import to avoid a
  // load-time cycle between the two stores).
  select: (mmsi) => {
    set({ selectedMmsi: mmsi });
    if (mmsi !== null) {
      void import("./useAircraftStore").then((m) => m.useAircraftStore.getState().select(null));
    }
  },
  clearSelection: () => set({ selectedMmsi: null }),
  setSort: (key) =>
    set((state) =>
      state.sortKey === key
        ? { sortDir: state.sortDir === "asc" ? "desc" : "asc" }
        : { sortKey: key, sortDir: "asc" },
    ),
  setError: (message) => set((state) => ({ status: { ...state.status, error: message } })),
}));
