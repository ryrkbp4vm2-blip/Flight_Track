// Pure snapshot exporters (GeoJSON / CSV) for the current tactical picture.
// No DOM or store dependency — the components hand in plain arrays/maps — so
// the builders are unit-testable.

import type { TrackedAircraft, TrackedVessel, TrackPoint } from "../../../shared/types";
import { callsign, altitudeFt, hasPosition } from "./format";
import { classifyAircraft } from "./classify";
import { classifyVessel, vesselHeading, vesselName, hasVesselPosition } from "./vessel";

/** Escape a CSV field per RFC 4180 (quote when it contains , " or newline). */
export function csvField(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_HEADER = [
  "domain",
  "id",
  "name",
  "type",
  "class",
  "country",
  "lat",
  "lon",
  "altitude_ft",
  "speed_kt",
  "heading_deg",
  "squawk",
  "emergency",
].join(",");

/** One unified CSV of every positioned contact (aircraft + vessels). */
export function snapshotCsv(aircraft: TrackedAircraft[], vessels: TrackedVessel[]): string {
  const rows: string[] = [CSV_HEADER];
  for (const ac of aircraft) {
    if (!hasPosition(ac)) continue;
    rows.push(
      [
        "air",
        ac.hex,
        csvField(callsign(ac)),
        csvField(ac.t),
        classifyAircraft(ac),
        "",
        ac.lat,
        ac.lon,
        altitudeFt(ac) ?? "",
        typeof ac.gs === "number" ? Math.round(ac.gs) : "",
        typeof ac.track === "number" ? Math.round(ac.track) : "",
        csvField(ac.squawk),
        csvField(ac.emergency && ac.emergency !== "none" ? ac.emergency : ""),
      ].join(","),
    );
  }
  for (const v of vessels) {
    if (!hasVesselPosition(v)) continue;
    rows.push(
      [
        "sea",
        v.mmsi,
        csvField(vesselName(v)),
        csvField(v.type),
        classifyVessel(v),
        csvField(v.country),
        v.lat,
        v.lon,
        "",
        typeof v.sog === "number" ? Math.round(v.sog) : "",
        Math.round(vesselHeading(v)),
        "",
        "",
      ].join(","),
    );
  }
  return rows.join("\n") + "\n";
}

interface Feature {
  type: "Feature";
  geometry: { type: "Point" | "LineString"; coordinates: number[] | number[][] };
  properties: Record<string, string | number | null>;
}

/**
 * GeoJSON FeatureCollection: a Point per positioned contact plus a LineString
 * per trail with ≥2 points. Coordinates are [lon, lat] per the spec.
 */
export function snapshotGeoJSON(
  aircraft: TrackedAircraft[],
  vessels: TrackedVessel[],
  airTrails: Map<string, TrackPoint[]>,
  seaTrails: Map<string, TrackPoint[]>,
): { type: "FeatureCollection"; features: Feature[] } {
  const features: Feature[] = [];

  for (const ac of aircraft) {
    if (!hasPosition(ac)) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [ac.lon, ac.lat] },
      properties: {
        domain: "air",
        id: ac.hex,
        name: callsign(ac),
        class: classifyAircraft(ac),
        type: ac.t ?? null,
        altitude_ft: altitudeFt(ac),
        speed_kt: typeof ac.gs === "number" ? Math.round(ac.gs) : null,
        heading_deg: typeof ac.track === "number" ? Math.round(ac.track) : null,
        squawk: ac.squawk ?? null,
        emergency: ac.emergency && ac.emergency !== "none" ? ac.emergency : null,
      },
    });
  }
  for (const v of vessels) {
    if (!hasVesselPosition(v)) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lon, v.lat] },
      properties: {
        domain: "sea",
        id: v.mmsi,
        name: vesselName(v),
        class: classifyVessel(v),
        type: v.type ?? null,
        country: v.country ?? null,
        hull: v.hull ?? null,
        speed_kt: typeof v.sog === "number" ? Math.round(v.sog) : null,
        heading_deg: Math.round(vesselHeading(v)),
        status: v.navStatus ?? null,
      },
    });
  }

  const addTrails = (trails: Map<string, TrackPoint[]>, domain: "air" | "sea") => {
    for (const [id, pts] of trails) {
      if (pts.length < 2) continue;
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: pts.map((p) => [p.lon, p.lat]) },
        properties: { domain, id, kind: "trail" },
      });
    }
  };
  addTrails(airTrails, "air");
  addTrails(seaTrails, "sea");

  return { type: "FeatureCollection", features };
}
