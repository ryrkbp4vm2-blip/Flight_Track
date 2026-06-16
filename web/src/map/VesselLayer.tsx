import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useVesselStore } from "../store/useVesselStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useMapStore, showSea } from "../store/useMapStore";
import {
  classifyVessel,
  hasVesselPosition,
  vesselColor,
  vesselHeading,
  vesselMatches,
  vesselName,
  vesselSizeScale,
} from "../lib/vessel";
import { COLOR_SELECTED, COLOR_TRAIL, COLOR_TRAIL_SELECTED } from "./mapConfig";
import { vesselIcon, rotateVesselEl } from "./vesselIcon";

interface Rec {
  marker: L.Marker;
  heading: number;
  color: string;
  selected: boolean;
}

/** Imperative vessel markers + trails, mirroring AircraftLayer. */
export default function VesselLayer() {
  const map = useMap();

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.5 });
    const trailGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    const markers = new Map<string, Rec>();
    const lines = new Map<string, L.Polyline>();

    function render() {
      const { vessels, trails, selectedMmsi, select } = useVesselStore.getState();
      const visible = showSea(useMapStore.getState().activeLayers);

      if (!visible) {
        markers.forEach((r) => markerGroup.removeLayer(r.marker));
        markers.clear();
        lines.forEach((l) => trailGroup.removeLayer(l));
        lines.clear();
        return;
      }

      const filterText = useAircraftStore.getState().filterText;
      const withPos = [...vessels.values()]
        .filter(hasVesselPosition)
        .filter((v) => vesselMatches(v, filterText));
      const present = new Set(withPos.map((v) => v.mmsi));

      for (const [mmsi, rec] of markers) {
        if (!present.has(mmsi)) {
          markerGroup.removeLayer(rec.marker);
          markers.delete(mmsi);
        }
      }

      for (const v of withPos) {
        const cls = classifyVessel(v);
        const selected = v.mmsi === selectedMmsi;
        const heading = vesselHeading(v);
        const color = selected ? COLOR_SELECTED : vesselColor(cls);
        const latlng: [number, number] = [v.lat, v.lon];
        const existing = markers.get(v.mmsi);

        if (!existing) {
          const marker = L.marker(latlng, {
            icon: vesselIcon(heading, color, selected, vesselSizeScale(cls)),
            title: vesselName(v),
            keyboard: false,
          });
          marker.on("click", () => select(v.mmsi));
          marker.addTo(markerGroup);
          markers.set(v.mmsi, { marker, heading, color, selected });
          continue;
        }

        existing.marker.setLatLng(latlng);
        if (existing.color !== color || existing.selected !== selected) {
          existing.marker.setIcon(vesselIcon(heading, color, selected, vesselSizeScale(cls)));
          existing.color = color;
          existing.selected = selected;
          existing.heading = heading;
          existing.marker.setZIndexOffset(selected ? 1000 : 0);
        } else if (Math.abs(existing.heading - heading) >= 2) {
          rotateVesselEl(existing.marker, heading, (selected ? 1.3 : 1) * vesselSizeScale(cls));
          existing.heading = heading;
        }
      }

      // Trails: selected vessel always; all when aircraft "show all" is on is
      // aircraft-specific, so vessels just draw the selected one here.
      const wanted = new Set<string>();
      if (selectedMmsi && (trails.get(selectedMmsi)?.length ?? 0) > 1) wanted.add(selectedMmsi);
      for (const [mmsi, line] of lines) {
        if (!wanted.has(mmsi)) {
          trailGroup.removeLayer(line);
          lines.delete(mmsi);
        }
      }
      for (const mmsi of wanted) {
        const pts = trails.get(mmsi)!.map((p) => [p.lat, p.lon]) as [number, number][];
        const existing = lines.get(mmsi);
        if (existing) existing.setLatLngs(pts);
        else {
          lines.set(
            mmsi,
            L.polyline(pts, {
              renderer,
              color: mmsi === selectedMmsi ? COLOR_TRAIL_SELECTED : COLOR_TRAIL,
              weight: 3,
              opacity: 0.85,
              dashArray: "4 4",
              interactive: false,
            }).addTo(trailGroup),
          );
        }
      }
    }

    render();
    const unsubV = useVesselStore.subscribe(render);
    const unsubM = useMapStore.subscribe(render);
    const unsubA = useAircraftStore.subscribe(render);

    return () => {
      unsubV();
      unsubM();
      unsubA();
      trailGroup.remove();
      markerGroup.remove();
      markers.clear();
      lines.clear();
    };
  }, [map]);

  return null;
}
