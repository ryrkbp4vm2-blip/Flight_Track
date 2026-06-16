// Basemap and color configuration for the map.

/** Free CARTO dark basemap — no API key required, suits an ops aesthetic. */
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a> · ' +
  'aircraft data <a href="https://airplanes.live">airplanes.live</a>';

/** Default world view. */
export const DEFAULT_CENTER: [number, number] = [25, 10];
export const DEFAULT_ZOOM = 3;
export const MAX_ZOOM = 18;

export const COLOR_DEFAULT = "#5ad1ff";
export const COLOR_SELECTED = "#ffd23f";
export const COLOR_GROUND = "#7a8794";
export const COLOR_TRAIL = "#3a8fb0";
export const COLOR_TRAIL_SELECTED = "#ffd23f";

/**
 * Color by altitude band (feet) — low = warm, high = cool. Used to tint markers
 * so altitude is readable at a glance.
 */
export function altitudeColor(alt: number | null): string {
  if (alt === null) return COLOR_DEFAULT;
  if (alt <= 0) return COLOR_GROUND;
  if (alt < 10000) return "#ff7a59";
  if (alt < 20000) return "#ffd23f";
  if (alt < 30000) return "#9be15d";
  if (alt < 40000) return "#5ad1ff";
  return "#b794ff";
}
