import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvent } from "react-leaflet";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from "./mapConfig";
import AircraftLayer from "./AircraftLayer";
import VesselLayer from "./VesselLayer";
import TrailsLayer from "./TrailsLayer";

/**
 * Drives map movement from the store: explicit fly-to requests (selecting from
 * the list / "Center on map") and continuous follow of the selected aircraft.
 */
function FlyController() {
  const map = useMap();
  useEffect(() => {
    let lastNonce = -1;
    let lastFollowPos = "";

    // One-shot pans (list click, "Center on map") come from the map store.
    const unsubMap = useMapStore.subscribe((state) => {
      const t = state.flyTarget;
      if (t && t.nonce !== lastNonce) {
        lastNonce = t.nonce;
        map.flyTo([t.lat, t.lon], Math.max(map.getZoom(), 6), { duration: 0.6 });
      }
    });

    // Continuous follow keeps the selected aircraft centered as it moves.
    const unsubAir = useAircraftStore.subscribe((state) => {
      if (state.followSelected && state.selectedHex) {
        const ac = state.aircraft.get(state.selectedHex);
        if (ac && typeof ac.lat === "number" && typeof ac.lon === "number") {
          const key = `${ac.lat.toFixed(4)},${ac.lon.toFixed(4)}`;
          if (key !== lastFollowPos) {
            lastFollowPos = key;
            map.panTo([ac.lat, ac.lon], { animate: true, duration: 0.8 });
          }
        }
      } else {
        lastFollowPos = "";
      }
    });

    return () => {
      unsubMap();
      unsubAir();
    };
  }, [map]);
  return null;
}

/** Clears both selections when the empty map is clicked. */
function DeselectOnMapClick() {
  const selectAir = useAircraftStore((s) => s.select);
  const clearVessel = useVesselStore((s) => s.clearSelection);
  useMapEvent("click", () => {
    selectAir(null);
    clearVessel();
  });
  return null;
}

export default function MapView() {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      maxZoom={MAX_ZOOM}
      minZoom={2}
      worldCopyJump
      preferCanvas
      zoomControl={false}
      attributionControl
      className="map-root"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={MAX_ZOOM} />
      <TrailsLayer />
      <VesselLayer />
      <AircraftLayer />
      <FlyController />
      <DeselectOnMapClick />
    </MapContainer>
  );
}
