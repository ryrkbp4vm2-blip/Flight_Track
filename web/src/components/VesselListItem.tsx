import type { TrackedVessel } from "../../../shared/types";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { classifyVessel, hasVesselPosition, vesselColor, vesselName } from "../lib/vessel";

export default function VesselListItem({ v }: { v: TrackedVessel }) {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const select = useVesselStore((s) => s.select);
  const flyTo = useMapStore((s) => s.flyTo);
  const selected = v.mmsi === selectedMmsi;

  function onClick() {
    select(v.mmsi);
    if (hasVesselPosition(v)) flyTo(v.lat, v.lon);
  }

  return (
    <button className={`list-item vessel${selected ? " selected" : ""}`} onClick={onClick}>
      <span className="li-dot" style={{ background: vesselColor(classifyVessel(v)) }} />
      <span className="li-callsign">{vesselName(v)}</span>
      <span className="li-type">{v.type ?? "—"}</span>
      <span className="li-alt">{typeof v.sog === "number" ? `${v.sog.toFixed(0)} kn` : "—"}</span>
      <span className="li-spd">{v.country ?? "—"}</span>
    </button>
  );
}
