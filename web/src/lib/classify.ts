import type { Aircraft } from "../../../shared/types";

/** Visual class used to pick a map glyph. */
export type AircraftClass = "fighter" | "heavy" | "rotor" | "drone" | "plane";

const CLASS_LABEL: Record<AircraftClass, string> = {
  fighter: "Fighter / fast jet",
  heavy: "Heavy / transport",
  rotor: "Helicopter",
  drone: "Drone / UAV",
  plane: "Aircraft",
};

// Type-code prefixes (the airplanes.live `t` field) for common military types.
const FIGHTER = [
  "F14", "F15", "F16", "F18", "F22", "F35", "F5", "F4", "EUFI", "TYPH",
  "RFAL", "MIG", "SU2", "SU3", "SU5", "GR4", "TORN", "A10", "AV8", "TEX2",
  "HAWK", "GRIP", "JF17", "J10", "J20", "EA18",
];
const HEAVY = [
  "C17", "C5", "C130", "C30J", "K35R", "KC135", "KC10", "KC46", "A400",
  "A330", "A332", "A310", "B52", "B1", "B2", "E3", "E3TF", "E6", "E8",
  "P8", "P3", "RC135", "C40", "C32", "VC25", "AN12", "AN24", "AN26", "IL76",
  "A124", "C295", "CN35", "C27J", "ATLA", "B703", "B752", "DC10", "MD11",
];
const ROTOR = [
  "H60", "UH60", "H64", "AH64", "H47", "CH47", "H53", "CH53", "H1", "UH1",
  "H72", "EC35", "EC45", "AS32", "NH90", "EC25", "MERL", "PUMA", "LYNX",
  "WG30", "A139", "A169", "H145", "H160",
];
const DRONE = [
  "MQ9", "MQ1", "MQ4", "RQ4", "RQ1", "RQ7", "RQ11", "RQ20", "GHWK", "Q4",
  "WatchKeeper", "WK45", "BAYR",
];

function matches(type: string | undefined, prefixes: string[]): boolean {
  if (!type) return false;
  const t = type.toUpperCase();
  return prefixes.some((p) => t.startsWith(p.toUpperCase()));
}

/**
 * Classify an aircraft for display. Prefers the type code; falls back to the
 * ADS-B emitter `category` (A7 = rotorcraft, B6 = UAV, A5 = heavy).
 */
export function classifyAircraft(ac: Aircraft): AircraftClass {
  if (matches(ac.t, ROTOR) || ac.category === "A7") return "rotor";
  if (matches(ac.t, DRONE) || ac.category === "B6") return "drone";
  if (matches(ac.t, FIGHTER)) return "fighter";
  if (matches(ac.t, HEAVY) || ac.category === "A5") return "heavy";
  return "plane";
}

export function classLabel(cls: AircraftClass): string {
  return CLASS_LABEL[cls];
}
