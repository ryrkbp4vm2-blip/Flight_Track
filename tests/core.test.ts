import { test } from "node:test";
import assert from "node:assert/strict";

import { classifyAircraft } from "../web/src/lib/classify.ts";
import { emergencyInfo, isEmergency } from "../web/src/lib/emergency.ts";
import { classifyVessel, vesselName, vesselHeading, hasVesselPosition } from "../web/src/lib/vessel.ts";
import { haversineNm, bearingDeg, destinationPoint, projectedTrack } from "../web/src/lib/geo.ts";
import { nearest, compassPoint } from "../web/src/lib/proximity.ts";
import { solarPosition, subsolarPoint, terminator } from "../web/src/lib/sun.ts";
import { sparkline, nearestSparkPoint } from "../web/src/lib/spark.ts";
import { buildSample, SAMPLE_EPOCH } from "../server/src/sampleData.ts";
import {
  formatAltitude as fmtAltitude,
  formatSpeed as fmtSpeed,
  formatDistance,
  formatLength,
  rangeRingSet,
} from "../web/src/lib/units.ts";
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
});

test("geo: dead-reckoning destination and projected track", () => {
  // 60 nm due north from the equator ≈ 1° of latitude.
  const north = destinationPoint({ lat: 0, lon: 0 }, 0, 60);
  assert.ok(Math.abs(north.lat - 1) < 0.02);
  assert.ok(Math.abs(north.lon) < 1e-6);
  // 60 nm due east at the equator ≈ 1° of longitude.
  const east = destinationPoint({ lat: 0, lon: 0 }, 90, 60);
  assert.ok(Math.abs(east.lon - 1) < 0.02);
  assert.ok(Math.abs(east.lat) < 1e-6);
  // Round-trip: measuring back to the origin returns the distance travelled.
  assert.ok(Math.abs(haversineNm({ lat: 10, lon: 20 }, destinationPoint({ lat: 10, lon: 20 }, 45, 100)) - 100) < 0.01);

  // Projected track: 480 kt for 15 min in 5-min steps → 40/80/120 nm ahead.
  const track = projectedTrack({ lat: 0, lon: 0 }, 90, 480);
  assert.deepEqual(track.map((t) => t.minutes), [5, 10, 15]);
  assert.ok(Math.abs(haversineNm({ lat: 0, lon: 0 }, track[2].point) - 120) < 0.5);
});

test("proximity: nearest ranking and compass points", () => {
  const origin = { lat: 0, lon: 0 };
  const items = [
    { id: "far", lat: 0, lon: 3 },
    { id: "near", lat: 0, lon: 1 },
    { id: "mid", lat: 0, lon: 2 },
  ];
  const ranked = nearest(origin, items, 2);
  assert.deepEqual(ranked.map((r) => r.item.id), ["near", "mid"]);
  assert.equal(ranked.length, 2);
  // Due-east neighbour bears 090°.
  assert.ok(Math.abs(ranked[0].bearing - 90) < 0.001);
  assert.ok(Math.abs(ranked[0].distanceNm - 60) < 0.2);
  // Self-distance is zero; nearest of an empty list is empty.
  assert.equal(nearest(origin, [origin]).length, 1);
  assert.equal(nearest(origin, []).length, 0);

  assert.equal(compassPoint(0), "N");
  assert.equal(compassPoint(45), "NE");
  assert.equal(compassPoint(90), "E");
  assert.equal(compassPoint(180), "S");
  assert.equal(compassPoint(270), "W");
  assert.equal(compassPoint(350), "N");
  assert.equal(compassPoint(-90), "W");
});

test("sun: declination at solstices/equinox and terminator shape", () => {
  // Solar declination ≈ +23.4° at the June solstice, −23.4° at December.
  const june = solarPosition(new Date("2023-06-21T12:00:00Z")).declination;
  const dec = solarPosition(new Date("2023-12-22T12:00:00Z")).declination;
  const equinox = solarPosition(new Date("2023-03-20T21:00:00Z")).declination;
  assert.ok(Math.abs(june - 23.4) < 0.6, `june ${june}`);
  assert.ok(Math.abs(dec + 23.4) < 0.6, `dec ${dec}`);
  assert.ok(Math.abs(equinox) < 1, `equinox ${equinox}`);

  // The subsolar latitude equals the declination and longitude is in range.
  const sun = subsolarPoint(new Date("2023-06-21T12:00:00Z"));
  assert.ok(Math.abs(sun.lat - june) < 1e-9);
  assert.ok(sun.lon >= -180 && sun.lon <= 180);

  // The terminator curve spans every longitude with valid latitudes; in June
  // the south pole is the dark cap.
  const t = terminator(new Date("2023-06-21T12:00:00Z"), 2);
  assert.equal(t.curve.length, 181);
  assert.equal(t.curve[0].lon, -180);
  assert.equal(t.curve[t.curve.length - 1].lon, 180);
  assert.ok(t.curve.every((p) => p.lat >= -90 && p.lat <= 90 && Number.isFinite(p.lat)));
  assert.equal(t.nightCapLat, -90);
});

