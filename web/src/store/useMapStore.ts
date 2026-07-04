import { create } from "zustand";
import { loadPref, savePref } from "../lib/persist";
import type { AircraftClass } from "../lib/classify";
import type { VesselClass } from "../lib/vessel";
import type { UnitSystem } from "../lib/units";

/** Which entity layers are shown on the map. */
export type LayerMode = "air" | "sea" | "both";

interface MapState {
  /** Map pan request; `nonce` changes each call so repeats still fire. */
  flyTarget: { lat: number; lon: number; nonce: number } | null;
  activeLayers: LayerMode;
  /** Show trails for every contact (both layers), not just the selected one. */
  showAllTrails: boolean;
  /** Allowed aircraft classes; empty = all allowed. */
  airClassFilter: Set<AircraftClass>;
  /** Allowed vessel classes; empty = all allowed. */
  seaClassFilter: Set<VesselClass>;
  /** Draw range rings around the selected contact. */
  rangeRings: boolean;
  /** Draw the projected (dead-reckoned) track ahead of the selected contact. */
  projection: boolean;
  /** Shade the night hemisphere (day/night terminator overlay). */
  terminator: boolean;
  /** Two-click distance/bearing measure mode. */
  measureMode: boolean;
  /** Unit system for altitude / speed / distance display. */
  units: UnitSystem;
  flyTo: (lat: number, lon: number) => void;
  setLayers: (mode: LayerMode) => void;
  toggleAllTrails: () => void;
  toggleAirClass: (c: AircraftClass) => void;
  toggleSeaClass: (c: VesselClass) => void;
  toggleRangeRings: () => void;
  toggleProjection: () => void;
  toggleTerminator: () => void;
  toggleMeasure: () => void;
  setUnits: (u: UnitSystem) => void;
}

/** Cross-cutting map UI state shared by the aircraft and vessel features. */
export const useMapStore = create<MapState>((set) => ({
  flyTarget: null,
  activeLayers: loadPref<LayerMode>("layers", "both"),
  showAllTrails: loadPref("showAllTrails", false),
  airClassFilter: new Set(loadPref<AircraftClass[]>("airClassFilter", [])),
  seaClassFilter: new Set(loadPref<VesselClass[]>("seaClassFilter", [])),
  rangeRings: loadPref("rangeRings", false),
  projection: loadPref("projection", false),
  terminator: loadPref("terminator", false),
  measureMode: false,
  units: loadPref<UnitSystem>("units", "aviation"),
  flyTo: (lat, lon) =>
    set((state) => ({ flyTarget: { lat, lon, nonce: (state.flyTarget?.nonce ?? 0) + 1 } })),
  setLayers: (mode) => {
    savePref("layers", mode);
    set({ activeLayers: mode });
  },
  toggleAllTrails: () =>
    set((state) => {
      const showAllTrails = !state.showAllTrails;
      savePref("showAllTrails", showAllTrails);
      return { showAllTrails };
    }),
  toggleAirClass: (c) =>
    set((state) => {
      const next = new Set(state.airClassFilter);
      next.has(c) ? next.delete(c) : next.add(c);
      savePref("airClassFilter", [...next]);
      return { airClassFilter: next };
    }),
  toggleSeaClass: (c) =>
    set((state) => {
      const next = new Set(state.seaClassFilter);
      next.has(c) ? next.delete(c) : next.add(c);
      savePref("seaClassFilter", [...next]);
      return { seaClassFilter: next };
    }),
  toggleRangeRings: () =>
    set((state) => {
      const rangeRings = !state.rangeRings;
      savePref("rangeRings", rangeRings);
      return { rangeRings };
    }),
  toggleProjection: () =>
    set((state) => {
      const projection = !state.projection;
      savePref("projection", projection);
      return { projection };
    }),
  toggleTerminator: () =>
    set((state) => {
      const terminator = !state.terminator;
      savePref("terminator", terminator);
      return { terminator };
    }),
  // Measure mode is transient (not persisted).
  toggleMeasure: () => set((state) => ({ measureMode: !state.measureMode })),
  setUnits: (u) => {
    savePref("units", u);
    set({ units: u });
  },
}));

export const showAir = (m: LayerMode) => m === "air" || m === "both";
export const showSea = (m: LayerMode) => m === "sea" || m === "both";

/** Empty filter = everything allowed. */
export const airClassAllowed = (filter: Set<AircraftClass>, c: AircraftClass) =>
  filter.size === 0 || filter.has(c);
export const seaClassAllowed = (filter: Set<VesselClass>, c: VesselClass) =>
  filter.size === 0 || filter.has(c);
