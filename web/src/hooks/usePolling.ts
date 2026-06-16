import { useEffect, useRef } from "react";
import { fetchMil, fetchVessels } from "../api/client";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";

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
  const ingestVessels = useVesselStore((s) => s.ingest);
  const setVesselError = useVesselStore((s) => s.setError);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    async function tick() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      await Promise.all([
        fetchMil(signal)
          .then(({ data, sample }) => !cancelled && ingest(data, { sample }))
          .catch((err: Error) => {
            if (!cancelled && err.name !== "AbortError") setError(err.message);
          }),
        fetchVessels(signal)
          .then(({ data, sample }) => !cancelled && ingestVessels(data, { sample }))
          .catch((err: Error) => {
            if (!cancelled && err.name !== "AbortError") setVesselError(err.message);
          }),
      ]);
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
  }, [ingest, setError, ingestVessels, setVesselError]);
}
