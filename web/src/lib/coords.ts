// Coordinate display formats: decimal degrees, DMS, and MGRS (the NATO
// military grid). The UTM projection uses Snyder's standard transverse
// Mercator series on WGS-84 (sub-metre at these precisions). Pure math, no
// dependencies, unit-tested.

export type CoordFormat = "decimal" | "dms" | "mgrs";

/** Selectable formats with labels + hints for the settings UI. */
export const COORD_FORMATS: { key: CoordFormat; label: string; hint: string }[] = [
  { key: "decimal", label: "Decimal", hint: "38.950, -77.460" },
  { key: "dms", label: "DMS", hint: "38°57′00″N 77°27′36″W" },
  { key: "mgrs", label: "MGRS", hint: "18S UJ 13403 12283" },
];

const D2R = Math.PI / 180;

// WGS-84
const A = 6378137;
const E2 = 0.00669437999014; // first eccentricity squared
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;

/** UTM zone for a position, including the Norway and Svalbard exceptions. */
export function utmZone(lat: number, lon: number): number {
  let zone = Math.floor((lon + 180) / 6) + 1;
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) zone = 31;
    else if (lon >= 9 && lon < 21) zone = 33;
    else if (lon >= 21 && lon < 33) zone = 35;
    else if (lon >= 33 && lon < 42) zone = 37;
  }
  return zone;
}

const BANDS = "CDEFGHJKLMNPQRSTUVWX";

/** MGRS latitude band letter (C…X, no I/O), valid −80…84. */
export function latBand(lat: number): string {
  return BANDS[Math.max(0, Math.min(19, Math.floor((lat + 80) / 8)))];
}

interface Utm {
  zone: number;
  easting: number;
  northing: number;
  southern: boolean;
}

/** Forward UTM projection (Snyder 1987, eqs. 8-9…8-13). */
export function toUtm(lat: number, lon: number): Utm {
  const zone = utmZone(lat, lon);
  const lon0 = ((zone - 1) * 6 - 180 + 3) * D2R;
  const phi = lat * D2R;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);

  const n = A / Math.sqrt(1 - E2 * sin * sin);
  const t = tan * tan;
  const c = EP2 * cos * cos;
  const a = cos * (lon * D2R - lon0);

  const m =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 * E2 * E2) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 * E2 * E2) / 1024) * Math.sin(2 * phi) +
      ((15 * E2 * E2) / 256 + (45 * E2 * E2 * E2) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 * E2 * E2) / 3072) * Math.sin(6 * phi));

  const easting =
    K0 * n * (a + ((1 - t + c) * a ** 3) / 6 + ((5 - 18 * t + t * t + 72 * c - 58 * EP2) * a ** 5) / 120) +
    500000;
  let northing =
    K0 *
    (m +
      n *
        tan *
        (a ** 2 / 2 +
          ((5 - t + 9 * c + 4 * c * c) * a ** 4) / 24 +
          ((61 - 58 * t + t * t + 600 * c - 330 * EP2) * a ** 6) / 720));
  const southern = lat < 0;
  if (southern) northing += 10000000;
  return { zone, easting, northing, southern };
}

const COL_SETS = ["STUVWXYZ", "ABCDEFGH", "JKLMNPQR"]; // by zone % 3
const ROW_LETTERS = "ABCDEFGHJKLMNPQRSTUV"; // 20, repeats every 2,000 km

/** Position as an MGRS reference at 1 m precision, e.g. "18S UJ 13403 12283". */
export function formatMGRS(lat: number, lon: number): string {
  const { zone, easting, northing } = toUtm(lat, lon);
  const colSet = COL_SETS[zone % 3];
  const col = colSet[Math.floor(easting / 100000) - 1];
  const rowOffset = zone % 2 === 0 ? 5 : 0;
  const row = ROW_LETTERS[(Math.floor(northing / 100000) + rowOffset) % 20];
  const e = String(Math.floor(easting) % 100000).padStart(5, "0");
  const n = String(Math.floor(northing) % 100000).padStart(5, "0");
  return `${zone}${latBand(lat)} ${col}${row} ${e} ${n}`;
}

function dmsPart(value: number, pos: string, neg: string): string {
  const hemi = value < 0 ? neg : pos;
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let min = Math.floor((abs - deg) * 60);
  let sec = Math.round(((abs - deg) * 60 - min) * 60);
  if (sec === 60) {
    sec = 0;
    min += 1;
  }
  if (min === 60) {
    min = 0;
    deg += 1;
  }
  return `${deg}°${String(min).padStart(2, "0")}′${String(sec).padStart(2, "0")}″${hemi}`;
}

/** Position as degrees-minutes-seconds, e.g. 38°57′00″N 77°27′36″W. */
export function formatDMS(lat: number, lon: number): string {
  return `${dmsPart(lat, "N", "S")} ${dmsPart(lon, "E", "W")}`;
}

/** Position in the chosen display format. */
export function formatCoords(lat: number, lon: number, fmt: CoordFormat): string {
  if (fmt === "mgrs") return formatMGRS(lat, lon);
  if (fmt === "dms") return formatDMS(lat, lon);
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}
