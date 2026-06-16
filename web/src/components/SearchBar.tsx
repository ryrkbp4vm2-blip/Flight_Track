import { useAircraftStore } from "../store/useAircraftStore";

export default function SearchBar() {
  const filterText = useAircraftStore((s) => s.filterText);
  const setFilter = useAircraftStore((s) => s.setFilter);

  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden>⌕</span>
      <input
        type="search"
        inputMode="search"
        placeholder="Search callsign, type, hex…"
        value={filterText}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Search aircraft"
      />
      {filterText && (
        <button className="search-clear" onClick={() => setFilter("")} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
