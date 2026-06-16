import { useAircraftStore } from "../store/useAircraftStore";
import { useMapStore, showAir, showSea } from "../store/useMapStore";
import type { AircraftClass } from "../lib/classify";
import type { VesselClass } from "../lib/vessel";
import { vesselColor } from "../lib/vessel";

const AIR_CHIPS: { cls: AircraftClass; label: string }[] = [
  { cls: "fighter", label: "Fighters" },
  { cls: "heavy", label: "Heavies" },
  { cls: "rotor", label: "Helis" },
  { cls: "drone", label: "Drones" },
  { cls: "plane", label: "Other" },
];

const SEA_CHIPS: { cls: VesselClass; label: string }[] = [
  { cls: "carrier", label: "Carriers" },
  { cls: "amphibious", label: "Amphib" },
  { cls: "combatant", label: "Combatants" },
  { cls: "submarine", label: "Subs" },
  { cls: "patrol", label: "Patrol" },
  { cls: "support", label: "Support" },
];

/** Contextual quick-filter chips for class (and emergency), below the top bar. */
export default function FilterChips() {
  const layers = useMapStore((s) => s.activeLayers);
  const airClassFilter = useMapStore((s) => s.airClassFilter);
  const seaClassFilter = useMapStore((s) => s.seaClassFilter);
  const toggleAirClass = useMapStore((s) => s.toggleAirClass);
  const toggleSeaClass = useMapStore((s) => s.toggleSeaClass);
  const filterText = useAircraftStore((s) => s.filterText);
  const setFilter = useAircraftStore((s) => s.setFilter);

  const air = showAir(layers);
  const sea = showSea(layers);
  const emergencyOn = filterText.trim().toLowerCase() === "emergency";

  return (
    <div className="filter-chips">
      {air && (
        <button
          className={`chip emergency${emergencyOn ? " active" : ""}`}
          onClick={() => setFilter(emergencyOn ? "" : "emergency")}
        >
          ⚠ Emergency
        </button>
      )}
      {air &&
        AIR_CHIPS.map((c) => (
          <button
            key={c.cls}
            className={`chip${airClassFilter.has(c.cls) ? " active" : ""}`}
            onClick={() => toggleAirClass(c.cls)}
          >
            {c.label}
          </button>
        ))}
      {air && sea && <span className="chip-sep" />}
      {sea &&
        SEA_CHIPS.map((c) => (
          <button
            key={c.cls}
            className={`chip${seaClassFilter.has(c.cls) ? " active" : ""}`}
            onClick={() => toggleSeaClass(c.cls)}
            style={seaClassFilter.has(c.cls) ? { borderColor: vesselColor(c.cls), color: vesselColor(c.cls) } : undefined}
          >
            {c.label}
          </button>
        ))}
    </div>
  );
}
