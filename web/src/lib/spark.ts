// Pure sparkline geometry for the altitude profile in the detail panel.
// Maps timestamped samples into SVG coordinates; no React/DOM dependency so the
// scaling stays unit-testable.

export interface SparkSample {
  /** Sample value (altitude in feet). */
  v: number;
  /** Sample time, ms epoch. */
  t: number;
}

export interface SparkPoint {
  x: number;
  y: number;
  v: number;
  t: number;
}

export interface SparkGeometry {
  /** SVG path ("M x y L x y …") through all points. */
  d: string;
  /** Same path closed to the bottom edge, for a soft area fill. */
  area: string;
  points: SparkPoint[];
  min: number;
  max: number;
}

/**
 * Scale samples into a width×height box. X is proportional to time (trail
 * points are unevenly spaced), Y is inverted so larger values sit higher.
 * Returns null when there are fewer than two plottable samples.
 */
export function sparkline(
  samples: SparkSample[],
  width: number,
  height: number,
  pad = 3,
): SparkGeometry | null {
  const pts = samples.filter((s) => Number.isFinite(s.v) && Number.isFinite(s.t));
  if (pts.length < 2) return null;

  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points: SparkPoint[] = pts.map((p, i) => {
    // Degenerate spans (all same timestamp / flat value) center evenly.
    const fx = t1 > t0 ? (p.t - t0) / (t1 - t0) : i / (pts.length - 1);
    const fy = max > min ? (p.v - min) / (max - min) : 0.5;
    return {
      x: pad + fx * w,
      y: pad + (1 - fy) * h,
      v: p.v,
      t: p.t,
    };
  });

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${d} L${points[points.length - 1].x.toFixed(1)} ${height} L${points[0].x.toFixed(1)} ${height} Z`;
  return { d, area, points, min, max };
}

/** The plotted point nearest to an x offset (for the hover readout). */
export function nearestSparkPoint(points: SparkPoint[], x: number): SparkPoint {
  let best = points[0];
  for (const p of points) {
    if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
  }
  return best;
}
