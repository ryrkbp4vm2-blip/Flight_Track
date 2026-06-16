// Renders static demo images of the Military Flight Tracker UI using the real
// sample data, classification, glyph paths and colors — projected over a world
// map. Produces PNGs via resvg (no browser needed).
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json" assert { type: "json" };
import { buildSample } from "../server/src/sampleData.js";
import { BASE_VESSELS } from "../server/src/vesselSample.js";
import { classifyAircraft, classLabel } from "../web/src/lib/classify.js";
import { emergencyInfo } from "../web/src/lib/emergency.js";
import { classifyVessel, vesselColor, vesselLabel, vesselName, vesselSizeScale } from "../web/src/lib/vessel.js";
import { altitudeColor, COLOR_SELECTED } from "../web/src/map/mapConfig.js";
import type { Aircraft, Vessel } from "../shared/types.js";

const W = 1200;
const H = 760;

// --- projection (equirectangular over the full canvas) --------------------
const projX = (lon: number) => ((lon + 180) / 360) * W;
const projY = (lat: number) => ((90 - lat) / 180) * H;

// --- world land paths ------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const geo = feature(world as any, (world as any).objects.countries) as any;

function countryPaths(): string {
  const out: string[] = [];
  for (const f of geo.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        let d = "";
        for (let i = 0; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          d += `${i === 0 ? "M" : "L"}${projX(lon).toFixed(1)} ${projY(lat).toFixed(1)} `;
        }
        out.push(`<path d="${d}Z"/>`);
      }
    }
  }
  return `<g fill="#161d28" stroke="#243245" stroke-width="0.5">${out.join("")}</g>`;
}

function graticule(): string {
  const lines: string[] = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    lines.push(`<line x1="${projX(lon)}" y1="0" x2="${projX(lon)}" y2="${H}"/>`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    lines.push(`<line x1="0" y1="${projY(lat)}" x2="${W}" y2="${projY(lat)}"/>`);
  }
  return `<g stroke="rgba(120,150,180,0.07)" stroke-width="1">${lines.join("")}</g>`;
}

// --- aircraft glyphs (mirror web/src/map/planeIcon.ts) --------------------
const GLYPH: Record<string, string> = {
  plane: "M12 2 L15 11 L22 14 L15 14 L13 22 L11 22 L9 14 L2 14 L9 11 Z",
  fighter: "M12 1 L13 12 L19 20 L12.6 17 L13 22 L11 22 L11.4 17 L5 20 L11 12 Z",
  heavy: "M12 2 L13 9 L23 13 L23 15 L13 13.5 L12.6 20 L16 22.5 L16 23.5 L8 23.5 L8 22.5 L11.4 20 L11 13.5 L1 15 L1 13 L11 9 Z",
  drone: "M12 2 L12.6 12 L20 13 L20 14 L12.6 14.5 L12.4 21 L11.6 21 L11.4 14.5 L4 14 L4 13 L11.4 12 Z",
};

function altOf(ac: Aircraft): number | null {
  if (ac.alt_baro === "ground") return 0;
  if (typeof ac.alt_baro === "number") return ac.alt_baro;
  return null;
}

function glyph(ac: Aircraft, selected: boolean): string {
  if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return "";
  const cls = classifyAircraft(ac);
  const em = emergencyInfo(ac);
  const color = em
    ? em.severity === "critical"
      ? "#ff3b3b"
      : "#ff9e2c"
    : selected
      ? COLOR_SELECTED
      : altitudeColor(altOf(ac));
  const x = projX(ac.lon);
  const y = projY(ac.lat);
  const s = (selected ? 1.5 : 1.05) * (1);
  const track = typeof ac.track === "number" ? ac.track : 0;
  const stroke = selected ? ' stroke="#fff" stroke-width="0.7"' : "";
  const shadow = ' filter="url(#sh)"';
  // Static emergency halo (the live app animates this).
  const halo = em
    ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${em.severity === "critical" ? "rgba(255,59,59,0.32)" : "rgba(255,158,44,0.3)"}"/>`
    : "";
  const open = `<g${shadow} transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${track}) scale(${s}) translate(-12 -12)">`;
  if (cls === "rotor") {
    return (
      halo +
      open +
      `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round">` +
      `<line x1="4" y1="6" x2="20" y2="18"/><line x1="20" y1="6" x2="4" y2="18"/>` +
      `<circle cx="12" cy="12" r="3.2" fill="${color}"${stroke}/></g></g>`
    );
  }
  return halo + open + `<path d="${GLYPH[cls]}" fill="${color}"${stroke}/></g>`;
}

