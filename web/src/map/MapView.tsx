import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvent } from "react-leaflet";
import { useAircraftStore } from "../store/useAircraftStore";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from "./mapConfig";
import AircraftLayer from "./AircraftLayer";
import TrailsLayer from "./TrailsLayer";

/** Pans the map when a fly-to target is set (e.g. selecting from the list). */
function FlyController() {
  const map = useMap();
  useEffect(() => {
    let lastNonce = -1;
    const unsub = useAircraftStore.subscribe((state) => {
      const t = state.flyTarget;
      if (t && t.nonce !== lastNonce) {
        lastNonce = t.nonce;
        map.flyTo([t.lat, t.lon], Math.max(map.getZoom(), 6), { duration: 0.6 });
      }
    });
    return unsub;
  }, [map]);
  return null;
}

/** Clears the selection when the empty map is clicked. */
function DeselectOnMapClick() {
  const select = useAircraftStore((s) => s.select);
  useMapEvent("click", () => select(null));
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
      <AircraftLayer />
      <FlyController />
      <DeselectOnMapClick />
    </MapContainer>
  );
}
