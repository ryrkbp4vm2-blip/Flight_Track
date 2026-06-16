import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { NM_TO_KM } from "../lib/geo";

const RANGE_NM = [50, 100, 200, 400];

/** Concentric distance rings centered on the selected contact. */
export default function RangeRingsLayer() {
  const map = useMap();

  useEffect(() => {
    const group = L.layerGroup().addTo(map);

    function selectedPosition(): { lat: number; lon: number } | null {
      const hex = useAircraftStore.getState().selectedHex;
      if (hex) {
        const ac = useAircraftStore.getState().aircraft.get(hex);
        if (ac && typeof ac.lat === "number" && typeof ac.lon === "number") {
          return { lat: ac.lat, lon: ac.lon };
        }
      }
      const mmsi = useVesselStore.getState().selectedMmsi;
      if (mmsi) {
        const v = useVesselStore.getState().vessels.get(mmsi);
        if (v && typeof v.lat === "number" && typeof v.lon === "number") {
          return { lat: v.lat, lon: v.lon };
        }
      }
      return null;
    }

    function render() {
      group.clearLayers();
      if (!useMapStore.getState().rangeRings) return;
      const pos = selectedPosition();
      if (!pos) return;

      for (const nm of RANGE_NM) {
        L.circle([pos.lat, pos.lon], {
          radius: nm * NM_TO_KM * 1000, // metres
          renderer: L.svg(),
          color: "#5ad1ff",
          weight: 1,
          opacity: 0.35,
          fill: false,
          dashArray: "3 5",
          interactive: false,
        }).addTo(group);
        // Label due north of centre at the ring radius.
        const northLat = pos.lat + nm / 60;
        L.marker([northLat, pos.lon], {
          interactive: false,
          icon: L.divIcon({ className: "ring-label", html: `${nm} nm`, iconSize: [44, 14] }),
        }).addTo(group);
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
