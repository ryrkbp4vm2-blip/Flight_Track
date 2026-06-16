import L from "leaflet";
import type { VesselClass } from "../lib/vessel";

const SIZE = 24;

// Top-down ship hull, pointed bow at the top (north = 0°).
const HULL = "M12 1 C13.8 4 15 6.5 15 10 L15 20 C15 21 14 22 12 22 C10 22 9 21 9 20 L9 10 C9 6.5 10.2 4 12 1 Z";
// Wide flat-deck hull for carriers / amphibious assault ships.
const DECK = "M12 1 C14.6 4 16 6.5 16 10 L16 20 C16 21.2 14.6 22 12 22 C9.4 22 8 21.2 8 20 L8 10 C8 6.5 9.4 4 12 1 Z";
// Slim teardrop for submarines.
const SUB = "M12 2 C13.4 5 13.8 8 13.8 12 C13.8 17 13 21 12 22 C11 21 10.2 17 10.2 12 C10.2 8 10.6 5 12 2 Z";
// A small superstructure block to give a hull orientation.
const TOWER = "M10.6 9 H13.4 V14 H10.6 Z";
// Carrier island, offset to starboard.
const ISLAND = "M12.4 8 H14 V13 H12.4 Z";

function glyphSvg(cls: VesselClass, color: string, stroke: string): string {
  if (cls === "submarine") {
    // Dashed outline hints that AIS is only seen when surfaced.
    return (
      `<path d="${SUB}" fill="${color}" fill-opacity="0.85" stroke="${stroke}" stroke-width="0.9" stroke-dasharray="2 1.4"/>` +
      `<circle cx="12" cy="12" r="1.4" fill="rgba(0,0,0,0.5)"/>`
    );
  }
  if (cls === "carrier" || cls === "amphibious") {
    return (
      `<path d="${DECK}" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>` +
      `<line x1="12" y1="3" x2="12" y2="21" stroke="rgba(0,0,0,0.35)" stroke-width="0.7"/>` +
      `<path d="${ISLAND}" fill="rgba(0,0,0,0.5)"/>`
    );
  }
  return (
    `<path d="${HULL}" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>` +
    `<path d="${TOWER}" fill="rgba(0,0,0,0.45)"/>`
  );
}

export function vesselIcon(
  heading: number,
  color: string,
  selected: boolean,
  sizeScale: number,
  cls: VesselClass,
  watched = false,
): L.DivIcon {
  const scale = (selected ? 1.3 : 1) * sizeScale;
  const stroke = selected ? "#fff" : "rgba(0,0,0,0.55)";
  const ring = watched ? `<span class="watch-ring"></span>` : "";
  return L.divIcon({
    className: "vessel-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    html:
      ring +
      `<div class="vessel-rot" style="transform:rotate(${Math.round(heading)}deg) scale(${scale})">` +
      `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}">` +
      glyphSvg(cls, color, stroke) +
      `</svg></div>`,
  });
}

export function rotateVesselEl(marker: L.Marker, heading: number, scale: number): boolean {
  const el = marker.getElement()?.querySelector<HTMLElement>(".vessel-rot");
  if (!el) return false;
  el.style.transform = `rotate(${Math.round(heading)}deg) scale(${scale})`;
  return true;
}
