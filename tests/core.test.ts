import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyAircraft } from "../web/src/lib/classify.ts";
import { emergencyInfo, isEmergency } from "../web/src/lib/emergency.ts";
import { classifyVessel, vesselName, vesselHeading, hasVesselPosition } from "../web/src/lib/vessel.ts";
import { haversineNm, bearingDeg, formatDistance } from "../web/src/lib/geo.ts";
import { icaoCountry, countryFlag } from "../web/src/lib/icaoCountry.ts";
import { airClassAllowed, seaClassAllowed } from "../web/src/store/useMapStore.ts";
import { newlyTrue, intersect } from "../web/src/lib/alerts.ts";
import { callsign, altitudeFt, formatAltitude, hasPosition } from "../web/src/lib/format.ts";
import { appendTrackPoint, MAX_TRAIL_POINTS } from "../web/src/lib/trails.ts";
import { filterAircraft, sortAircraft } from "../web/src/store/selectors.ts";
import type { Aircraft, TrackedAircraft, Vessel, TrackPoint } from "../shared/types.ts";

const ac = (o: Partial<Aircraft>): Aircraft => ({ hex: "abc123", ...o });
const tracked = (o: Partial<TrackedAircraft>): TrackedAircraft =>
  ({ hex: "abc123", lastSeen: 0, ...o }) as TrackedAircraft;

test("classifyAircraft maps type codes and categories", () => {
  assert.equal(classifyAircraft(ac({ t: "F22" })), "fighter");
  assert.equal(classifyAircraft(ac({ t: "KC135" })), "heavy");
  assert.equal(classifyAircraft(ac({ t: "MQ9" })), "drone");
  assert.equal(classifyAircraft(ac({ t: "H60" })), "rotor");
  assert.equal(classifyAircraft(ac({ category: "A7" })), "rotor");
  assert.equal(classifyAircraft(ac({ category: "A5" })), "heavy");
  assert.equal(classifyAircraft(ac({ t: "B738" })), "plane");
});

test("emergency detection from squawk and field", () => {
  assert.equal(emergencyInfo(ac({ squawk: "7500" }))?.severity, "critical");
  assert.equal(emergencyInfo(ac({ squawk: "7600" }))?.severity, "warning");
  assert.equal(emergencyInfo(ac({ squawk: "7700" }))?.severity, "critical");
  assert.equal(emergencyInfo(ac({ emergency: "minfuel" }))?.severity, "warning");
  assert.equal(emergencyInfo(ac({ squawk: "1200" })), null);
  assert.equal(emergencyInfo(ac({ emergency: "none" })), null);
  assert.equal(isEmergency(ac({ squawk: "7700" })), true);
});

test("format helpers handle missing and ground values", () => {
  assert.equal(callsign(ac({ flight: "RCH285 " })), "RCH285");
  assert.equal(callsign(ac({ r: "08-8201" })), "08-8201");
  assert.equal(callsign(ac({ hex: "ae1234" })), "AE1234");
  assert.equal(altitudeFt(ac({ alt_baro: "ground" })), 0);
  assert.equal(altitudeFt(ac({ alt_baro: 33000 })), 33000);
  assert.equal(altitudeFt(ac({})), null);
  assert.equal(formatAltitude(ac({ alt_baro: "ground" })), "Ground");
  assert.equal(hasPosition(ac({ lat: 1, lon: 2 })), true);
  assert.equal(hasPosition(ac({ lat: 1 })), false);
});

test("filterAircraft matches fields and the emergency keyword", () => {
  const list = [
    tracked({ hex: "a1", flight: "RCH285 ", t: "C17" }),
    tracked({ hex: "b2", flight: "VADER01", t: "F22", squawk: "7700" }),
  ];
  assert.equal(filterAircraft(list, "rch").length, 1);
  assert.equal(filterAircraft(list, "f22").length, 1);
  assert.equal(filterAircraft(list, "7700").length, 1);
  assert.equal(filterAircraft(list, "emergency").length, 1);
  assert.equal(filterAircraft(list, "").length, 2);
});

test("sortAircraft sorts by altitude both directions", () => {
  const list = [
    tracked({ hex: "a", alt_baro: 10000 }),
    tracked({ hex: "b", alt_baro: 40000 }),
    tracked({ hex: "c", alt_baro: 20000 }),
  ];
  assert.deepEqual(
    sortAircraft(list, "altitude", "asc").map((a) => a.hex),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    sortAircraft(list, "altitude", "desc").map((a) => a.hex),
    ["b", "c", "a"],
  );
});

