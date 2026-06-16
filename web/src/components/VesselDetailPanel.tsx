import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { useAlertsStore } from "../store/useAlertsStore";
import {
  classifyVessel,
  hasVesselPosition,
  vesselHeading,
  vesselLabel,
  vesselName,
} from "../lib/vessel";
import { countryFlag } from "../lib/icaoCountry";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

export default function VesselDetailPanel() {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const v = useVesselStore((s) => (selectedMmsi ? s.vessels.get(selectedMmsi) : undefined));
  const clearSelection = useVesselStore((s) => s.clearSelection);
  const flyTo = useMapStore((s) => s.flyTo);
  const watchedSea = useAlertsStore((s) => s.watchedSea);
  const toggleWatchSea = useAlertsStore((s) => s.toggleWatchSea);

  if (!selectedMmsi) return null;

  if (!v) {
    return (
      <div className="detail-panel">
        <div className="detail-header">
          <span className="detail-title">Contact lost</span>
          <button className="detail-close" onClick={clearSelection} aria-label="Close">✕</button>
        </div>
        <p className="detail-empty">This vessel is no longer in the feed.</p>
      </div>
    );
  }

  const heading = vesselHeading(v);
  const pos =
    typeof v.lat === "number" && typeof v.lon === "number"
      ? `${v.lat.toFixed(3)}, ${v.lon.toFixed(3)}`
      : "—";

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span className="detail-title sea">{vesselName(v)}</span>
        <div className="detail-header-actions">
          <button
            className={`detail-star${watchedSea.has(v.mmsi) ? " on" : ""}`}
            onClick={() => toggleWatchSea(v.mmsi)}
            aria-pressed={watchedSea.has(v.mmsi)}
            title={watchedSea.has(v.mmsi) ? "Remove from watchlist" : "Add to watchlist"}
          >
            {watchedSea.has(v.mmsi) ? "★" : "☆"}
          </button>
          <button className="detail-close" onClick={clearSelection} aria-label="Close">✕</button>
        </div>
      </div>
      <div className="detail-class">⚓ {vesselLabel(classifyVessel(v))}</div>
      {classifyVessel(v) === "submarine" && (
        <div className="detail-note">AIS visible only when surfaced</div>
      )}
      <div className="detail-grid">
        <Row label="Type" value={v.type ?? "—"} />
        <Row label="Navy" value={v.country ? `${countryFlag(v.country)} ${v.country}` : "—"} />
        <Row label="Hull" value={v.hull ?? "—"} />
        <Row label="MMSI" value={v.mmsi} />
        <Row label="Speed" value={typeof v.sog === "number" ? `${v.sog.toFixed(0)} kn` : "—"} />
        <Row label="Course" value={`${Math.round(heading)}°`} />
        <Row label="Length" value={typeof v.length === "number" ? `${v.length} m` : "—"} />
        <Row label="Callsign" value={v.callsign ?? "—"} />
        <Row label="Status" value={v.navStatus ?? "Under way"} />
        <Row label="Position" value={pos} />
      </div>
      {hasVesselPosition(v) && (
        <div className="detail-actions">
          <button className="detail-btn" onClick={() => flyTo(v.lat, v.lon)}>
            Center
          </button>
        </div>
      )}
    </div>
  );
}
