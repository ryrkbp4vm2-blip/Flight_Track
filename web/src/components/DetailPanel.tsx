import { useAircraftStore } from "../store/useAircraftStore";
import { classLabel, classifyAircraft } from "../lib/classify";
import { emergencyInfo } from "../lib/emergency";
import {
  callsign,
  formatAltitude,
  formatHeading,
  formatPosition,
  formatSpeed,
  formatVerticalRate,
  hasPosition,
} from "../lib/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

export default function DetailPanel() {
  const selectedHex = useAircraftStore((s) => s.selectedHex);
  const ac = useAircraftStore((s) => (selectedHex ? s.aircraft.get(selectedHex) : undefined));
  const select = useAircraftStore((s) => s.select);
  const flyTo = useAircraftStore((s) => s.flyTo);
  const followSelected = useAircraftStore((s) => s.followSelected);
  const toggleFollow = useAircraftStore((s) => s.toggleFollow);

  if (!selectedHex) return null;

  // Selected aircraft dropped out of the feed.
  if (!ac) {
    return (
      <div className="detail-panel">
        <div className="detail-header">
          <span className="detail-title">Signal lost</span>
          <button className="detail-close" onClick={() => select(null)} aria-label="Close">✕</button>
        </div>
        <p className="detail-empty">This aircraft is no longer in the feed.</p>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span className="detail-title">{callsign(ac)}</span>
        <button className="detail-close" onClick={() => select(null)} aria-label="Close">✕</button>
      </div>
      <div className="detail-class">{classLabel(classifyAircraft(ac))}</div>
      {(() => {
        const em = emergencyInfo(ac);
        return em ? (
          <div className={`detail-emergency ${em.severity}`}>
            ⚠ {em.label} · squawk {ac.squawk ?? em.code}
          </div>
        ) : null;
      })()}
      <div className="detail-grid">
        <Row label="Type" value={ac.t ?? "—"} />
        <Row label="Registration" value={ac.r ?? "—"} />
        <Row label="Hex" value={ac.hex.toUpperCase()} />
        <Row label="Squawk" value={ac.squawk ?? "—"} />
        <Row label="Altitude" value={formatAltitude(ac)} />
        <Row label="Vertical" value={formatVerticalRate(ac)} />
        <Row label="Speed" value={formatSpeed(ac)} />
        <Row label="Heading" value={formatHeading(ac)} />
        <Row label="Position" value={formatPosition(ac)} />
        {ac.emergency && ac.emergency !== "none" && (
          <Row label="Emergency" value={ac.emergency} />
        )}
      </div>
      {hasPosition(ac) && (
        <div className="detail-actions">
          <button className="detail-btn" onClick={() => flyTo(ac.lat, ac.lon)}>
            Center
          </button>
          <button
            className={`detail-btn${followSelected ? " active" : ""}`}
            onClick={toggleFollow}
            aria-pressed={followSelected}
          >
            {followSelected ? "Following ✓" : "Follow"}
          </button>
        </div>
      )}
    </div>
  );
}
