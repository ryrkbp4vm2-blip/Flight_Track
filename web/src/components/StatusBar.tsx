import { useEffect, useState } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { formatAge } from "../lib/format";

/** Show a "stale" warning once data is older than this. */
const STALE_WARN_MS = 20_000;

export default function StatusBar() {
  const status = useAircraftStore((s) => s.status);
  const total = useAircraftStore((s) => s.aircraft.size);
  const showAllTrails = useAircraftStore((s) => s.showAllTrails);
  const toggleAllTrails = useAircraftStore((s) => s.toggleAllTrails);

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
        <strong>{total}</strong> military aircraft
      </span>
      <span className={`status-age${stale ? " stale" : ""}`}>
        {status.error
          ? `⚠ ${status.error}`
          : age === null
            ? "connecting…"
            : `updated ${formatAge(age)}`}
      </span>
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
