import { useState } from "react";
import MapView from "./map/MapView";
import SearchBar from "./components/SearchBar";
import StatusBar from "./components/StatusBar";
import DetailPanel from "./components/DetailPanel";
import VesselDetailPanel from "./components/VesselDetailPanel";
import ListPanel, { type Tab } from "./components/ListPanel";
import LayerToggle from "./components/LayerToggle";
import MapControls from "./components/MapControls";
import FilterChips from "./components/FilterChips";
import AlertToasts from "./components/AlertToasts";
import Legend from "./components/Legend";
import KeyboardHelp from "./components/KeyboardHelp";
import PlaybackBar from "./components/PlaybackBar";
import { useMapStore } from "./store/useMapStore";
import { useAlertsStore } from "./store/useAlertsStore";
import { usePolling } from "./hooks/usePolling";
import { useUrlSync } from "./hooks/useUrlSync";
import { useKeyboard } from "./hooks/useKeyboard";
import { useAlerts } from "./hooks/useAlerts";

export default function App() {
  usePolling();
  useUrlSync();
  useAlerts();
  const [listOpen, setListOpen] = useState(false);
  const [listTab, setListTab] = useState<Tab>("air");
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboard({
    open: helpOpen,
    toggle: () => setHelpOpen((v) => !v),
    close: () => setHelpOpen(false),
  });
  const unread = useAlertsStore((s) => s.unread);
  const markRead = useAlertsStore((s) => s.markRead);
  const playback = useMapStore((s) => s.playback);

  function openAlerts() {
    setListTab("alerts");
    setListOpen(true);
    markRead();
  }

  return (
    <div className={`app${playback ? " playback-on" : ""}`}>
      <MapView />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-glyph" aria-hidden>✈</span>
          <span className="brand-text">MilTrack</span>
        </div>
        <SearchBar />
        <button
          className={`list-toggle bell${unread > 0 ? " has-unread" : ""}`}
          onClick={openAlerts}
          aria-label="Alerts"
        >
          🔔
          {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
        <button
          className={`list-toggle${listOpen ? " active" : ""}`}
          onClick={() => setListOpen((v) => !v)}
          aria-label="Toggle list"
        >
          ☰
        </button>
      </header>

      <FilterChips />
      <AlertToasts />

      {listOpen && (
        <ListPanel
          tab={listTab}
          onTab={(t) => {
            setListTab(t);
            if (t === "alerts") markRead();
          }}
          onClose={() => setListOpen(false)}
        />
      )}

      <LayerToggle />
      <MapControls />
      <Legend />
      <DetailPanel />
      <VesselDetailPanel />
      <StatusBar />
      {playback && <PlaybackBar />}
      {helpOpen && <KeyboardHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
