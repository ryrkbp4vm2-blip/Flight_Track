import L from "leaflet";

const SIZE = 26;

/**
 * Build a rotated plane marker. The glyph is an inline SVG inside a wrapper
 * div; heading is applied with a CSS `transform: rotate()`. We keep the icon
 * cheap (no shadow) so hundreds of markers stay smooth.
 */
export function planeIcon(track: number, color: string, selected: boolean): L.DivIcon {
  const scale = selected ? 1.25 : 1;
  return L.divIcon({
    className: "plane-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    html:
      `<div class="plane-rot" style="transform:rotate(${Math.round(track)}deg) scale(${scale})">` +
      `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}" fill="${color}"` +
      (selected ? ' stroke="#fff" stroke-width="0.6"' : "") +
      `>` +
      `<path d="M12 2 L15 11 L22 14 L15 14 L13 22 L11 22 L9 14 L2 14 L9 11 Z"/>` +
      `</svg></div>`,
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
