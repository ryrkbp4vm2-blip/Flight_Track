// Tiny namespaced localStorage helper for UI preferences. Safe when storage is
// unavailable (private mode / SSR) — reads return the fallback, writes no-op.

const KEY = "miltrack:prefs";

type Prefs = Record<string, unknown>;

function readAll(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Prefs) : {};
  } catch {
    return {};
  }
}

export function loadPref<T>(key: string, fallback: T): T {
  const all = readAll();
  return key in all ? (all[key] as T) : fallback;
}

export function savePref(key: string, value: unknown): void {
  try {
    const all = readAll();
    all[key] = value;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore (storage full / unavailable)
  }
}
