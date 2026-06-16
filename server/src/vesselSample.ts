import type { Vessel } from "../../shared/types.js";

/**
 * Curated set of notable military vessels used as the default vessel feed.
 * Positions are illustrative starting points near each ship's typical operating
 * area — NOT real-time locations — and are animated by vesselCache so the map
 * shows movement and trails. Replace with a live AIS source via
 * VESSELS_UPSTREAM_URL for real positions.
 */
export const BASE_VESSELS: Vessel[] = [
  { mmsi: "338901000", name: "USS Gerald R. Ford", hull: "CVN-78", type: "Aircraft Carrier", country: "USA", callsign: "NGRF", lat: 36.95, lon: -74.8, cog: 95, sog: 18, length: 337, navStatus: "Under way using engine" },
  { mmsi: "368010000", name: "USS Arleigh Burke", hull: "DDG-51", type: "Destroyer", country: "USA", callsign: "NABK", lat: 25.4, lon: -64.0, cog: 70, sog: 22, length: 154 },
  { mmsi: "368067000", name: "USS Cole", hull: "DDG-67", type: "Destroyer", country: "USA", callsign: "NCOL", lat: 12.8, lon: 45.0, cog: 110, sog: 16, length: 154 },
  { mmsi: "368012000", name: "USS Zumwalt", hull: "DDG-1000", type: "Destroyer", country: "USA", callsign: "NZUM", lat: 32.6, lon: -118.2, cog: 200, sog: 20, length: 190 },
  { mmsi: "366998000", name: "USS Gettysburg", hull: "CG-64", type: "Cruiser", country: "USA", callsign: "NGET", lat: 35.0, lon: -71.0, cog: 80, sog: 21, length: 173 },
  { mmsi: "369970000", name: "USS North Dakota", hull: "SSN-784", type: "Submarine", country: "USA", callsign: "NND", lat: 41.0, lon: -49.0, cog: 60, sog: 12, length: 115, navStatus: "Under way using engine" },
  { mmsi: "338701000", name: "USCGC Stratton", hull: "WMSL-752", type: "Patrol Cutter", country: "USA", callsign: "NSTR", lat: 21.3, lon: -158.2, cog: 250, sog: 14, length: 127 },
  { mmsi: "369100000", name: "USNS Supply", hull: "T-AOE-6", type: "Replenishment Oiler", country: "USA", callsign: "NSUP", lat: 38.0, lon: -29.0, cog: 90, sog: 16, length: 230 },
  { mmsi: "232000001", name: "HMS Queen Elizabeth", hull: "R08", type: "Aircraft Carrier", country: "UK", callsign: "GQEC", lat: 50.2, lon: -4.5, cog: 220, sog: 15, length: 280 },
  { mmsi: "232001002", name: "HMS Daring", hull: "D32", type: "Destroyer", country: "UK", callsign: "GDAR", lat: 36.0, lon: -6.2, cog: 100, sog: 20, length: 152 },
  { mmsi: "227000003", name: "FS Charles de Gaulle", hull: "R91", type: "Aircraft Carrier", country: "France", callsign: "FCDG", lat: 42.7, lon: 5.5, cog: 130, sog: 16, length: 261 },
  { mmsi: "247000004", name: "ITS Cavour", hull: "C550", type: "Aircraft Carrier", country: "Italy", callsign: "ICAV", lat: 40.3, lon: 14.0, cog: 160, sog: 15, length: 244 },
  { mmsi: "244000005", name: "HNLMS De Ruyter", hull: "F804", type: "Frigate", country: "Netherlands", callsign: "PDRY", lat: 52.3, lon: 3.8, cog: 20, sog: 18, length: 144 },
  { mmsi: "431000006", name: "JS Izumo", hull: "DDH-183", type: "Helicopter Destroyer", country: "Japan", callsign: "JIZU", lat: 34.6, lon: 139.9, cog: 150, sog: 17, length: 248 },
  { mmsi: "419000007", name: "INS Vikrant", hull: "R11", type: "Aircraft Carrier", country: "India", callsign: "AVIK", lat: 15.0, lon: 72.9, cog: 240, sog: 18, length: 262 },
  { mmsi: "503000008", name: "HMAS Hobart", hull: "DDG-39", type: "Destroyer", country: "Australia", callsign: "VHOB", lat: -33.95, lon: 151.4, cog: 120, sog: 19, length: 147 },
];
