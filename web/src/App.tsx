import { useState } from "react";
import MapView from "./map/MapView";
import SearchBar from "./components/SearchBar";
import StatusBar from "./components/StatusBar";
import DetailPanel from "./components/DetailPanel";
import VesselDetailPanel from "./components/VesselDetailPanel";
import ListPanel from "./components/ListPanel";
import LayerToggle from "./components/LayerToggle";
import MapControls from "./components/MapControls";
import Legend from "./components/Legend";
import { usePolling } from "./hooks/usePolling";
import { useUrlSync } from "./hooks/useUrlSync";

export default function App() {
  usePolling();
  useUrlSync();
  const [listOpen, setListOpen] = useState(false);

  return (
    <div className="app">
      <MapView />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-glyph" aria-hidden>✈</span>
          <span className="brand-text">MilTrack</span>
        </div>
        <SearchBar />
        <button
          className={`list-toggle${listOpen ? " active" : ""}`}
          onClick={() => setListOpen((v) => !v)}
          aria-label="Toggle aircraft list"
        >
          ☰
        </button>
      </header>

      {listOpen && <ListPanel onClose={() => setListOpen(false)} />}

      <LayerToggle />
      <MapControls />
      <Legend />
      <DetailPanel />
      <VesselDetailPanel />
      <StatusBar />
    </div>
  );
}
