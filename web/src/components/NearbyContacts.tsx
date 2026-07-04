import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { callsign } from "../lib/format";
import { vesselName, vesselHeading } from "../lib/vessel";
import { formatDistance } from "../lib/units";
import { nearest, compassPoint } from "../lib/proximity";
import { closestPointOfApproach, isConverging, type MotionState } from "../lib/cpa";

interface Contact {
  domain: "air" | "sea";
  id: string;
  label: string;
  lat: number;
  lon: number;
  /** Velocity when known — enables the CPA convergence check. */
  motion?: MotionState;
}

/**
 * The nearest air/sea contacts to a point (the selected contact), ranked by
 * great-circle distance. Each row jumps to that contact when clicked.
 */
export default function NearbyContacts({
  lat,
  lon,
  selfDomain,
  selfId,
}: {
  lat: number;
  lon: number;
  selfDomain: "air" | "sea";
  selfId: string;
}) {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const vessels = useVesselStore((s) => s.vessels);
  const units = useMapStore((s) => s.units);
  const flyTo = useMapStore((s) => s.flyTo);
  const selectAir = useAircraftStore((s) => s.select);
  const selectSea = useVesselStore((s) => s.select);

  const contacts: Contact[] = [];
  for (const ac of aircraft.values()) {
    if (selfDomain === "air" && ac.hex === selfId) continue;
    if (typeof ac.lat === "number" && typeof ac.lon === "number") {
      const motion =
        typeof ac.gs === "number" && typeof ac.track === "number"
          ? { lat: ac.lat, lon: ac.lon, speedKt: ac.gs, headingDeg: ac.track }
          : undefined;
      contacts.push({ domain: "air", id: ac.hex, label: callsign(ac), lat: ac.lat, lon: ac.lon, motion });
    }
  }
  for (const v of vessels.values()) {
    if (selfDomain === "sea" && v.mmsi === selfId) continue;
    if (typeof v.lat === "number" && typeof v.lon === "number") {
      const motion =
        typeof v.sog === "number"
          ? { lat: v.lat, lon: v.lon, speedKt: v.sog, headingDeg: vesselHeading(v) }
          : undefined;
      contacts.push({ domain: "sea", id: v.mmsi, label: vesselName(v), lat: v.lat, lon: v.lon, motion });
    }
  }

  // Self velocity, for the convergence check against each neighbour.
  const selfMotion: MotionState | undefined = (() => {
    if (selfDomain === "air") {
      const me = aircraft.get(selfId);
      return me && typeof me.gs === "number" && typeof me.track === "number"
        ? { lat, lon, speedKt: me.gs, headingDeg: me.track }
        : undefined;
    }
    const me = vessels.get(selfId);
    return me && typeof me.sog === "number"
      ? { lat, lon, speedKt: me.sog, headingDeg: vesselHeading(me) }
      : undefined;
  })();

  const near = nearest({ lat, lon }, contacts, 5);
  if (near.length === 0) return null;

  function open(c: Contact) {
    if (c.domain === "air") selectAir(c.id);
    else selectSea(c.id);
    flyTo(c.lat, c.lon);
  }

  return (
    <div className="nearby">
      <div className="nearby-head">Nearby</div>
      {near.map((n) => {
        const cpa =
          selfMotion && n.item.motion
            ? closestPointOfApproach(selfMotion, n.item.motion)
            : null;
        const converging = isConverging(cpa);
        return (
          <button key={`${n.item.domain}:${n.item.id}`} className="nearby-row" onClick={() => open(n.item)}>
            <span className={`nearby-icon ${n.item.domain}`}>{n.item.domain === "air" ? "✈" : "⚓"}</span>
            <span className="nearby-name">{n.item.label}</span>
            <span className="nearby-dist">{formatDistance(n.distanceNm, units)}</span>
            <span className="nearby-brg">
              {Math.round(n.bearing)}° {compassPoint(n.bearing)}
            </span>
            {converging && (
              <span className="nearby-cpa">
                ⚠ CPA {formatDistance(cpa.cpaNm, units)} in {Math.max(1, Math.round(cpa.minutesToCpa))}m
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