test("spark: scales samples by time, inverts y, handles edge cases", () => {
  // Climb from 10k to 30k over two minutes.
  const g = sparkline(
    [
      { v: 10_000, t: 0 },
      { v: 20_000, t: 60_000 },
      { v: 30_000, t: 120_000 },
    ],
    260,
    48,
    3,
  );
  assert.ok(g);
  assert.equal(g.min, 10_000);
  assert.equal(g.max, 30_000);
  assert.equal(g.points.length, 3);
  // X spans pad…width−pad, proportional to time.
  assert.equal(g.points[0].x, 3);
  assert.equal(g.points[2].x, 257);
  assert.ok(Math.abs(g.points[1].x - 130) < 0.5);
  // Y is inverted: the highest altitude sits at the top (smallest y).
  assert.ok(g.points[2].y < g.points[0].y);
  assert.equal(g.points[2].y, 3);
  assert.equal(g.points[0].y, 45);
  assert.match(g.d, /^M/);
  assert.match(g.area, /Z$/);

  // Flat altitude renders a mid-height line, not a divide-by-zero.
  const flat = sparkline([{ v: 5000, t: 0 }, { v: 5000, t: 1000 }], 100, 40, 0);
  assert.ok(flat);
  assert.equal(flat.points[0].y, 20);

  // Fewer than two plottable samples → null (single point, NaNs filtered).
  assert.equal(sparkline([{ v: 5000, t: 0 }], 100, 40), null);
  assert.equal(sparkline([{ v: NaN, t: 0 }, { v: 5000, t: 1 }], 100, 40), null);

  // Hover snaps to the nearest plotted point.
  assert.equal(nearestSparkPoint(g.points, 0).v, 10_000);
  assert.equal(nearestSparkPoint(g.points, 140).v, 20_000);
  assert.equal(nearestSparkPoint(g.points, 900).v, 30_000);
});

test("sample feed dead-reckons aircraft over time", () => {
  const t0 = buildSample(SAMPLE_EPOCH);
  const t1 = buildSample(SAMPLE_EPOCH + 60_000);
  assert.equal(t0.total, t1.total);

  const before = t0.ac.find((a) => a.hex === "ae1234")!;
  const after = t1.ac.find((a) => a.hex === "ae1234")!;
  // A 451 kt C-17 moves measurably in a minute, but stays in its theater.
  const moved = Math.hypot(after.lat! - before.lat!, after.lon! - before.lon!);
  assert.ok(moved > 0.05, `moved ${moved}`);
  assert.ok(moved < 1, `moved ${moved}`);
  // Altitude oscillates in clean 25 ft steps with a consistent vertical rate.
  assert.equal((after.alt_baro as number) % 25, 0);
  assert.ok(Math.abs((after.alt_baro as number) - 33000) <= 1500 + 25);
  assert.equal(typeof after.baro_rate, "number");

  // The taxiing aircraft stays on the ground.
  const ground = t1.ac.find((a) => a.hex === "8a02d7")!;
  assert.equal(ground.alt_baro, "ground");
  assert.equal(ground.baro_rate, 0);
});

test("units: convert altitude, speed, distance, length by system", () => {
  // Altitude: feet, or metres when metric.
  assert.equal(fmtAltitude(33000, "aviation"), "33,000 ft");
  assert.equal(fmtAltitude(33000, "imperial"), "33,000 ft");
  assert.equal(fmtAltitude(1000, "metric"), "305 m");
  // Speed: knots → km/h (metric) → mph (imperial).
  assert.equal(fmtSpeed(100, "aviation"), "100 kt");
  assert.equal(fmtSpeed(100, "metric"), "185 km/h");
  assert.equal(fmtSpeed(100, "imperial"), "115 mph");
  // Distance carries the right unit and value.
  assert.match(formatDistance(60, "aviation"), /^60(\.0)? nm$/);
  assert.match(formatDistance(60, "metric"), /km$/);
  assert.match(formatDistance(60, "imperial"), /mi$/);
  assert.equal(formatDistance(100, "metric"), "185 km");
  // Ship length: metres, or feet when imperial.
  assert.equal(formatLength(150, "metric"), "150 m");
  assert.equal(formatLength(150, "aviation"), "150 m");
  assert.equal(formatLength(30, "imperial"), "98 ft");
  // Range-ring sets use round numbers in the displayed unit.
  assert.deepEqual(
    rangeRingSet("aviation").map((r) => r.label),
    ["50 nm", "100 nm", "200 nm", "400 nm"],
  );
  assert.deepEqual(
    rangeRingSet("metric").map((r) => r.label),
    ["50 km", "100 km", "200 km", "500 km"],
  );
  // A 100 km ring's physical radius is 100/1.852 nm.
  assert.ok(Math.abs(rangeRingSet("metric")[1].nm - 100 / 1.852) < 1e-6);
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
