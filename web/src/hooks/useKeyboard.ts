import { useEffect, useRef } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { filterAircraft, sortAircraft } from "../store/selectors";
import { vesselName } from "../lib/vessel";
import { cycleId } from "../lib/cycle";
import { UNIT_SYSTEMS } from "../lib/units";

/** Shortcut list, exported so the help overlay renders the same source of truth. */
export const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "J / K", does: "Next / previous contact" },
  { keys: "F", does: "Follow the selected aircraft" },
  { keys: "W", does: "Watch / unwatch the selection" },
  { keys: "T", does: "All trails" },
  { keys: "R", does: "Range rings" },
  { keys: "P", does: "Projected track" },
  { keys: "D", does: "Day / night terminator" },
  { keys: "M", does: "Measure tool" },
  { keys: "U", does: "Cycle units" },
  { keys: "?", does: "This help" },
  { keys: "Esc", does: "Close help / selection / search" },
];

interface HelpControls {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
  );
}

/** Select the next/previous contact in the current domain's list order. */
function cycleSelection(step: 1 | -1): void {
  const air = useAircraftStore.getState();
  const sea = useVesselStore.getState();

  if (sea.selectedMmsi) {
    const ids = [...sea.vessels.values()]
      .sort((a, b) => vesselName(a).localeCompare(vesselName(b)))
      .map((v) => v.mmsi);
    const next = cycleId(ids, sea.selectedMmsi, step);
    if (next) {
      sea.select(next);
      const v = sea.vessels.get(next);
      if (v?.lat != null && v?.lon != null) useMapStore.getState().flyTo(v.lat, v.lon);
    }
    return;
  }

  const ids = sortAircraft(
    filterAircraft([...air.aircraft.values()], air.filterText),
    air.sortKey,
    air.sortDir,
  ).map((a) => a.hex);
  const next = cycleId(ids, air.selectedHex, step);
  if (next) {
    air.select(next);
    const a = air.aircraft.get(next);
    if (a?.lat != null && a?.lon != null) useMapStore.getState().flyTo(a.lat, a.lon);
  }
}

/**
 * Global keyboard shortcuts (see SHORTCUTS). Ignored while typing in a field;
 * Escape closes, in order of precedence: help, selection, then the search text.
 */
export function useKeyboard(help: HelpControls): void {
  const helpRef = useRef(help);
  helpRef.current = help;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const air = useAircraftStore.getState();
      const sea = useVesselStore.getState();
      const map = useMapStore.getState();

      switch (e.key) {
        case "Escape": {
          if (helpRef.current.open) helpRef.current.close();
          else if (air.selectedHex) air.select(null);
          else if (sea.selectedMmsi) sea.clearSelection();
          else if (air.filterText) air.setFilter("");
          return;
        }
        case "?":
          helpRef.current.toggle();
          return;
        case "j":
        case "J":
          cycleSelection(1);
          return;
        case "k":
        case "K":
          cycleSelection(-1);
          return;
        case "f":
        case "F":
          if (air.selectedHex) air.toggleFollow();
          return;
        case "w":
        case "W": {
          const alerts = useAlertsStore.getState();
          if (air.selectedHex) alerts.toggleWatchAir(air.selectedHex);
          else if (sea.selectedMmsi) alerts.toggleWatchSea(sea.selectedMmsi);
          return;
        }
        case "t":
        case "T":
          map.toggleAllTrails();
          return;
        case "r":
        case "R":
          map.toggleRangeRings();
          return;
        case "p":
        case "P":
          map.toggleProjection();
          return;
        case "d":
        case "D":
          map.toggleTerminator();
          return;
        case "m":
        case "M":
          map.toggleMeasure();
          return;
        case "u":
        case "U": {
          const order = UNIT_SYSTEMS.map((u) => u.key);
          const next = order[(order.indexOf(map.units) + 1) % order.length];
          map.setUnits(next);
          return;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
