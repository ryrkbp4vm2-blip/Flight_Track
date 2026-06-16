import { useMemo } from "react";
import { useAircraftStore, type SortKey } from "../store/useAircraftStore";
import { useVesselStore, type VesselSortKey } from "../store/useVesselStore";
import { useMapStore, airClassAllowed, seaClassAllowed } from "../store/useMapStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { filterAircraft, sortAircraft } from "../store/selectors";
import { classifyAircraft } from "../lib/classify";
import { classifyVessel, vesselMatches, vesselName } from "../lib/vessel";
import ListItem from "./ListItem";
import VesselListItem from "./VesselListItem";
import StatsView from "./StatsView";
import AlertsView from "./AlertsView";

export type Tab = "air" | "sea" | "stats" | "alerts";

const AIR_COLS: { key: SortKey; label: string }[] = [
  { key: "callsign", label: "Callsign" },
  { key: "type", label: "Type" },
  { key: "altitude", label: "Alt" },
  { key: "speed", label: "Spd" },
];
const SEA_COLS: { key: VesselSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "speed", label: "Spd" },
  { key: "country", label: "Navy" },
];

export default function ListPanel({
  tab,
  onTab,
  onClose,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onClose: () => void;
}) {
  const unread = useAlertsStore((s) => s.unread);

  // Aircraft data
  const aircraft = useAircraftStore((s) => s.aircraft);
  const filterText = useAircraftStore((s) => s.filterText);
  const airSortKey = useAircraftStore((s) => s.sortKey);
  const airSortDir = useAircraftStore((s) => s.sortDir);
  const setAirSort = useAircraftStore((s) => s.setSort);

  // Vessel data
  const vessels = useVesselStore((s) => s.vessels);
  const seaSortKey = useVesselStore((s) => s.sortKey);
  const seaSortDir = useVesselStore((s) => s.sortDir);
  const setSeaSort = useVesselStore((s) => s.setSort);

  // Class chip filters
  const airClassFilter = useMapStore((s) => s.airClassFilter);
  const seaClassFilter = useMapStore((s) => s.seaClassFilter);

  const airRows = useMemo(() => {
    const list = filterAircraft([...aircraft.values()], filterText).filter((ac) =>
      airClassAllowed(airClassFilter, classifyAircraft(ac)),
    );
    return sortAircraft(list, airSortKey, airSortDir);
  }, [aircraft, filterText, airSortKey, airSortDir, airClassFilter]);

  const seaRows = useMemo(() => {
    const list = [...vessels.values()]
      .filter((v) => vesselMatches(v, filterText))
      .filter((v) => seaClassAllowed(seaClassFilter, classifyVessel(v)));
    const dir = seaSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (seaSortKey) {
        case "name":
          cmp = vesselName(a).localeCompare(vesselName(b));
          break;
        case "type":
          cmp = (a.type ?? "").localeCompare(b.type ?? "");
          break;
        case "country":
          cmp = (a.country ?? "").localeCompare(b.country ?? "");
          break;
        case "speed":
          cmp = (a.sog ?? -1) - (b.sog ?? -1);
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [vessels, filterText, seaSortKey, seaSortDir, seaClassFilter]);

  return (
    <div className="list-panel">
      <div className="list-header">
        <div className="list-tabs">
          <button className={tab === "air" ? "active" : ""} onClick={() => onTab("air")}>
            ✈ Aircraft <span className="tab-count">{airRows.length}</span>
          </button>
          <button className={tab === "sea" ? "active" : ""} onClick={() => onTab("sea")}>
            ⚓ Vessels <span className="tab-count">{seaRows.length}</span>
          </button>
          <button className={tab === "stats" ? "active" : ""} onClick={() => onTab("stats")}>
            ▦ Stats
          </button>
          <button className={tab === "alerts" ? "active" : ""} onClick={() => onTab("alerts")}>
            🔔 Alerts{unread > 0 && <span className="tab-count alert">{unread}</span>}
          </button>
        </div>
        <button className="list-close" onClick={onClose} aria-label="Close list">✕</button>
      </div>

      {(tab === "air" || tab === "sea") && (
      <div className="list-cols">
        <span className="li-dot" />
        {tab === "air"
          ? AIR_COLS.map((c) => (
              <button
                key={c.key}
                className={`col-head col-${c.key}${airSortKey === c.key ? " active" : ""}`}
                onClick={() => setAirSort(c.key)}
              >
                {c.label}
                {airSortKey === c.key ? (airSortDir === "asc" ? " ▲" : " ▼") : ""}
              </button>
            ))
          : SEA_COLS.map((c) => (
              <button
                key={c.key}
                className={`col-head col-${c.key}${seaSortKey === c.key ? " active" : ""}`}
                onClick={() => setSeaSort(c.key)}
              >
                {c.label}
                {seaSortKey === c.key ? (seaSortDir === "asc" ? " ▲" : " ▼") : ""}
              </button>
            ))}
      </div>
      )}

      <div className="list-scroll">
        {tab === "stats" ? (
          <StatsView />
        ) : tab === "alerts" ? (
          <AlertsView />
        ) : tab === "air" ? (
          airRows.length === 0 ? (
            <p className="list-empty">No aircraft match.</p>
          ) : (
            airRows.map((ac) => <ListItem key={ac.hex} ac={ac} />)
          )
        ) : seaRows.length === 0 ? (
          <p className="list-empty">No vessels match.</p>
        ) : (
          seaRows.map((v) => <VesselListItem key={v.mmsi} v={v} />)
        )}
      </div>
    </div>
  );
}
