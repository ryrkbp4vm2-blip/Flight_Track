import { useEffect, useState } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore, showAir, showSea } from "../store/useMapStore";
import { formatAge } from "../lib/format";
import { isEmergency } from "../lib/emergency";

/** Show a "stale" warning once data is older than this. */
const STALE_WARN_MS = 20_000;

export default function StatusBar() {
  const status = useAircraftStore((s) => s.status);
  const total = useAircraftStore((s) => s.aircraft.size);
  const showAllTrails = useMapStore((s) => s.showAllTrails);
  const toggleAllTrails = useMapStore((s) => s.toggleAllTrails);
  const emergencies = useAircraftStore(
    (s) => [...s.aircraft.values()].filter(isEmergency).length,
  );
  const setFilter = useAircraftStore((s) => s.setFilter);
  const vesselCount = useVesselStore((s) => s.vessels.size);
  const layers = useMapStore((s) => s.activeLayers);

  // Re-render every second so the "age" label stays live.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const age = status.lastUpdate ? Date.now() - status.lastUpdate : null;
  const stale = age !== null && age > STALE_WARN_MS;

  return (
    <div className="status-bar">
      <span className="status-count">
        {showAir(layers) && (
          <>
            <strong>{total}</strong> aircraft
          </>
        )}
        {showAir(layers) && showSea(layers) && <span className="status-sep"> · </span>}
        {showSea(layers) && (
          <>
            <strong>{vesselCount}</strong> vessels
          </>
        )}
      </span>
      <span className={`status-age${stale ? " stale" : ""}`}>
        {status.error
          ? `⚠ ${status.error}`
          : age === null
            ? "connecting…"
            : `updated ${formatAge(age)}`}
      </span>
      {emergencies > 0 && (
        <button
          className="status-emergency"
          onClick={() => setFilter("emergency")}
          title="Show aircraft squawking an emergency"
        >
          ⚠ {emergencies} emergency{emergencies > 1 ? " events" : ""}
        </button>
      )}
      {status.sample && <span className="status-badge">SAMPLE DATA</span>}
      <button
        className={`status-toggle${showAllTrails ? " on" : ""}`}
        onClick={toggleAllTrails}
        title="Toggle all flight trails"
      >
        Trails: {showAllTrails ? "All" : "Selected"}
      </button>
    </div>
  );
}
