import { useEffect, useState } from "react";
import { useAlertsStore } from "../store/useAlertsStore";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useMapStore } from "../store/useMapStore";

const VISIBLE_MS = 8000;
const MAX_TOASTS = 4;

/** Top-center stack of recent alerts; auto-dismiss, click to focus the contact. */
export default function AlertToasts() {
  const log = useAlertsStore((s) => s.log);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Auto-dismiss the newest alerts after a delay.
  useEffect(() => {
    if (log.length === 0) return;
    const newest = log[0];
    const t = window.setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(newest.id));
    }, VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [log]);

  const shown = log.filter((a) => !dismissed.has(a.id)).slice(0, MAX_TOASTS);
  if (shown.length === 0) return null;

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

  return (
    <div className="toasts">
      {shown.map((a) => (
        <button
          key={a.id}
          className={`toast ${a.kind}`}
          onClick={() => {
            focus(a.domain, a.ref);
            setDismissed((prev) => new Set(prev).add(a.id));
          }}
        >
          <span className="toast-icon">{a.kind === "emergency" ? "⚠" : "★"}</span>
          <span className="toast-text">
            <strong>{a.title}</strong>
            <span className="toast-body">{a.body}</span>
          </span>
          <span
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed((prev) => new Set(prev).add(a.id));
            }}
          >
            ✕
          </span>
        </button>
      ))}
    </div>
  );
}
