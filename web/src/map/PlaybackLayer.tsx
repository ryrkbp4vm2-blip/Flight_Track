import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { positionAt } from "../lib/playback";

const AIR_COLOR = "#5ad1ff";
const SEA_COLOR = "#7ee0b8";

/**
 * Ghost markers at each contact's historical position while time-scrub
 * playback is active. Positions are interpolated from the trail buffers; the
 * live marker pane is dimmed via CSS (.playback-on) so the ghosts read as the
 * picture "as of" the scrub time.
 */
export default function PlaybackLayer() {
  const map = useMap();

  useEffect(() => {
    const renderer = L.svg({ padding: 0.5 });
    const group = L.layerGroup().addTo(map);

    function render() {
      group.clearLayers();
      const { playback, playbackOffsetSec } = useMapStore.getState();
      if (!playback) return;
      const tMs = Date.now() + playbackOffsetSec * 1000;

      const ghost = (lat: number, lon: number, color: string) =>
        L.circleMarker([lat, lon], {
          renderer,
          radius: 5,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.35,
          interactive: false,
        }).addTo(group);

      for (const pts of useAircraftStore.getState().trails.values()) {
        const p = positionAt(pts, tMs);
        if (p) ghost(p.lat, p.lon, AIR_COLOR);
      }
      for (const pts of useVesselStore.getState().trails.values()) {
        const p = positionAt(pts, tMs);
        if (p) ghost(p.lat, p.lon, SEA_COLOR);
      }
    }

    render();
    const unsubs = [
      useMapStore.subscribe(render),
      useAircraftStore.subscribe(render),
      useVesselStore.subscribe(render),
    ];

    return () => {
      unsubs.forEach((u) => u());
      group.remove();
    };
  }, [map]);

  return null;
}
