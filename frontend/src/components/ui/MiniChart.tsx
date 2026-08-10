import { useEffect, useRef, useState } from 'react';

interface SparkPoint {
  time: number | string;
  value: number;
}

interface MiniChartProps {
  instrumentKey: string;
  /** Chart line color (positive green / negative red). */
  color: string;
  /** Chart height in pixels. Defaults to 28. */
  height?: number;
  /** Optional candle interval override. Defaults to intraday 1m candles
   *  (today's tape, minute-by-minute). */
  unit?: string;
  interval?: string;
  /** Optional fixed width (otherwise uses container width). */
  width?: number;
}

/**
/**
 * Tiny live intraday line chart for index/stock bento cards.
 * Uses the upstream `/charts/{key}/intraday` endpoint to fetch today's
 * minute-by-minute (1m) candles and renders them as a smooth area-fill +
 * line in an SVG.
 *
 * Re-fetches every 60s so the line tracks the live tape. Falls back to a
 * neutral grey line if no data is available (e.g. indices without history).
 */
export const MiniChart = ({
  instrumentKey,
  color,
  height = 28,
  unit = 'minutes',
  interval = '1',
}: MiniChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<SparkPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!instrumentKey) return;

    let cancelled = false;
    const IST_OFFSET = 5.5 * 60 * 60;

    const fetchPoints = async () => {
      try {
        const url = `/api/v2/charts/${encodeURIComponent(instrumentKey)}/intraday?unit=${unit}&interval=${interval}`;
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const raw = await r.json();
        if (cancelled || !Array.isArray(raw) || raw.length === 0) {
          setFailed(true);
          setLoading(false);
          return;
        }

        // Map to {time (epoch seconds UTC-adjusted), value (close)}
        const mapped: SparkPoint[] = raw.map(d => ({
          time: Math.floor(new Date(d.date).getTime() / 1000) + IST_OFFSET,
          value: d.close,
        }));
        setPoints(mapped);
        setLoading(false);
        setFailed(false);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    };

    fetchPoints();
    const id = setInterval(fetchPoints, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [instrumentKey, unit, interval]);

  // Observe container width so SVG fills card width
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (loading) {
    return (
      <div ref={containerRef} className="w-full skeleton animate-shimmer" style={{ height }} />
    );
  }

  if (failed || points.length < 2 || width === 0) {
    // Fallback: faint dashed line (no fake data — clearly empty)
    return (
      <div ref={containerRef} className="w-full flex items-center" style={{ height }}>
        <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="12" x2="100" y2="12" stroke="var(--color-border-light)" strokeWidth="0.75" strokeDasharray="2,3" />
        </svg>
      </div>
    );
  }

  // Compute polyline + area path
  const W = 100;
  const H = 24;
  const vals = points.map(p => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = W / (points.length - 1);

  const coords: [number, number][] = points.map((p, i) => {
    const x = i * stepX;
    const y = H - ((p.value - min) / range) * (H - 2) - 1;
    return [x, y];
  });

  const polyPoints = coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const areaPath = `M 0,${H} L ${coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')} L ${W},${H} Z`;

  const last = vals[vals.length - 1];
  const first = vals[0];
  const isUp = last >= first;

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full block"
        preserveAspectRatio="none"
      >
        <path d={areaPath} fill={color} opacity="0.12" />
        <polyline
          points={polyPoints}
          fill="none"
          stroke={color}
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Live trailing dot */}
        {coords.length > 0 && (
          <circle
            cx={coords[coords.length - 1][0]}
            cy={coords[coords.length - 1][1]}
            r="1.4"
            fill={color}
            stroke="var(--color-bg-surface)"
            strokeWidth="0.6"
          >
            {isUp && (
              <animate attributeName="r" values="1.4;2;1.4" dur="1.6s" repeatCount="indefinite" />
            )}
          </circle>
        )}
      </svg>
    </div>
  );
};