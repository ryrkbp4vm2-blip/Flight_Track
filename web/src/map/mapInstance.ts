import type L from "leaflet";

// Module-level handle to the live Leaflet map so overlay controls rendered
// outside <MapContainer> (e.g. MapControls) can drive it.
let instance: L.Map | null = null;

export const setMapInstance = (m: L.Map | null) => {
  instance = m;
};
export const getMapInstance = () => instance;
