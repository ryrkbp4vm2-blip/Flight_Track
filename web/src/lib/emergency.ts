import type { Aircraft } from "../../../shared/types";

export type EmergencySeverity = "critical" | "warning";

export interface EmergencyInfo {
  severity: EmergencySeverity;
  label: string;
  /** Short code shown on chips/badges. */
  code: string;
}

// Standard emergency squawk codes.
const SQUAWK: Record<string, EmergencyInfo> = {
  "7500": { severity: "critical", label: "Unlawful interference (hijack)", code: "7500" },
  "7600": { severity: "warning", label: "Radio failure", code: "7600" },
  "7700": { severity: "critical", label: "General emergency", code: "7700" },
};

// ADS-B `emergency` field values (other than "none").
const EMERGENCY_FIELD: Record<string, EmergencyInfo> = {
  general: { severity: "critical", label: "General emergency", code: "EMG" },
  lifeguard: { severity: "warning", label: "Lifeguard / medical", code: "MED" },
  minfuel: { severity: "warning", label: "Minimum fuel", code: "FUEL" },
  nordo: { severity: "warning", label: "Radio failure", code: "NORDO" },
  unlawful: { severity: "critical", label: "Unlawful interference", code: "HIJACK" },
  downed: { severity: "critical", label: "Aircraft downed", code: "DOWN" },
};

/** Returns emergency details for an aircraft, or null when nominal. */
export function emergencyInfo(ac: Aircraft): EmergencyInfo | null {
  if (ac.squawk && SQUAWK[ac.squawk]) return SQUAWK[ac.squawk];
  if (ac.emergency && ac.emergency !== "none") {
    return EMERGENCY_FIELD[ac.emergency] ?? {
      severity: "warning",
      label: ac.emergency,
      code: ac.emergency.toUpperCase().slice(0, 6),
    };
  }
  return null;
}

export function isEmergency(ac: Aircraft): boolean {
  return emergencyInfo(ac) !== null;
}
