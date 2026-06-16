import { create } from "zustand";
import { loadPref, savePref } from "../lib/persist";

export type AlertKind = "emergency" | "watch";

export interface Alert {
  id: string;
  kind: AlertKind;
  /** "air" or "sea" — which store the contact lives in. */
  domain: "air" | "sea";
  /** hex (air) or mmsi (sea). */
  ref: string;
  title: string;
  body: string;
  ts: number;
  read: boolean;
}

export interface AlertSettings {
  /** Fire when any aircraft starts squawking an emergency. */
  emergency: boolean;
  /** Fire when a watched contact (re)appears in the feed. */
  watchlist: boolean;
  /** Play a short beep on alert. */
  sound: boolean;
  /** Send a browser notification when the tab is hidden. */
  push: boolean;
}

const MAX_LOG = 50;

interface AlertsState {
  watchedAir: Set<string>;
  watchedSea: Set<string>;
  settings: AlertSettings;
  log: Alert[];
  unread: number;

  toggleWatchAir: (hex: string) => void;
  toggleWatchSea: (mmsi: string) => void;
  isWatchedAir: (hex: string) => boolean;
  isWatchedSea: (mmsi: string) => boolean;
  setSetting: <K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) => void;
  pushAlert: (a: Omit<Alert, "id" | "ts" | "read">) => void;
  markRead: () => void;
  clearLog: () => void;
}

const defaultSettings: AlertSettings = {
  emergency: true,
  watchlist: true,
  sound: true,
  push: false,
};

export const useAlertsStore = create<AlertsState>((set, get) => ({
  watchedAir: new Set(loadPref<string[]>("watchedAir", [])),
  watchedSea: new Set(loadPref<string[]>("watchedSea", [])),
  settings: { ...defaultSettings, ...loadPref("alertSettings", {}) },
  log: [],
  unread: 0,

  toggleWatchAir: (hex) =>
    set((state) => {
      const next = new Set(state.watchedAir);
      next.has(hex) ? next.delete(hex) : next.add(hex);
      savePref("watchedAir", [...next]);
      return { watchedAir: next };
    }),
  toggleWatchSea: (mmsi) =>
    set((state) => {
      const next = new Set(state.watchedSea);
      next.has(mmsi) ? next.delete(mmsi) : next.add(mmsi);
      savePref("watchedSea", [...next]);
      return { watchedSea: next };
    }),
  isWatchedAir: (hex) => get().watchedAir.has(hex),
  isWatchedSea: (mmsi) => get().watchedSea.has(mmsi),

  setSetting: (key, value) =>
    set((state) => {
      const settings = { ...state.settings, [key]: value };
      savePref("alertSettings", settings);
      return { settings };
    }),

  pushAlert: (a) =>
    set((state) => {
      const alert: Alert = {
        ...a,
        id: `${a.kind}:${a.ref}:${Date.now()}`,
        ts: Date.now(),
        read: false,
      };
      return { log: [alert, ...state.log].slice(0, MAX_LOG), unread: state.unread + 1 };
    }),

  markRead: () =>
    set((state) => ({ unread: 0, log: state.log.map((a) => ({ ...a, read: true })) })),
  clearLog: () => set({ log: [], unread: 0 }),
}));
