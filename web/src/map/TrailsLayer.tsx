import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useAircraftStore } from "../store/useAircraftStore";
import { COLOR_TRAIL, COLOR_TRAIL_SELECTED } from "./mapConfig";

/**
 * Draws aircraft trails as polylines on the canvas renderer. By default only
 * the selected aircraft's trail is shown (bright); a "show all trails" toggle
 * draws every trail dimly.
 */
export default function TrailsLayer() {
  const map = useMap();

  useEffect(() => {
    const renderer = L.canvas({ padding: 0.5 });
    const group = L.layerGroup().addTo(map);
    const lines = new Map<string, L.Polyline>();

    function render() {
      const { trails, selectedHex, showAllTrails } = useAircraftStore.getState();

      // Which hexes get a trail this frame.
      const wanted = new Set<string>();
      if (showAllTrails) {
        for (const [hex, pts] of trails) if (pts.length > 1) wanted.add(hex);
      } else if (selectedHex && (trails.get(selectedHex)?.length ?? 0) > 1) {
        wanted.add(selectedHex);
      }

      // Remove lines no longer wanted.
      for (const [hex, line] of lines) {
        if (!wanted.has(hex)) {
          group.removeLayer(line);
          lines.delete(hex);
        }
      }

      // Upsert lines.
      for (const hex of wanted) {
        const pts = trails.get(hex)!;
        const latlngs = pts.map((p) => [p.lat, p.lon]) as [number, number][];
        const selected = hex === selectedHex;
        const existing = lines.get(hex);
        if (existing) {
          existing.setLatLngs(latlngs);
          existing.setStyle({
            color: selected ? COLOR_TRAIL_SELECTED : COLOR_TRAIL,
            weight: selected ? 3 : 1.5,
            opacity: selected ? 0.9 : 0.5,
          });
        } else {
          const line = L.polyline(latlngs, {
            renderer,
            color: selected ? COLOR_TRAIL_SELECTED : COLOR_TRAIL,
            weight: selected ? 3 : 1.5,
            opacity: selected ? 0.9 : 0.5,
            interactive: false,
          }).addTo(group);
          lines.set(hex, line);
        }
      }
    }

    render();
    const unsub = useAircraftStore.subscribe(render);

    return () => {
      unsub();
      group.remove();
      lines.clear();
    };
  }, [map]);

  return null;
}
