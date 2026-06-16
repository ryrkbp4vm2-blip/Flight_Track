import type { Vessel } from "../../../shared/types";

export type VesselClass =
  | "carrier"
  | "combatant"
  | "submarine"
  | "patrol"
  | "support"
  | "vessel";

const LABEL: Record<VesselClass, string> = {
  carrier: "Aircraft carrier",
  combatant: "Surface combatant",
  submarine: "Submarine",
  patrol: "Patrol / cutter",
  support: "Support / auxiliary",
  vessel: "Vessel",
};

const COLOR: Record<VesselClass, string> = {
  carrier: "#f3a0ff",
  combatant: "#4dd0e1",
  submarine: "#9fb2bd",
  patrol: "#aed581",
  support: "#ffb74d",
  vessel: "#80cbc4",
};

/** Relative marker size per class (carriers read as the largest). */
const SIZE_SCALE: Record<VesselClass, number> = {
  carrier: 1.35,
  combatant: 1.05,
  submarine: 1.0,
  patrol: 0.95,
  support: 1.15,
  vessel: 1.0,
};

export function classifyVessel(v: Vessel): VesselClass {
  const t = (v.type ?? "").toLowerCase();
  if (t.includes("carrier")) return "carrier";
  if (t.includes("submarine")) return "submarine";
  if (
    t.includes("destroyer") ||
    t.includes("cruiser") ||
    t.includes("frigate") ||
    t.includes("corvette")
  ) {
    return "combatant";
  }
  if (t.includes("patrol") || t.includes("cutter")) return "patrol";
  if (
    t.includes("oiler") ||
    t.includes("replenishment") ||
    t.includes("support") ||
    t.includes("auxiliary") ||
    t.includes("supply")
  ) {
    return "support";
  }
  return "vessel";
}

export const vesselLabel = (c: VesselClass) => LABEL[c];
export const vesselColor = (c: VesselClass) => COLOR[c];
export const vesselSizeScale = (c: VesselClass) => SIZE_SCALE[c];

/** Display name, falling back to hull number then MMSI. */
export function vesselName(v: Vessel): string {
  return v.name?.trim() || v.hull || v.mmsi;
}

/** Heading used for icon rotation (true heading, else course over ground). */
export function vesselHeading(v: Vessel): number {
  if (typeof v.heading === "number") return v.heading;
  if (typeof v.cog === "number") return v.cog;
  return 0;
}

export function hasVesselPosition<T extends Vessel>(
  v: T,
): v is T & { lat: number; lon: number } {
  return typeof v.lat === "number" && typeof v.lon === "number";
}
