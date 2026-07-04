import { useMemo } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { classifyAircraft, classLabel, type AircraftClass } from "../lib/classify";
import { classifyVessel, vesselColor, vesselLabel, type VesselClass } from "../lib/vessel";
import { isEmergency } from "../lib/emergency";
import { snapshotCsv, snapshotGeoJSON } from "../lib/export";

function download(name: string, mime: string, text: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

function countBy<T, K extends string>(items: T[], key: (t: T) => K): [K, number][] {
  const m = new Map<K, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({
  rows,
  total,
  color,
}: {
  rows: [string, number, string][];
  total: number;
  color?: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="stats-bars">
      {rows.map(([key, n, label]) => (
        <div className="stats-row" key={key}>
          <span className="stats-label">{label}</span>
          <span className="stats-track">
            <span
              className="stats-fill"
              style={{ width: `${(n / max) * 100}%`, background: color ? color(key) : "#5ad1ff" }}
            />
          </span>
          <span className="stats-num">{n}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="list-empty">No contacts.</p>}
      <div className="stats-total">Total: {total}</div>
    </div>
  );
}

export default function StatsView() {
  const aircraft = useAircraftStore((s) => s.aircraft);
  const vessels = useVesselStore((s) => s.vessels);

  const air = useMemo(() => {
    const list = [...aircraft.values()];
    const rows = countBy<(typeof list)[number], AircraftClass>(list, classifyAircraft).map(
      ([k, n]) => [k, n, classLabel(k)] as [string, number, string],
    );
    return { rows, total: list.length, emergencies: list.filter(isEmergency).length };
  }, [aircraft]);

  const sea = useMemo(() => {
    const list = [...vessels.values()];
    const byClass = countBy<(typeof list)[number], VesselClass>(list, classifyVessel).map(
      ([k, n]) => [k, n, vesselLabel(k)] as [string, number, string],
    );
    const byNavy = countBy(list, (v) => v.country ?? "—").map(
      ([k, n]) => [k, n, k] as [string, number, string],
    );
    return { byClass, byNavy, total: list.length };
  }, [vessels]);

  const vColor = (k: string) => vesselColor(k as VesselClass);

  return (
    <div className="stats-view">
      <div className="stats-section">
        <h3>✈ Aircraft by class</h3>
        <Bars rows={air.rows} total={air.total} />
        {air.emergencies > 0 && (
          <div className="stats-emergency">⚠ {air.emergencies} squawking emergency</div>
        )}
      </div>
      <div className="stats-section">
        <h3>⚓ Vessels by class</h3>
        <Bars rows={sea.byClass} total={sea.total} color={vColor} />
      </div>
      <div className="stats-section">
        <h3>⚓ Vessels by navy</h3>
        <Bars rows={sea.byNavy} total={sea.total} />
      </div>
      <div className="stats-section">
        <h3>⇩ Export snapshot</h3>
        <div className="export-actions">
          <button
            className="detail-btn"
            onClick={() => {
              const air = useAircraftStore.getState();
              const seaState = useVesselStore.getState();
              const fc = snapshotGeoJSON(
                [...air.aircraft.values()],
                [...seaState.vessels.values()],
                air.trails,
                seaState.trails,
              );
              download(`miltrack-${stamp()}.geojson`, "application/geo+json", JSON.stringify(fc, null, 2));
            }}
          >
            GeoJSON
          </button>
          <button
            className="detail-btn"
            onClick={() =>
              download(
                `miltrack-${stamp()}.csv`,
                "text/csv",
                snapshotCsv(
                  [...useAircraftStore.getState().aircraft.values()],
                  [...useVesselStore.getState().vessels.values()],
                ),
              )
            }
          >
            CSV
          </button>
        </div>
        <p className="export-hint">
          Current contacts (and trails, in GeoJSON) for GIS tools or spreadsheets.
        </p>
      </div>
    </div>
  );
}
