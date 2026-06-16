import { useEffect, useRef, useState } from "react";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { bearingDeg, formatDistance, haversineNm, type LatLon } from "../lib/geo";

/**
 * Two-click distance/bearing measure tool. Active only when `measureMode` is on
 * (see MapControls). First click sets A, second sets B; a third starts over.
 */
export default function MeasureLayer() {
  const measureMode = useMapStore((s) => s.measureMode);
  const [points, setPoints] = useState<LatLon[]>([]);
  const groupRef = useRef<L.LayerGroup | null>(null);

  const map = useMapEvents({
    click(e) {
      if (!useMapStore.getState().measureMode) return;
      const pt = { lat: e.latlng.lat, lon: e.latlng.lng };
      setPoints((prev) => (prev.length >= 2 ? [pt] : [...prev, pt]));
    },
  });

  // Clear when the tool is switched off.
  useEffect(() => {
    if (!measureMode) setPoints([]);
  }, [measureMode]);

  // Render the current measurement imperatively.
  useEffect(() => {
    if (!groupRef.current) groupRef.current = L.layerGroup().addTo(map);
    const group = groupRef.current;
    group.clearLayers();
    if (!measureMode || points.length === 0) return;

    const dot = (p: LatLon) =>
      L.circleMarker([p.lat, p.lon], {
        radius: 4,
        color: "#ffd23f",
        fillColor: "#ffd23f",
        fillOpacity: 1,
        interactive: false,
      });
    points.forEach((p) => dot(p).addTo(group));

    if (points.length === 2) {
      const [a, b] = points;
      L.polyline(
        [
          [a.lat, a.lon],
          [b.lat, b.lon],
        ],
        { color: "#ffd23f", weight: 2, dashArray: "5 5", interactive: false },
      ).addTo(group);
      const nm = haversineNm(a, b);
      const brg = bearingDeg(a, b);
      L.marker([b.lat, b.lon], {
        interactive: false,
        icon: L.divIcon({
          className: "measure-label",
          html: `${formatDistance(nm)} · ${Math.round(brg)}°`,
          iconSize: [180, 20],
          iconAnchor: [-8, 10],
        }),
      }).addTo(group);
    }
  }, [points, measureMode, map]);

  useEffect(() => {
    return () => {
      groupRef.current?.remove();
      groupRef.current = null;
    };
  }, []);

  return null;
}
