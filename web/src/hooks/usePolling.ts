import { useEffect, useRef } from "react";
import { fetchMil } from "../api/client";
import { useAircraftStore } from "../store/useAircraftStore";

/** Poll interval in ms while the tab is visible. */
const POLL_MS = 4000;

/**
 * Polls `/api/mil` on an interval and feeds results into the store. Pauses
 * while the tab is hidden (no point updating an unseen map) and resumes — with
 * an immediate fetch — when it becomes visible again.
 */
export function usePolling(): void {
  const ingest = useAircraftStore((s) => s.ingest);
  const setError = useAircraftStore((s) => s.setError);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    async function tick() {
      controller?.abort();
      controller = new AbortController();
      try {
        const resp = await fetchMil(controller.signal);
        if (cancelled) return;
        ingest(resp);
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    function start() {
      stop();
      void tick();
      timerRef.current = window.setInterval(tick, POLL_MS);
    }

    function stop() {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      controller?.abort();
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ingest, setError]);
}
