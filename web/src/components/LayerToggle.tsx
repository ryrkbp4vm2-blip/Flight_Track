import { useMapStore, type LayerMode } from "../store/useMapStore";

const MODES: { mode: LayerMode; label: string; glyph: string }[] = [
  { mode: "both", label: "Both", glyph: "✈⚓" },
  { mode: "air", label: "Air", glyph: "✈" },
  { mode: "sea", label: "Sea", glyph: "⚓" },
];

/** Segmented control to choose which layers (aircraft / vessels) are shown. */
export default function LayerToggle() {
  const activeLayers = useMapStore((s) => s.activeLayers);
  const setLayers = useMapStore((s) => s.setLayers);

  return (
    <div className="layer-toggle">
      {MODES.map((m) => (
        <button
          key={m.mode}
          className={activeLayers === m.mode ? "active" : ""}
          onClick={() => setLayers(m.mode)}
          title={`Show ${m.label.toLowerCase()}`}
        >
          <span className="lt-glyph">{m.glyph}</span>
          <span className="lt-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
