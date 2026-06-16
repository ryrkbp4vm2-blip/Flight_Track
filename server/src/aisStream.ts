import { config } from "./config.js";
import type { Vessel } from "../../shared/types.js";

/**
 * Optional live military-vessel feed via aisstream.io. Uses Node's global
 * WebSocket (Node 20+/22). Filters the global AIS firehose to *likely-military*
 * contacts: AIS ship type 35 ("Military ops") / 51 ("Search & rescue"), or a
 * name with a navy prefix (USS/HMS/USNS/…). Only positions for already-flagged
 * military MMSIs are retained, which keeps memory bounded.
 *
 * Not exercised in the sandbox (no egress / no key); enabled by AISSTREAM_API_KEY.
 */

const NAVY_PREFIX = /^(USS|USNS|HMS|HMCS|HMAS|HMNZS|FS |ITS |JS |RFS |PLAN |ROKS|SPS |TCG |NAM |INS |HNLMS|FGS )/i;
const MILITARY_TYPES = new Set([35, 51]);
const STALE_MS = 15 * 60 * 1000;

interface MilStatic {
  name?: string;
  type?: number;
  callsign?: string;
  length?: number;
}
interface PosData {
  lat: number;
  lon: number;
  sog?: number;
  cog?: number;
  heading?: number;
  navStatus?: string;
  t: number;
}

const milStatic = new Map<string, MilStatic>();
const pos = new Map<string, PosData>();

let ws: WebSocket | null = null;
let started = false;
let lastError: string | null = null;
let backoff = 1000;

const NAV_STATUS = [
  "Under way using engine", "At anchor", "Not under command",
  "Restricted manoeuverability", "Constrained by draught", "Moored",
  "Aground", "Engaged in fishing", "Under way sailing",
];

function isMilitary(s: MilStatic): boolean {
  if (s.type !== undefined && MILITARY_TYPES.has(s.type)) return true;
  if (s.name && NAVY_PREFIX.test(s.name.trim())) return true;
  return false;
}

function handleMessage(raw: string): void {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const meta = msg.MetaData ?? {};
  const mmsi = String(meta.MMSI ?? "");
  if (!mmsi) return;
  const lat = meta.latitude ?? meta.Latitude;
  const lon = meta.longitude ?? meta.Longitude;

  if (msg.MessageType === "ShipStaticData") {
    const d = msg.Message?.ShipStaticData ?? {};
    const dim = d.Dimension ?? {};
    const s: MilStatic = {
      name: (d.Name ?? meta.ShipName ?? "").trim() || undefined,
      type: typeof d.Type === "number" ? d.Type : undefined,
      callsign: (d.CallSign ?? "").trim() || undefined,
      length: dim.A != null && dim.B != null ? dim.A + dim.B : undefined,
    };
    if (isMilitary(s)) milStatic.set(mmsi, s);
    else milStatic.delete(mmsi);
  }

  // Only keep positions for known-military MMSIs.
  if (milStatic.has(mmsi) && typeof lat === "number" && typeof lon === "number") {
    const pr = msg.Message?.PositionReport ?? {};
    pos.set(mmsi, {
      lat,
      lon,
      sog: typeof pr.Sog === "number" ? pr.Sog : undefined,
      cog: typeof pr.Cog === "number" ? pr.Cog : undefined,
      heading: typeof pr.TrueHeading === "number" && pr.TrueHeading < 360 ? pr.TrueHeading : undefined,
      navStatus: NAV_STATUS[pr.NavigationalStatus] ?? undefined,
      t: Date.now(),
    });
  }
}

function prune(): void {
  const cutoff = Date.now() - STALE_MS;
  for (const [mmsi, p] of pos) {
    if (p.t < cutoff) {
      pos.delete(mmsi);
      milStatic.delete(mmsi);
    }
  }
}

function connect(): void {
  try {
    ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    scheduleReconnect();
    return;
  }

  ws.addEventListener("open", () => {
    backoff = 1000;
    lastError = null;
    ws?.send(
      JSON.stringify({
        APIKey: config.aisApiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      }),
    );
  });
  ws.addEventListener("message", (e: MessageEvent) => {
    handleMessage(typeof e.data === "string" ? e.data : String(e.data));
  });
  ws.addEventListener("error", () => {
    lastError = "aisstream websocket error";
  });
  ws.addEventListener("close", () => {
    ws = null;
    scheduleReconnect();
  });
}

function scheduleReconnect(): void {
  const delay = Math.min(backoff, 60000);
  backoff = Math.min(backoff * 2, 60000);
  setTimeout(connect, delay).unref?.();
}

export function startAisStream(): void {
  if (started || !config.aisApiKey) return;
  started = true;
  connect();
  setInterval(prune, 60000).unref?.();
}

/** Current live military vessels (those with a known position). */
export function getAisVessels(): Vessel[] {
  const out: Vessel[] = [];
  for (const [mmsi, p] of pos) {
    const s = milStatic.get(mmsi);
    out.push({
      mmsi,
      name: s?.name,
      callsign: s?.callsign,
      type: s?.type === 35 ? "Military ops" : s?.type === 51 ? "Search & rescue" : "Naval vessel",
      length: s?.length,
      lat: p.lat,
      lon: p.lon,
      sog: p.sog,
      cog: p.cog,
      heading: p.heading,
      navStatus: p.navStatus,
      seen_pos: Math.round((Date.now() - p.t) / 1000),
    });
  }
  return out;
}

export const getAisError = () => lastError;
