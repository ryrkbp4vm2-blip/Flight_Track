import L from "leaflet";
import type { AircraftClass } from "../lib/classify";
import type { EmergencySeverity } from "../lib/emergency";

const SIZE = 26;

// Per-class glyph in a 24x24 viewBox, nose pointing up (north = 0°).
const GLYPH: Record<Exclude<AircraftClass, "rotor">, string> = {
  // Generic airliner/transport silhouette.
  plane: "M12 2 L15 11 L22 14 L15 14 L13 22 L11 22 L9 14 L2 14 L9 11 Z",
  // Swept delta — narrow wings, pointed nose.
  fighter: "M12 1 L13 12 L19 20 L12.6 17 L13 22 L11 22 L11.4 17 L5 20 L11 12 Z",
  // Wide wingspan with tailplane — big transport / tanker.
  heavy: "M12 2 L13 9 L23 13 L23 15 L13 13.5 L12.6 20 L16 22.5 L16 23.5 L8 23.5 L8 22.5 L11.4 20 L11 13.5 L1 15 L1 13 L11 9 Z",
  // Slim straight-wing UAV.
  drone: "M12 2 L12.6 12 L20 13 L20 14 L12.6 14.5 L12.4 21 L11.6 21 L11.4 14.5 L4 14 L4 13 L11.4 12 Z",
};

function innerSvg(cls: AircraftClass, color: string, selected: boolean): string {
  const stroke = selected ? ' stroke="#fff" stroke-width="0.6"' : "";
  if (cls === "rotor") {
    // Helicopter: fuselage dot + crossed rotor disk.
    return (
      `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}" fill="none"` +
      ` stroke="${color}" stroke-width="2" stroke-linecap="round">` +
      `<line x1="4" y1="6" x2="20" y2="18"/>` +
      `<line x1="20" y1="6" x2="4" y2="18"/>` +
      `<circle cx="12" cy="12" r="3.2" fill="${color}"${stroke}/>` +
      `</svg>`
    );
  }
  return (
    `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}" fill="${color}"${stroke}>` +
    `<path d="${GLYPH[cls]}"/></svg>`
  );
}

/**
 * Build a rotated marker icon for an aircraft class. The glyph is inline SVG in
 * a wrapper div; heading is applied with a CSS `transform: rotate()`. Kept cheap
 * (no shadow filter beyond a subtle drop-shadow) so hundreds stay smooth.
 */
export function planeIcon(
  track: number,
  color: string,
  selected: boolean,
  cls: AircraftClass,
  emergency: EmergencySeverity | null = null,
  watched = false,
): L.DivIcon {
  const scale = selected ? 1.25 : 1;
  // A pulsing halo behind the glyph signals an emergency squawk.
  const halo = emergency ? `<span class="plane-pulse ${emergency}"></span>` : "";
  // A steady ring marks a watchlisted contact.
  const ring = watched ? `<span class="watch-ring"></span>` : "";
  return L.divIcon({
    className: `plane-marker${emergency ? " has-emergency" : ""}`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    html:
      halo +
      ring +
      `<div class="plane-rot" style="transform:rotate(${Math.round(track)}deg) scale(${scale})">` +
      innerSvg(cls, color, selected) +
      `</div>`,
  });
}

/**
 * Cheaply re-rotate an existing marker's element without rebuilding the icon.
 * Returns true if it updated the DOM.
 */
export function rotateMarkerEl(marker: L.Marker, track: number, scale: number): boolean {
  const el = marker.getElement()?.querySelector<HTMLElement>(".plane-rot");
  if (!el) return false;
  el.style.transform = `rotate(${Math.round(track)}deg) scale(${scale})`;
  return true;
}
