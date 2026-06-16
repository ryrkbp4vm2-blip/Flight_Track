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
  { mmsi: "338902000", name: "USS America", hull: "LHA-6", type: "Amphibious Assault Ship", country: "USA", callsign: "NAME", lat: 33.7, lon: 134.5, cog: 175, sog: 16, length: 257 },
  { mmsi: "366999100", name: "USS Freedom", hull: "LCS-1", type: "Littoral Combat Ship", country: "USA", callsign: "NFRE", lat: 26.1, lon: -80.0, cog: 140, sog: 30, length: 115 },
  { mmsi: "369050000", name: "USNS Mercy", hull: "T-AH-19", type: "Hospital Ship", country: "USA", callsign: "NMER", lat: 13.5, lon: 144.8, cog: 90, sog: 14, length: 272 },
  { mmsi: "366700000", name: "USS Mount Whitney", hull: "LCC-20", type: "Command Ship", country: "USA", callsign: "NMWH", lat: 40.6, lon: 18.0, cog: 110, sog: 15, length: 189 },
  { mmsi: "273000010", name: "RFS Admiral Kuznetsov", hull: "063", type: "Aircraft Carrier", country: "Russia", callsign: "RAKZ", lat: 69.0, lon: 33.5, cog: 30, sog: 14, length: 305 },
  { mmsi: "273000011", name: "RFS Pyotr Velikiy", hull: "099", type: "Battlecruiser", country: "Russia", callsign: "RPVY", lat: 71.5, lon: 40.0, cog: 70, sog: 18, length: 252 },
  { mmsi: "412000012", name: "PLAN Liaoning", hull: "16", type: "Aircraft Carrier", country: "China", callsign: "CLIA", lat: 20.5, lon: 116.0, cog: 200, sog: 16, length: 305 },
  { mmsi: "412000013", name: "PLAN Nanchang", hull: "101", type: "Destroyer", country: "China", callsign: "CNCH", lat: 24.0, lon: 122.5, cog: 160, sog: 22, length: 180 },
  { mmsi: "440000014", name: "ROKS Dokdo", hull: "LPH-6111", type: "Amphibious Assault Ship", country: "South Korea", callsign: "DROK", lat: 35.0, lon: 129.5, cog: 100, sog: 15, length: 199 },
  { mmsi: "316000015", name: "HMCS Halifax", hull: "FFH-330", type: "Frigate", country: "Canada", callsign: "CHFX", lat: 44.5, lon: -62.0, cog: 70, sog: 19, length: 134 },
  { mmsi: "224000016", name: "SPS Juan Carlos I", hull: "L-61", type: "Amphibious Assault Ship", country: "Spain", callsign: "EJC1", lat: 36.7, lon: -4.4, cog: 120, sog: 15, length: 231 },
  { mmsi: "271000017", name: "TCG Anadolu", hull: "L-400", type: "Amphibious Assault Ship", country: "Turkey", callsign: "TANA", lat: 40.8, lon: 28.2, cog: 60, sog: 14, length: 232 },
  { mmsi: "710000018", name: "NAM Atlantico", hull: "A140", type: "Helicopter Carrier", country: "Brazil", callsign: "BATL", lat: -23.0, lon: -43.0, cog: 150, sog: 15, length: 203 },
];
