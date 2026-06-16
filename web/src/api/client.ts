import type { HealthResponse, MilResponse } from "../../../shared/types";

/** Fetch the latest military feed from our same-origin proxy. */
export async function fetchMil(signal?: AbortSignal): Promise<MilResponse> {
  const res = await fetch("/api/mil", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`/api/mil ${res.status}`);
  return (await res.json()) as MilResponse;
}

/** Fetch proxy diagnostics. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch("/api/health", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`/api/health ${res.status}`);
  return (await res.json()) as HealthResponse;
}
