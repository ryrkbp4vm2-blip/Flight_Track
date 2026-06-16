import { useMemo } from "react";
import { useAircraftStore, type SortKey } from "../store/useAircraftStore";
import { filterAircraft, sortAircraft } from "../store/selectors";
import ListItem from "./ListItem";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "callsign", label: "Callsign" },
  { key: "type", label: "Type" },
  { key: "altitude", label: "Alt" },
  { key: "speed", label: "Spd" },
];

export default function AircraftList({ onClose }: { onClose: () => void }) {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const filterText = useAircraftStore((s) => s.filterText);
  const sortKey = useAircraftStore((s) => s.sortKey);
  const sortDir = useAircraftStore((s) => s.sortDir);
  const setSort = useAircraftStore((s) => s.setSort);

  const rows = useMemo(() => {
    const list = filterAircraft([...aircraft.values()], filterText);
    return sortAircraft(list, sortKey, sortDir);
  }, [aircraft, filterText, sortKey, sortDir]);

  return (
    <div className="list-panel">
      <div className="list-header">
        <span className="list-title">Tracked aircraft ({rows.length})</span>
        <button className="list-close" onClick={onClose} aria-label="Close list">✕</button>
      </div>
      <div className="list-cols">
        <span className="li-dot" />
        {COLUMNS.map((c) => (
          <button
            key={c.key}
            className={`col-head col-${c.key}${sortKey === c.key ? " active" : ""}`}
            onClick={() => setSort(c.key)}
          >
            {c.label}
            {sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
          </button>
        ))}
      </div>
      <div className="list-scroll">
        {rows.length === 0 ? (
          <p className="list-empty">No aircraft match.</p>
        ) : (
          rows.map((ac) => <ListItem key={ac.hex} ac={ac} />)
        )}
      </div>
    </div>
  );
}
