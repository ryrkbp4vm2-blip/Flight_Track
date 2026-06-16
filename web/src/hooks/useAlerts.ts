import { useEffect } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useVesselStore } from "../store/useVesselStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { emergencyInfo, isEmergency } from "../lib/emergency";
import { callsign } from "../lib/format";
import { vesselName } from "../lib/vessel";
import { newlyTrue, intersect } from "../lib/alerts";

/**
 * Alert engine: watches the aircraft/vessel stores and raises alerts when an
 * aircraft newly squawks an emergency or a watchlisted contact appears in
 * coverage. Mounted once from App. Delivery = alert log (toasts) + optional
 * beep + optional browser notification (when the tab is hidden).
 */
export function useAlerts(): void {
  useEffect(() => {
    const prevEmergency = new Set<string>();
    let prevPresentAir = new Set<string>();
    let prevPresentSea = new Set<string>();
    let seeded = false;
    let audio: AudioContext | null = null;

    function beep() {
      try {
        audio ??= new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audio.state === "suspended") void audio.resume();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25);
        osc.connect(gain).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.26);
      } catch {
        /* audio unavailable */
      }
    }

    function notify(title: string, body: string) {
      if (typeof Notification === "undefined") return;
      if (Notification.permission === "granted" && document.hidden) {
        try {
          new Notification(title, { body });
        } catch {
          /* ignore */
        }
      }
    }

    function evaluate() {
      const { settings, watchedAir, watchedSea, pushAlert } = useAlertsStore.getState();
      const ac = useAircraftStore.getState().aircraft;
      const vs = useVesselStore.getState().vessels;

      const presentAir = new Set(ac.keys());
      const presentSea = new Set(vs.keys());
      const currentEmergency = new Set<string>();
      for (const a of ac.values()) if (isEmergency(a)) currentEmergency.add(a.hex);

      let delivered = false;

      // Emergencies fire even on first load (an existing emergency is news).
      if (settings.emergency) {
        for (const hex of newlyTrue(prevEmergency, currentEmergency)) {
          const a = ac.get(hex);
          const info = a ? emergencyInfo(a) : null;
          const title = `${a ? callsign(a) : hex} — emergency`;
          const body = info ? `${info.label} · squawk ${a?.squawk ?? info.code}` : "Emergency squawk";
          pushAlert({ kind: "emergency", domain: "air", ref: hex, title, body });
          notify(title, body);
          delivered = true;
        }
      }
      prevEmergency.clear();
      for (const h of currentEmergency) prevEmergency.add(h);

      // Watchlist appearances are seeded on first run to avoid load-time spam.
      if (seeded && settings.watchlist) {
        for (const hex of intersect(newlyTrue(prevPresentAir, presentAir), watchedAir)) {
          const a = ac.get(hex);
          const title = `${a ? callsign(a) : hex} on watchlist`;
          pushAlert({ kind: "watch", domain: "air", ref: hex, title, body: "Aircraft appeared in coverage" });
          notify(title, "Aircraft appeared in coverage");
          delivered = true;
        }
        for (const mmsi of intersect(newlyTrue(prevPresentSea, presentSea), watchedSea)) {
          const v = vs.get(mmsi);
          const title = `${v ? vesselName(v) : mmsi} on watchlist`;
          pushAlert({ kind: "watch", domain: "sea", ref: mmsi, title, body: "Vessel appeared in coverage" });
          notify(title, "Vessel appeared in coverage");
          delivered = true;
        }
      }
      prevPresentAir = presentAir;
      prevPresentSea = presentSea;
      seeded = true;

      if (delivered && useAlertsStore.getState().settings.sound) beep();
    }

    evaluate();
    const unsubA = useAircraftStore.subscribe(evaluate);
    const unsubV = useVesselStore.subscribe(evaluate);
    return () => {
      unsubA();
      unsubV();
    };
  }, []);
}
