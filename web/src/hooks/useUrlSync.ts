import { useEffect } from "react";
import { useAircraftStore } from "../store/useAircraftStore";

/** Hash param holding the selected aircraft hex, e.g. `#sel=ae1234`. */
function readSelFromHash(): string | null {
  const m = /(?:^#|&)sel=([0-9a-fA-F]{6})/.exec(window.location.hash);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Two-way sync between the selected aircraft and the URL hash, making a
 * selection shareable and restorable on reload. Also responds to back/forward.
 */
export function useUrlSync(): void {
  const select = useAircraftStore((s) => s.select);

  useEffect(() => {
    // Restore selection from the initial URL.
    const initial = readSelFromHash();
    if (initial) select(initial);

    // Push store -> URL when the selection changes.
    const unsub = useAircraftStore.subscribe((state, prev) => {
      if (state.selectedHex === prev.selectedHex) return;
      const next = state.selectedHex ? `#sel=${state.selectedHex}` : " ";
      if (next.trim() !== window.location.hash) {
        history.replaceState(null, "", state.selectedHex ? next : window.location.pathname);
      }
    });

    // Respond to manual hash edits / back-forward navigation.
    const onHash = () => select(readSelFromHash());
    window.addEventListener("hashchange", onHash);

    return () => {
      unsub();
      window.removeEventListener("hashchange", onHash);
    };
  }, [select]);
}