// Ship hull glyph (mirrors web/src/map/vesselIcon.ts).
const HULL = "M12 1 C13.8 4 15 6.5 15 10 L15 20 C15 21 14 22 12 22 C10 22 9 21 9 20 L9 10 C9 6.5 10.2 4 12 1 Z";
const TOWER = "M10.6 9 H13.4 V14 H10.6 Z";

function vesselGlyph(v: Vessel, selected: boolean): string {
  if (typeof v.lat !== "number" || typeof v.lon !== "number") return "";
  const cls = classifyVessel(v);
  const color = selected ? COLOR_SELECTED : vesselColor(cls);
  const x = projX(v.lon);
  const y = projY(v.lat);
  const s = (selected ? 1.4 : 1.0) * vesselSizeScale(cls);
  const heading = typeof v.heading === "number" ? v.heading : (v.cog ?? 0);
  const stroke = selected ? "#fff" : "rgba(0,0,0,0.55)";
  return (
    `<g filter="url(#sh)" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${heading}) scale(${s}) translate(-12 -12)">` +
    `<path d="${HULL}" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>` +
    `<path d="${TOWER}" fill="rgba(0,0,0,0.45)"/></g>`
  );
}

// --- UI helpers ------------------------------------------------------------
const FONT = "DejaVu Sans, sans-serif";

function panel(x: number, y: number, w: number, h: number, r = 10): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="rgba(16,22,30,0.93)" stroke="rgba(120,150,180,0.2)"/>`;
}
function text(
  x: number,
  y: number,
  s: string,
  { size = 15, color = "#e6edf3", weight = "normal", anchor = "start" } = {},
): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc}</text>`;
}

function topBar(): string {
  return [
    panel(12, 12, 150, 40),
    text(30, 37, "✈", { size: 17, color: "#5ad1ff" }),
    text(52, 37, "MilTrack", { size: 16, weight: "bold" }),
    panel(170, 12, W - 170 - 64, 40),
    text(186, 37, "⌕", { size: 16, color: "#8b97a4" }),
    text(208, 37, "Search callsign, type, hex…", { size: 15, color: "#8b97a4" }),
    panel(W - 52, 12, 40, 40),
    text(W - 32, 38, "☰", { size: 18, anchor: "middle" }),
  ].join("");
}

function statusBar(air: number, sea: number, emergencies: number): string {
  const y = H - 44;
  return [
    panel(12, y, 600, 34),
    text(26, y + 22, String(air), { size: 14, weight: "bold", color: "#5ad1ff" }),
    text(44, y + 22, "aircraft", { size: 14 }),
    text(110, y + 22, "·", { size: 14, color: "#8b97a4" }),
    text(122, y + 22, String(sea), { size: 14, weight: "bold", color: "#4dd0e1" }),
    text(140, y + 22, "vessels", { size: 14 }),
    text(208, y + 22, "updated 2s ago", { size: 14, color: "#8b97a4" }),
    emergencies > 0
      ? `<rect x="330" y="${y + 6}" width="130" height="22" rx="8" fill="rgba(255,59,59,0.16)" stroke="#ff3b3b"/>` +
        text(395, y + 21, `⚠ ${emergencies} emergency`, { size: 12, weight: "bold", color: "#ff6b6b", anchor: "middle" })
      : "",
    `<rect x="476" y="${y + 8}" width="92" height="18" rx="4" fill="#ff7a59"/>`,
    text(522, y + 21, "SAMPLE DATA", { size: 11, weight: "bold", color: "#1a0c06", anchor: "middle" }),
  ].join("");
}

function layerToggle(): string {
  const segs = [
    ["✈⚓", "Both", true],
    ["✈", "Air", false],
    ["⚓", "Sea", false],
  ] as const;
  const w = 64;
  const x0 = W - segs.length * w - 8;
  const y = 60;
  return [
    panel(x0, y, segs.length * w, 40),
    ...segs.map(([g, label, active], i) => {
      const x = x0 + i * w;
      const bg = active
        ? `<rect x="${x}" y="${y}" width="${w}" height="40" rx="${i === 0 ? 10 : 0}" fill="rgba(90,209,255,0.14)"/>`
        : "";
      return (
        bg +
        text(x + w / 2, y + 17, g, { size: 13, color: active ? "#5ad1ff" : "#8b97a4", anchor: "middle" }) +
        text(x + w / 2, y + 32, label, { size: 11, color: active ? "#5ad1ff" : "#8b97a4", anchor: "middle" })
      );
    }),
  ].join("");
}

