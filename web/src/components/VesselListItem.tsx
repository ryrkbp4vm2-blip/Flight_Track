import type { TrackedVessel } from "../../../shared/types";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { classifyVessel, hasVesselPosition, vesselColor, vesselName } from "../lib/vessel";
import { formatSpeed } from "../lib/units";

export default function VesselListItem({ v }: { v: TrackedVessel }) {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const select = useVesselStore((s) => s.select);
  const flyTo = useMapStore((s) => s.flyTo);
  const units = useMapStore((s) => s.units);
  const watched = useAlertsStore((s) => s.watchedSea.has(v.mmsi));
  const selected = v.mmsi === selectedMmsi;

  function onClick() {
    select(v.mmsi);
    if (hasVesselPosition(v)) flyTo(v.lat, v.lon);
  }

  return (
    <button className={`list-item vessel${selected ? " selected" : ""}`} onClick={onClick}>
      <span className="li-dot" style={{ background: vesselColor(classifyVessel(v)) }} />
      <span className="li-callsign">
        {watched && <span className="li-star">★</span>}
        {vesselName(v)}
      </span>
      <span className="li-type">{v.type ?? "—"}</span>
      <span className="li-alt">{typeof v.sog === "number" ? formatSpeed(v.sog, units) : "—"}</span>
      <span className="li-spd">{v.country ?? "—"}</span>
    </button>
  );
}