test("appendTrackPoint dedupes stationary points and caps length", () => {
  const p = (lat: number, lon: number): TrackPoint => ({ lat, lon, alt: 0, t: 0 });
  // First point initializes.
  let trail = appendTrackPoint(undefined, p(0, 0));
  assert.equal(trail.length, 1);
  // Tiny movement is ignored.
  trail = appendTrackPoint(trail, p(0.0001, 0));
  assert.equal(trail.length, 1);
  // Real movement is recorded.
  trail = appendTrackPoint(trail, p(1, 1));
  assert.equal(trail.length, 2);
  // Cap enforced.
  let long: TrackPoint[] = [];
  for (let i = 0; i < MAX_TRAIL_POINTS + 20; i++) long = appendTrackPoint(long, p(i, i));
  assert.equal(long.length, MAX_TRAIL_POINTS);
});

test("classifyVessel and vessel helpers", () => {
  const v = (o: Partial<Vessel>): Vessel => ({ mmsi: "1", ...o });
  assert.equal(classifyVessel(v({ type: "Aircraft Carrier" })), "carrier");
  assert.equal(classifyVessel(v({ type: "Amphibious Assault Ship" })), "amphibious");
  assert.equal(classifyVessel(v({ type: "Destroyer" })), "combatant");
  assert.equal(classifyVessel(v({ type: "Frigate" })), "combatant");
  assert.equal(classifyVessel(v({ type: "Littoral Combat Ship" })), "combatant");
  assert.equal(classifyVessel(v({ type: "Submarine" })), "submarine");
  assert.equal(classifyVessel(v({ type: "Patrol Cutter" })), "patrol");
  assert.equal(classifyVessel(v({ type: "Replenishment Oiler" })), "support");
  assert.equal(classifyVessel(v({ type: "Command Ship" })), "support");
  assert.equal(classifyVessel(v({ type: "Hospital Ship" })), "support");
  assert.equal(classifyVessel(v({ type: "Tug" })), "vessel");
  assert.equal(vesselName(v({ name: "USS Cole", hull: "DDG-67" })), "USS Cole");
  assert.equal(vesselName(v({ hull: "DDG-67" })), "DDG-67");
  assert.equal(vesselHeading(v({ cog: 90 })), 90);
  assert.equal(vesselHeading(v({ heading: 45, cog: 90 })), 45);
  assert.equal(hasVesselPosition(v({ lat: 1, lon: 2 })), true);
  assert.equal(hasVesselPosition(v({ lat: 1 })), false);
});

test("geo: distance, bearing, formatting", () => {
  // 1° of longitude at the equator ≈ 60 nm.
  assert.ok(Math.abs(haversineNm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }) - 60) < 0.2);
  assert.equal(haversineNm({ lat: 10, lon: 20 }, { lat: 10, lon: 20 }), 0);
  assert.ok(Math.abs(bearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }) - 0) < 0.001);
  assert.ok(Math.abs(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }) - 90) < 0.001);
  assert.match(formatDistance(60), /nm/);
  assert.match(formatDistance(60), /km/);
});

test("icaoCountry maps hex blocks to countries/flags", () => {
  assert.equal(icaoCountry("a00001")?.country, "United States");
  assert.equal(icaoCountry("3c0001")?.country, "Germany");
  assert.equal(icaoCountry("400001")?.country, "United Kingdom");
  assert.equal(icaoCountry("780001")?.country, "China");
  assert.equal(icaoCountry("7c0001")?.country, "Australia");
  assert.equal(icaoCountry("c00001")?.country, "Canada");
  assert.equal(icaoCountry("zzzzzz"), null);
  assert.equal(countryFlag("USA"), "🇺🇸");
  assert.equal(countryFlag(undefined), "");
});

test("class-filter predicates: empty set allows all", () => {
  assert.equal(airClassAllowed(new Set(), "fighter"), true);
  assert.equal(airClassAllowed(new Set(["fighter"]), "fighter"), true);
  assert.equal(airClassAllowed(new Set(["fighter"]), "heavy"), false);
  assert.equal(seaClassAllowed(new Set(), "carrier"), true);
  assert.equal(seaClassAllowed(new Set(["submarine"]), "carrier"), false);
  assert.equal(seaClassAllowed(new Set(["submarine"]), "submarine"), true);
});

test("alert rule helpers: newlyTrue and intersect", () => {
  // Only IDs present now but not before are "new".
  assert.deepEqual(newlyTrue(new Set(["a"]), new Set(["a", "b"])).sort(), ["b"]);
  assert.deepEqual(newlyTrue(new Set(), new Set(["x"])), ["x"]);
  assert.deepEqual(newlyTrue(new Set(["a", "b"]), new Set(["a"])), []);
  // Watched contacts among a set of ids.
  assert.deepEqual(intersect(["a", "b", "c"], new Set(["b", "z"])), ["b"]);
  assert.deepEqual(intersect(["a"], new Set()), []);
});
