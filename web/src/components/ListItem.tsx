import type { TrackedAircraft } from "../../../shared/types";
import { useAircraftStore } from "../store/useAircraftStore";
import { altitudeColor } from "../map/mapConfig";
import {
  altitudeFt,
  callsign,
  formatAltitude,
  formatSpeed,
  hasPosition,
} from "../lib/format";

export default function ListItem({ ac }: { ac: TrackedAircraft }) {
  const selectedHex = useAircraftStore((s) => s.selectedHex);
  const select = useAircraftStore((s) => s.select);
  const flyTo = useAircraftStore((s) => s.flyTo);
  const selected = ac.hex === selectedHex;

  function onClick() {
    select(ac.hex);
    if (hasPosition(ac)) flyTo(ac.lat, ac.lon);
  }

  return (
    <button className={`list-item${selected ? " selected" : ""}`} onClick={onClick}>
      <span className="li-dot" style={{ background: altitudeColor(altitudeFt(ac)) }} />
      <span className="li-callsign">{callsign(ac)}</span>
      <span className="li-type">{ac.t ?? "—"}</span>
      <span className="li-alt">{formatAltitude(ac)}</span>
      <span className="li-spd">{formatSpeed(ac)}</span>
    </button>
  );
}
