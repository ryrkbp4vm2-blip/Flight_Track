import type { TrackedAircraft } from "../../../shared/types";
import { useAircraftStore } from "../store/useAircraftStore";
import { useMapStore } from "../store/useMapStore";
import { altitudeColor, COLOR_EMERGENCY, COLOR_WARNING } from "../map/mapConfig";
import { emergencyInfo } from "../lib/emergency";
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
  const flyTo = useMapStore((s) => s.flyTo);
  const selected = ac.hex === selectedHex;
  const em = emergencyInfo(ac);
  const dotColor = em
    ? em.severity === "critical"
      ? COLOR_EMERGENCY
      : COLOR_WARNING
    : altitudeColor(altitudeFt(ac));

  function onClick() {
    select(ac.hex);
    if (hasPosition(ac)) flyTo(ac.lat, ac.lon);
  }

  return (
    <button
      className={`list-item${selected ? " selected" : ""}${em ? " emergency" : ""}`}
      onClick={onClick}
    >
      <span className={`li-dot${em ? " pulsing" : ""}`} style={{ background: dotColor }} />
      <span className="li-callsign">
        {callsign(ac)}
        {em && <span className="li-emflag">{em.code}</span>}
      </span>
      <span className="li-type">{ac.t ?? "—"}</span>
      <span className="li-alt">{formatAltitude(ac)}</span>
      <span className="li-spd">{formatSpeed(ac)}</span>
    </button>
  );
}
