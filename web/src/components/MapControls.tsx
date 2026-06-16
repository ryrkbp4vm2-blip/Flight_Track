import { useState } from "react";
import { getMapInstance } from "../map/mapInstance";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../map/mapConfig";

/** Zoom, reset-view, and locate-me controls (overlay outside the map). */
export default function MapControls() {
  const [locating, setLocating] = useState(false);

  function zoomIn() {
    getMapInstance()?.zoomIn();
  }
  function zoomOut() {
    getMapInstance()?.zoomOut();
  }
  function reset() {
    getMapInstance()?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
  }
  function locate() {
    const map = getMapInstance();
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        map.flyTo([p.coords.latitude, p.coords.longitude], 8, { duration: 0.8 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="map-controls">
      <button onClick={zoomIn} aria-label="Zoom in">+</button>
      <button onClick={zoomOut} aria-label="Zoom out">−</button>
      <button onClick={reset} aria-label="Reset view" title="Reset to world view">⌂</button>
      <button
        onClick={locate}
        aria-label="Locate me"
        title="Center on my location"
        className={locating ? "busy" : ""}
      >
        ◎
      </button>
    </div>
  );
}
