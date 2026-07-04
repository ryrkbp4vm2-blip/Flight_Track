import { useRef, useState } from "react";
import { useAircraftStore } from "../store/useAircraftStore";
import { useMapStore } from "../store/useMapStore";
import { formatAltitude } from "../lib/units";
import { sparkline, nearestSparkPoint, type SparkPoint } from "../lib/spark";

const VB_W = 260;
const VB_H = 48;

/**
 * Altitude trend for the selected aircraft, drawn from its trail buffer.
 * Hovering (or touching) the plot reads out the altitude at that sample.
 */
export default function AltitudeSpark({ hex }: { hex: string }) {
  const trail = useAircraftStore((s) => s.trails.get(hex));
  const units = useMapStore((s) => s.units);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<SparkPoint | null>(null);

  const samples = (trail ?? [])
    .filter((p) => p.alt !== null)
    .map((p) => ({ v: p.alt as number, t: p.t }));
  const geom = sparkline(samples, VB_W, VB_H);
  if (!geom) return null;

  const spanMin = Math.max(1, Math.round((samples[samples.length - 1].t - samples[0].t) / 60_000));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !geom) return;
    const x = ((e.clientX - rect.left) / rect.width) * VB_W;
    setHover(nearestSparkPoint(geom.points, x));
  }

  return (
    <div className="alt-spark">
      <div className="alt-spark-head">
        <span>Altitude · last {spanMin}m</span>
        <span className="alt-spark-readout">
          {formatAltitude((hover ?? geom.points[geom.points.length - 1]).v, units)}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="alt-spark-plot"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Altitude trend over the last ${spanMin} minutes, from ${formatAltitude(geom.min, units)} to ${formatAltitude(geom.max, units)}`}
      >
        <path d={geom.area} className="alt-spark-area" />
        <path d={geom.d} className="alt-spark-line" vectorEffect="non-scaling-stroke" />
        {hover && (
          <>
            <line x1={hover.x} y1={0} x2={hover.x} y2={VB_H} className="alt-spark-cursor" />
            <circle cx={hover.x} cy={hover.y} r={3} className="alt-spark-dot" />
          </>
        )}
      </svg>
      <div className="alt-spark-range">
        <span>{formatAltitude(geom.min, units)}</span>
        <span>{formatAltitude(geom.max, units)}</span>
      </div>
    </div>
  );
}
