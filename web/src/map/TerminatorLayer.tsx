import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { terminator, subsolarPoint } from "../lib/sun";

/**
 * Shades the night hemisphere and marks the subsolar point. Recomputed on a
 * one-minute tick so the terminator drifts westward in real time.
 */
export default function TerminatorLayer() {
  const map = useMap();

  useEffect(() => {
    const group = L.layerGroup().addTo(map);

    function render() {
      group.clearLayers();
      if (!useMapStore.getState().terminator) return;

      const now = new Date();
      const { curve, nightCapLat } = terminator(now);
      const ring: [number, number][] = curve.map((p) => [p.lat, p.lon]);
      // Close the polygon over the dark pole so the whole night side fills.
      ring.push([nightCapLat, 180], [nightCapLat, -180]);
      L.polygon(ring, {
        renderer: L.svg(),
        color: "#3a4a66",
        weight: 1,
        opacity: 0.5,
        fillColor: "#060a14",
        fillOpacity: 0.42,
        interactive: false,
      }).addTo(group);

      const sun = subsolarPoint(now);
      L.marker([sun.lat, sun.lon], {
        interactive: false,
        icon: L.divIcon({ className: "subsolar", html: "☀", iconSize: [22, 22] }),
      }).addTo(group);
    }

    render();
    const unsub = useMapStore.subscribe(render);
    const timer = setInterval(render, 60_000);

    return () => {
      unsub();
      clearInterval(timer);
      group.remove();
    };
  }, [map]);

  return null;
}
