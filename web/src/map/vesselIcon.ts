import L from "leaflet";

const SIZE = 24;

// Top-down ship hull, pointed bow at the top (north = 0°).
const HULL = "M12 1 C13.8 4 15 6.5 15 10 L15 20 C15 21 14 22 12 22 C10 22 9 21 9 20 L9 10 C9 6.5 10.2 4 12 1 Z";
// A small superstructure block to give the hull orientation.
const TOWER = "M10.6 9 H13.4 V14 H10.6 Z";

export function vesselIcon(
  heading: number,
  color: string,
  selected: boolean,
  sizeScale: number,
): L.DivIcon {
  const scale = (selected ? 1.3 : 1) * sizeScale;
  const stroke = selected ? "#fff" : "rgba(0,0,0,0.55)";
  return L.divIcon({
    className: "vessel-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    html:
      `<div class="vessel-rot" style="transform:rotate(${Math.round(heading)}deg) scale(${scale})">` +
      `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}">` +
      `<path d="${HULL}" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>` +
      `<path d="${TOWER}" fill="rgba(0,0,0,0.45)"/>` +
      `</svg></div>`,
  });
}

export function rotateVesselEl(marker: L.Marker, heading: number, scale: number): boolean {
  const el = marker.getElement()?.querySelector<HTMLElement>(".vessel-rot");
  if (!el) return false;
  el.style.transform = `rotate(${Math.round(heading)}deg) scale(${scale})`;
  return true;
}
