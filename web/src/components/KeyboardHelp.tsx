import { SHORTCUTS } from "../hooks/useKeyboard";

/** Modal listing the global keyboard shortcuts. Toggled with "?". */
export default function KeyboardHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="kbd-backdrop" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="kbd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kbd-head">
          <span>Keyboard shortcuts</span>
          <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="kbd-grid">
          {SHORTCUTS.map((s) => (
            <div className="kbd-row" key={s.keys}>
              <span className="kbd-keys">
                {s.keys.split(" / ").map((k, i) => (
                  <span key={k}>
                    {i > 0 && " / "}
                    <kbd>{k}</kbd>
                  </span>
                ))}
              </span>
              <span className="kbd-does">{s.does}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
