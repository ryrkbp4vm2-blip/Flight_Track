import { useEffect } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";

/** `#sel=<hex>` selects an aircraft, `#vsl=<mmsi>` a vessel. */
function readHash(): { hex: string | null; mmsi: string | null } {
  const sel = /(?:^#|&)sel=([0-9a-fA-F]{6})/.exec(window.location.hash);
  const vsl = /(?:^#|&)vsl=(\w{1,20})/.exec(window.location.hash);
  return { hex: sel ? sel[1].toLowerCase() : null, mmsi: vsl ? vsl[1] : null };
}

/**
 * Two-way sync between the selected contact (aircraft or vessel) and the URL
 * hash, making a selection shareable and restorable on reload. Also responds
 * to back/forward navigation.
 */
export function useUrlSync(): void {
  useEffect(() => {
    // Restore selection from the initial URL. Selections are mutually
    // exclusive; an aircraft link wins if both are present.
    const initial = readHash();
    if (initial.hex) useAircraftStore.getState().select(initial.hex);
    else if (initial.mmsi) useVesselStore.getState().select(initial.mmsi);

    // Push store -> URL whenever either selection changes.
    const write = () => {
      const hex = useAircraftStore.getState().selectedHex;
      const mmsi = useVesselStore.getState().selectedMmsi;
      const hash = hex ? `#sel=${hex}` : mmsi ? `#vsl=${mmsi}` : "";
      if (hash !== window.location.hash) {
        history.replaceState(null, "", hash || window.location.pathname + window.location.search);
      }
    };
    const unsubAir = useAircraftStore.subscribe((state, prev) => {
      if (state.selectedHex !== prev.selectedHex) write();
    });
    const unsubSea = useVesselStore.subscribe((state, prev) => {
      if (state.selectedMmsi !== prev.selectedMmsi) write();
    });

    // Respond to manual hash edits / back-forward navigation.
    const onHash = () => {
      const { hex, mmsi } = readHash();
      if (hex) useAircraftStore.getState().select(hex);
      else if (mmsi) useVesselStore.getState().select(mmsi);
      else {
        useAircraftStore.getState().select(null);
        useVesselStore.getState().clearSelection();
      }
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      unsubAir();
      unsubSea();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
}