function legend(): string {
  const bands = [
    ["#b794ff", "40k+ ft"],
    ["#5ad1ff", "30–40k"],
    ["#9be15d", "20–30k"],
    ["#ffd23f", "10–20k"],
    ["#ff7a59", "0–10k"],
    ["#7a8794", "Ground"],
  ];
  const x = W - 150;
  const y = H - 44 - 8 - (bands.length * 20 + 34);
  const rows = bands
    .map((b, i) => {
      const ry = y + 36 + i * 20;
      return (
        `<rect x="${x + 14}" y="${ry - 9}" width="14" height="10" rx="2" fill="${b[0]}"/>` +
        text(x + 36, ry, b[1] as string, { size: 12 })
      );
    })
    .join("");
  return [
    panel(x, y, 130, bands.length * 20 + 34),
    text(x + 14, y + 20, "Altitude ▾", { size: 12, color: "#8b97a4" }),
    rows,
  ].join("");
}

function detailPanel(ac: Aircraft): string {
  const x = 12;
  const y = 64;
  const w = 320;
  const h = 300;
  const cs = (ac.flight ?? "").trim() || ac.hex.toUpperCase();
  const alt = ac.alt_baro === "ground" ? "Ground" : `${(altOf(ac) ?? 0).toLocaleString()} ft`;
  const rows: [string, string][] = [
    ["Type", ac.t ?? "—"],
    ["Registration", ac.r ?? "—"],
    ["Hex", ac.hex.toUpperCase()],
    ["Squawk", ac.squawk ?? "—"],
    ["Altitude", alt],
    ["Vertical", "Level"],
    ["Speed", `${Math.round(ac.gs ?? 0)} kt`],
    ["Heading", `${Math.round(ac.track ?? 0)}°`],
  ];
  const grid = rows
    .map(([label, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const gx = x + 16 + col * 150;
      const gy = y + 96 + row * 44;
      return (
        text(gx, gy, label.toUpperCase(), { size: 11, color: "#8b97a4" }) +
        text(gx, gy + 20, val, { size: 15 })
      );
    })
    .join("");
  return [
    panel(x, y, w, h, 14),
    text(x + 16, y + 34, cs, { size: 22, weight: "bold", color: "#5ad1ff" }),
    text(x + w - 22, y + 32, "✕", { size: 16, color: "#8b97a4", anchor: "middle" }),
    text(x + 16, y + 60, classLabel(classifyAircraft(ac)).toUpperCase(), { size: 12, color: "#8b97a4" }),
    grid,
    // action buttons
    `<rect x="${x + 16}" y="${y + h - 52}" width="138" height="36" rx="8" fill="rgba(90,209,255,0.1)" stroke="#5ad1ff"/>`,
    text(x + 85, y + h - 29, "Center", { size: 14, color: "#5ad1ff", anchor: "middle" }),
    `<rect x="${x + 166}" y="${y + h - 52}" width="138" height="36" rx="8" fill="rgba(255,210,63,0.14)" stroke="#ffd23f"/>`,
    text(x + 235, y + h - 29, "Following ✓", { size: 14, color: "#ffd23f", anchor: "middle" }),
  ].join("");
}

function vesselDetailPanel(v: Vessel): string {
  const x = 12;
  const y = 64;
  const w = 320;
  const h = 302;
  const heading = typeof v.heading === "number" ? v.heading : (v.cog ?? 0);
  const rows: [string, string][] = [
    ["Type", v.type ?? "—"],
    ["Navy", v.country ?? "—"],
    ["Hull", v.hull ?? "—"],
    ["MMSI", v.mmsi],
    ["Speed", `${(v.sog ?? 0).toFixed(0)} kn`],
    ["Course", `${Math.round(heading)}°`],
    ["Length", `${v.length ?? "—"} m`],
    ["Callsign", v.callsign ?? "—"],
  ];
  const grid = rows
    .map(([label, val], i) => {
      const gx = x + 16 + (i % 2) * 150;
      const gy = y + 96 + Math.floor(i / 2) * 44;
      return (
        text(gx, gy, label.toUpperCase(), { size: 11, color: "#8b97a4" }) +
        text(gx, gy + 20, val, { size: 15 })
      );
    })
    .join("");
  return [
    panel(x, y, w, h, 14),
    text(x + 16, y + 34, vesselName(v), { size: 22, weight: "bold", color: "#4dd0e1" }),
    text(x + w - 22, y + 32, "✕", { size: 16, color: "#8b97a4", anchor: "middle" }),
    text(x + 16, y + 60, "⚓ " + vesselLabel(classifyVessel(v)).toUpperCase(), { size: 12, color: "#8b97a4" }),
    grid,
    `<rect x="${x + 16}" y="${y + h - 46}" width="${w - 32}" height="34" rx="8" fill="rgba(90,209,255,0.1)" stroke="#5ad1ff"/>`,
    text(x + w / 2, y + h - 24, "Center on map", { size: 14, color: "#5ad1ff", anchor: "middle" }),
  ].join("");
}

function vesselTrail(v: Vessel): string {
  if (typeof v.lat !== "number" || typeof v.lon !== "number") return "";
  const heading = ((typeof v.heading === "number" ? v.heading : (v.cog ?? 0)) * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const dist = i * 0.5;
    const lon = v.lon - Math.sin(heading) * dist;
    const lat = v.lat - Math.cos(heading) * dist;
    pts.push(`${projX(lon).toFixed(1)},${projY(lat).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(" ")}" fill="none" stroke="#ffd23f" stroke-width="3" stroke-opacity="0.85" stroke-dasharray="4 4" stroke-linecap="round"/>`;
}

function trail(ac: Aircraft): string {
  if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return "";
  const track = ((ac.track ?? 0) * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dist = i * 1.1; // degrees behind, along reverse heading
    const lon = ac.lon - Math.sin(track) * dist;
    const lat = ac.lat - Math.cos(track) * dist;
    pts.push(`${projX(lon).toFixed(1)},${projY(lat).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(" ")}" fill="none" stroke="#ffd23f" stroke-width="3" stroke-opacity="0.85" stroke-linecap="round"/>`;
}

// --- compose ---------------------------------------------------------------
function defs(): string {
  return (
    `<defs><filter id="sh" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="#000" flood-opacity="0.8"/>` +
    `</filter></defs>`
  );
}

function baseMap(): string {
  return (
    `<rect width="${W}" height="${H}" fill="#0b0f14"/>` + graticule() + countryPaths()
  );
}

function emCount(acs: Aircraft[]): number {
  return acs.filter((a) => emergencyInfo(a)).length;
}

function renderOverview(): string {
  const sample = buildSample();
  const ships = BASE_VESSELS.map((v) => vesselGlyph(v, false)).join("");
  const planes = sample.ac.map((ac) => glyph(ac, false)).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    defs() +
    baseMap() +
    ships +
    planes +
    topBar() +
    layerToggle() +
    legend() +
    statusBar(sample.ac.length, BASE_VESSELS.length, emCount(sample.ac)) +
    `</svg>`
  );
}

function renderSelected(): string {
  const sample = buildSample();
  // Feature a selected aircraft carrier to showcase the new vessel layer.
  const selMmsi = "338901000"; // USS Gerald R. Ford
  const selected = BASE_VESSELS.find((v) => v.mmsi === selMmsi)!;
  const ships = BASE_VESSELS.map((v) => vesselGlyph(v, v.mmsi === selMmsi)).join("");
  const planes = sample.ac.map((ac) => glyph(ac, false)).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    defs() +
    baseMap() +
    vesselTrail(selected) +
    ships +
    planes +
    topBar() +
    vesselDetailPanel(selected) +
    statusBar(sample.ac.length, BASE_VESSELS.length, emCount(sample.ac)) +
    `</svg>`
  );
}

function rasterize(svg: string, out: string) {
  const png = new Resvg(svg, {
    background: "#0b0f14",
    font: { loadSystemFonts: true },
    fitTo: { mode: "width", value: W },
  })
    .render()
    .asPng();
  writeFileSync(out, png);
  console.log("wrote", out, png.length, "bytes");
}

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demo");
mkdirSync(outDir, { recursive: true });
rasterize(renderOverview(), path.join(outDir, "overview.png"));
rasterize(renderSelected(), path.join(outDir, "selected.png"));
