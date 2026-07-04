import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { projectedTrack, type LatLon } from "../lib/geo";
import { vesselHeading } from "../lib/vessel";

const COLOR = "#7ee0b8";

interface Vector {
  pos: LatLon;
  heading: number;
  speedKt: number;
}

/**
 * Dashed dead-reckoning vector ahead of the selected contact, with +5/+10/+15
 * minute ticks. Assumes constant heading and speed.
 */
export default function ProjectionLayer() {
  const map = useMap();

  useEffect(() => {
    const group = L.layerGroup().addTo(map);

    function selectedVector(): Vector | null {
      const hex = useAircraftStore.getState().selectedHex;
      if (hex) {
        const ac = useAircraftStore.getState().aircraft.get(hex);
        if (
          ac &&
          typeof ac.lat === "number" &&
          typeof ac.lon === "number" &&
          typeof ac.track === "number" &&
          typeof ac.gs === "number"
        ) {
          return { pos: { lat: ac.lat, lon: ac.lon }, heading: ac.track, speedKt: ac.gs };
        }
        return null;
      }
      const mmsi = useVesselStore.getState().selectedMmsi;
      if (mmsi) {
        const v = useVesselStore.getState().vessels.get(mmsi);
        if (v && typeof v.lat === "number" && typeof v.lon === "number" && typeof v.sog === "number") {
          return { pos: { lat: v.lat, lon: v.lon }, heading: vesselHeading(v), speedKt: v.sog };
        }
      }
      return null;
    }

    function render() {
      group.clearLayers();
      if (!useMapStore.getState().projection) return;
      const vec = selectedVector();
      if (!vec || vec.speedKt <= 0) return;

      const ticks = projectedTrack(vec.pos, vec.heading, vec.speedKt);
      const path: [number, number][] = [
        [vec.pos.lat, vec.pos.lon],
        ...ticks.map((t) => [t.point.lat, t.point.lon] as [number, number]),
      ];
      L.polyline(path, {
        renderer: L.svg(),
        color: COLOR,
        weight: 2,
        opacity: 0.85,
        dashArray: "6 6",
        interactive: false,
      }).addTo(group);

      for (const t of ticks) {
        L.circleMarker([t.point.lat, t.point.lon], {
          radius: 3,
          color: COLOR,
          fillColor: COLOR,
          fillOpacity: 1,
          weight: 1,
          interactive: false,
        }).addTo(group);
        L.marker([t.point.lat, t.point.lon], {
          interactive: false,
          icon: L.divIcon({ className: "proj-label", html: `+${t.minutes}m`, iconSize: [34, 14] }),
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
