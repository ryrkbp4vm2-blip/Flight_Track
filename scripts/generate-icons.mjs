// Generates the PWA PNG icons with no external dependencies.
// Draws the plane glyph (same path as plane.svg) on a dark background and
// rasterizes via point-in-polygon, then encodes a minimal PNG with zlib.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../web/public/icons");
mkdirSync(outDir, { recursive: true });

const BG = [11, 15, 20, 255]; // #0b0f14
const FG = [90, 209, 255, 255]; // #5ad1ff

// Plane outline in a 24x24 viewBox (matches public/plane.svg).
const POLY = [
  [12, 2], [15, 11], [22, 14], [15, 14], [13, 22],
  [11, 22], [9, 14], [2, 14], [9, 11],
];

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size, { padding = 0.18 } = {}) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const scale = size * (1 - padding * 2);
  const offset = size * padding;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      // Map pixel into the 24x24 glyph space within the padded area.
      const gx = ((x - offset) / scale) * 24;
      const gy = ((y - offset) / scale) * 24;
      const c = inPoly(gx, gy, POLY) ? FG : BG;
      const p = rowStart + 1 + x * 4;
      raw[p] = c[0];
      raw[p + 1] = c[1];
      raw[p + 2] = c[2];
      raw[p + 3] = c[3];
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  ["icon-192.png", 192, 0.2],
  ["icon-512.png", 512, 0.2],
  ["maskable-512.png", 512, 0.3],
  ["apple-touch-icon.png", 180, 0.2],
];

for (const [name, size, padding] of targets) {
  writeFileSync(path.join(outDir, name), makePng(size, { padding }));
  console.log("wrote", name, `${size}x${size}`);
}
