import { useState } from "react";
import { useAlertsStore, type AlertSettings } from "../store/useAlertsStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";
import { formatAge } from "../lib/format";
import { UNIT_SYSTEMS } from "../lib/units";
import { COORD_FORMATS } from "../lib/coords";

const TOGGLES: { key: keyof AlertSettings; label: string }[] = [
  { key: "emergency", label: "Emergency squawks" },
  { key: "watchlist", label: "Watchlist appearances" },
  { key: "sound", label: "Sound" },
];

export default function AlertsView() {
  const log = useAlertsStore((s) => s.log);
  const settings = useAlertsStore((s) => s.settings);
  const setSetting = useAlertsStore((s) => s.setSetting);
  const clearLog = useAlertsStore((s) => s.clearLog);
  const units = useMapStore((s) => s.units);
  const setUnits = useMapStore((s) => s.setUnits);
  const coords = useMapStore((s) => s.coords);
  const setCoords = useMapStore((s) => s.setCoords);
  const [, tick] = useState(0);

  function focus(domain: "air" | "sea", ref: string) {
    if (domain === "air") {
      useAircraftStore.getState().select(ref);
      const a = useAircraftStore.getState().aircraft.get(ref);
      if (a?.lat != null && a?.lon != null) useMapStore.getState().flyTo(a.lat, a.lon);
    } else {
      useVesselStore.getState().select(ref);
      const v = useVesselStore.getState().vessels.get(ref);
      if (v?.lat != null && v?.lon != null) useMapStore.getState().flyTo(v.lat, v.lon);
    }
  }

  async function enablePush() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setSetting("push", perm === "granted");
    tick((n) => n + 1);
  }

  const pushState =
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission === "granted"
        ? settings.push
          ? "on"
          : "off"
        : "blocked";

  return (
    <div className="alerts-view">
      <div className="alerts-settings">
        <div className="units-select">
          <span className="units-label">Units</span>
          <div className="units-seg" role="group" aria-label="Unit system">
            {UNIT_SYSTEMS.map((u) => (
              <button
                key={u.key}
                className={`units-seg-btn${units === u.key ? " on" : ""}`}
                aria-pressed={units === u.key}
                title={u.hint}
                onClick={() => setUnits(u.key)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
        <div className="units-select">
          <span className="units-label">Position</span>
          <div className="units-seg" role="group" aria-label="Coordinate format">
            {COORD_FORMATS.map((c) => (
              <button
                key={c.key}
                className={`units-seg-btn${coords === c.key ? " on" : ""}`}
                aria-pressed={coords === c.key}
                title={c.hint}
                onClick={() => setCoords(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {TOGGLES.map((t) => (
          <label key={t.key} className="alert-toggle">
            <input
              type="checkbox"
              checked={settings[t.key]}
              onChange={(e) => setSetting(t.key, e.target.checked)}
            />
            {t.label}
          </label>
        ))}
        <div className="alert-push">
          <span>Browser notifications</span>
          {pushState === "unsupported" ? (
            <span className="push-na">unsupported</span>
          ) : pushState === "blocked" ? (
            <button onClick={enablePush}>Enable</button>
          ) : (
            <label className="alert-toggle inline">
              <input
                type="checkbox"
                checked={settings.push}
                onChange={(e) => setSetting("push", e.target.checked)}
              />
              {settings.push ? "On" : "Off"}
            </label>
          )}
        </div>
      </div>

      <div className="alerts-log-head">
        <span>Recent alerts</span>
        {log.length > 0 && (
          <button className="alerts-clear" onClick={clearLog}>
            Clear
          </button>
        )}
      </div>

      {log.length === 0 ? (
        <p className="list-empty">No alerts yet.</p>
      ) : (
        log.map((a) => (
          <button key={a.id} className={`alert-row ${a.kind}`} onClick={() => focus(a.domain, a.ref)}>
            <span className="alert-row-icon">{a.kind === "emergency" ? "⚠" : "★"}</span>
            <span className="alert-row-text">
              <strong>{a.title}</strong>
              <span className="alert-row-body">{a.body}</span>
            </span>
            <span className="alert-row-age">{formatAge(Date.now() - a.ts)}</span>
          </button>
        ))
      )}
    </div>
  );
}
