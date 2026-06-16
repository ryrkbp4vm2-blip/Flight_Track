import { useEffect } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";

/**
 * Global keyboard shortcuts. Escape clears, in order of precedence: an open
 * selection, then the search filter.
 */
export function useKeyboard(): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const air = useAircraftStore.getState();
      const sea = useVesselStore.getState();
      if (air.selectedHex) air.select(null);
      else if (sea.selectedMmsi) sea.clearSelection();
      else if (air.filterText) air.setFilter("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
