import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAircraftStore } from "../store/useAircraftStore";
import { useMapStore, showAir, airClassAllowed } from "../store/useMapStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { filterAircraft } from "../store/selectors";
import { altitudeFt, callsign, hasPosition } from "../lib/format";
import { classifyAircraft, type AircraftClass } from "../lib/classify";
import { emergencyInfo } from "../lib/emergency";
import type { EmergencySeverity } from "../lib/emergency";
import { COLOR_EMERGENCY, COLOR_SELECTED, COLOR_WARNING, altitudeColor } from "./mapConfig";
import { planeIcon, rotateMarkerEl } from "./planeIcon";

interface MarkerRec {
  marker: L.Marker;
  track: number;
  color: string;
  selected: boolean;
  cls: AircraftClass;
  em: EmergencySeverity | null;
  watched: boolean;
}

/**
 * Renders aircraft as Leaflet markers using imperative diffing rather than
 * React components — updating ~hundreds of markers in place each poll instead
 * of re-rendering a component tree. Mounts nothing into the DOM itself.
 */
export default function AircraftLayer() {
  const map = useMap();

  useEffect(() => {
    const group = L.layerGroup().addTo(map);
    const markers = new Map<string, MarkerRec>();

    function render() {
      const { aircraft, selectedHex, filterText, select } = useAircraftStore.getState();
      const { activeLayers, airClassFilter } = useMapStore.getState();
      const watchedAir = useAlertsStore.getState().watchedAir;

      // Hidden when the layer toggle is set to sea-only.
      if (!showAir(activeLayers)) {
        for (const [hex, rec] of markers) {
          group.removeLayer(rec.marker);
          markers.delete(hex);
        }
        return;
      }

      // Determine which aircraft should be visible (text filter + class chips).
      const withPos = [...aircraft.values()].filter(hasPosition);
      const visible = filterAircraft(withPos, filterText).filter((ac) =>
        airClassAllowed(airClassFilter, classifyAircraft(ac)),
      );
      const visibleHexes = new Set(visible.map((ac) => ac.hex));

      // Remove markers no longer visible.
      for (const [hex, rec] of markers) {
        if (!visibleHexes.has(hex)) {
          group.removeLayer(rec.marker);
          markers.delete(hex);
        }
      }

      // Upsert markers for visible aircraft.
      for (const ac of visible) {
        const track = typeof ac.track === "number" ? ac.track : 0;
        const selected = ac.hex === selectedHex;
        const em = emergencyInfo(ac)?.severity ?? null;
        const color = em
          ? em === "critical"
            ? COLOR_EMERGENCY
            : COLOR_WARNING
          : selected
            ? COLOR_SELECTED
            : altitudeColor(altitudeFt(ac));
        const cls = classifyAircraft(ac);
        const watched = watchedAir.has(ac.hex);
        const latlng: [number, number] = [ac.lat, ac.lon];
        const existing = markers.get(ac.hex);

        if (!existing) {
          const marker = L.marker(latlng, {
            icon: planeIcon(track, color, selected, cls, em, watched),
            title: callsign(ac),
            keyboard: false,
            zIndexOffset: em ? 800 : watched ? 400 : 0,
          });
          marker.on("click", () => select(ac.hex));
          marker.addTo(group);
          markers.set(ac.hex, { marker, track, color, selected, cls, em, watched });
          continue;
        }

        existing.marker.setLatLng(latlng);

        // Only rebuild the icon when color/selection/class/emergency changes;
        // rotate cheaply in place when only the heading moved.
        if (
          existing.color !== color ||
          existing.selected !== selected ||
          existing.cls !== cls ||
          existing.em !== em ||
          existing.watched !== watched
        ) {
          existing.marker.setIcon(planeIcon(track, color, selected, cls, em, watched));
          existing.color = color;
          existing.selected = selected;
          existing.cls = cls;
          existing.em = em;
          existing.watched = watched;
          existing.track = track;
          existing.marker.setZIndexOffset(selected ? 1000 : em ? 800 : watched ? 400 : 0);
        } else if (Math.abs(existing.track - track) >= 2) {
          rotateMarkerEl(existing.marker, track, selected ? 1.25 : 1);
          existing.track = track;
        }
      }
    }

    render();
    const unsub = useAircraftStore.subscribe(render);
    const unsubMap = useMapStore.subscribe(render);
    const unsubAlerts = useAlertsStore.subscribe(render);

    return () => {
      unsub();
      unsubMap();
      unsubAlerts();
      group.remove();
      markers.clear();
    };
  }, [map]);

  return null;
}
