import { create } from "zustand";
import { loadPref, savePref } from "../lib/persist";

/** Which entity layers are shown on the map. */
export type LayerMode = "air" | "sea" | "both";

interface MapState {
  /** Map pan request; `nonce` changes each call so repeats still fire. */
  flyTarget: { lat: number; lon: number; nonce: number } | null;
  activeLayers: LayerMode;
  flyTo: (lat: number, lon: number) => void;
  setLayers: (mode: LayerMode) => void;
}

/** Cross-cutting map UI state shared by the aircraft and vessel features. */
export const useMapStore = create<MapState>((set) => ({
  flyTarget: null,
  activeLayers: loadPref<LayerMode>("layers", "both"),
  flyTo: (lat, lon) =>
    set((state) => ({ flyTarget: { lat, lon, nonce: (state.flyTarget?.nonce ?? 0) + 1 } })),
  setLayers: (mode) => {
    savePref("layers", mode);
    set({ activeLayers: mode });
  },
}));

export const showAir = (m: LayerMode) => m === "air" || m === "both";
export const showSea = (m: LayerMode) => m === "sea" || m === "both";
