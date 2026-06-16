import { useState } from "react";

const BANDS: { color: string; label: string }[] = [
  { color: "#b794ff", label: "40k+ ft" },
  { color: "#5ad1ff", label: "30–40k" },
  { color: "#9be15d", label: "20–30k" },
  { color: "#ffd23f", label: "10–20k" },
  { color: "#ff7a59", label: "0–10k" },
  { color: "#7a8794", label: "Ground" },
];

/** Compact, collapsible key for the altitude color ramp. */
export default function Legend() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`legend${open ? " open" : ""}`}>
      <button className="legend-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "Altitude ▾" : "Altitude ▴"}
      </button>
      {open && (
        <div className="legend-bands">
          {BANDS.map((b) => (
            <div className="legend-row" key={b.label}>
              <span className="legend-swatch" style={{ background: b.color }} />
              <span className="legend-label">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
