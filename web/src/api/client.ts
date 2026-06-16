import type { MilResponse, VesselResponse } from "../../../shared/types";

export interface FeedResult<T> {
  data: T;
  /** True when the server is serving bundled/simulated sample data. */
  sample: boolean;
}

/** Fetch the latest military aircraft feed from our same-origin proxy. */
export async function fetchMil(signal?: AbortSignal): Promise<FeedResult<MilResponse>> {
  const res = await fetch("/api/mil", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`/api/mil ${res.status}`);
  return { data: (await res.json()) as MilResponse, sample: res.headers.get("X-Data-Sample") === "1" };
}

/** Fetch the latest military vessel feed from our same-origin proxy. */
export async function fetchVessels(signal?: AbortSignal): Promise<FeedResult<VesselResponse>> {
  const res = await fetch("/api/vessels", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`/api/vessels ${res.status}`);
  return { data: (await res.json()) as VesselResponse, sample: res.headers.get("X-Data-Sample") === "1" };
}
