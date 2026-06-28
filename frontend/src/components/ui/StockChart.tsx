import { useEffect, useRef, useState } from 'react';
import {
    createChart,
    ColorType,
    CrosshairMode,
    AreaSeries,
    CandlestickSeries,
    HistogramSeries,
} from 'lightweight-charts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { chartsApi } from '../../lib/api';
import { Skeleton } from './skeleton';

type Range = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | '10Y';
type ChartType = 'area' | 'candle';

interface IntervalOption {
    label: string;
    unit: string;
    interval: string;
    isIntraday: boolean;
}

const RANGES: Range[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', '10Y'];

// Upstox constraints:
// minutes: max 1M retrieval (≤15min intervals), 1 quarter (>15min)
// hours:   max 1 quarter retrieval
// days:    max 1 decade
// weeks:   no limit
// months:  no limit
const INTERVAL_OPTIONS: Record<Range, IntervalOption[]> = {
    '1D': [
        { label: '1m',  unit: 'minutes', interval: '1',  isIntraday: true },
        { label: '5m',  unit: 'minutes', interval: '5',  isIntraday: true },
        { label: '15m', unit: 'minutes', interval: '15', isIntraday: true },
        { label: '30m', unit: 'minutes', interval: '30', isIntraday: true },
        { label: '1h',  unit: 'minutes', interval: '60', isIntraday: true },
    ],
    // hours max retrieval = 1 quarter, fully covers 1W
    '1W': [
        { label: '1h', unit: 'hours', interval: '1', isIntraday: false },
        { label: '2h', unit: 'hours', interval: '2', isIntraday: false },
        { label: '3h', unit: 'hours', interval: '3', isIntraday: false },
    ],
    // hours max retrieval = 1 quarter, fully covers 1M
    '1M': [
        { label: '1h', unit: 'hours', interval: '1', isIntraday: false },
        { label: '2h', unit: 'hours', interval: '2', isIntraday: false },
        { label: '1D', unit: 'days',  interval: '1', isIntraday: false },
    ],
    // hours max = 1 quarter = ~3M, right at the edge — use 2h+ only
    '3M': [
        { label: '2h', unit: 'hours', interval: '2', isIntraday: false },
        { label: '1D', unit: 'days',  interval: '1', isIntraday: false },
        { label: '1W', unit: 'weeks', interval: '1', isIntraday: false },
    ],
    // hours max is 1 quarter, can't cover 6M — days/weeks only
    '6M': [
        { label: '1D', unit: 'days',  interval: '1', isIntraday: false },
        { label: '1W', unit: 'weeks', interval: '1', isIntraday: false },
    ],
    '1Y': [
        { label: '1D', unit: 'days',   interval: '1', isIntraday: false },
        { label: '1W', unit: 'weeks',  interval: '1', isIntraday: false },
        { label: '1M', unit: 'months', interval: '1', isIntraday: false },
    ],
    '5Y': [
        { label: '1W', unit: 'weeks',  interval: '1', isIntraday: false },
        { label: '1M', unit: 'months', interval: '1', isIntraday: false },
    ],
    '10Y': [
        { label: '1M', unit: 'months', interval: '1', isIntraday: false },
    ],
};

const DEFAULT_INTERVAL: Record<Range, IntervalOption> = {
    '1D':  INTERVAL_OPTIONS['1D'][0],  // 1m
    '1W':  INTERVAL_OPTIONS['1W'][0],  // 1h
    '1M':  INTERVAL_OPTIONS['1M'][2],  // 1D
    '3M':  INTERVAL_OPTIONS['3M'][1],  // 1D
    '6M':  INTERVAL_OPTIONS['6M'][0],  // 1D
    '1Y':  INTERVAL_OPTIONS['1Y'][1],  // 1W
    '5Y':  INTERVAL_OPTIONS['5Y'][1],  // 1M
    '10Y': INTERVAL_OPTIONS['10Y'][0], // 1M
};

function getThemeOptions(isDark: boolean) {
    return {
        layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: isDark ? '#a1a1aa' : '#52525b',
            fontSize: 13,
        },
        grid: {
            vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
        },
        rightPriceScale: {
            borderColor: isDark ? '#27272a' : '#e4e4e7',
            minimumWidth: 80,
        },
        timeScale: {
            borderColor: isDark ? '#27272a' : '#e4e4e7',
        },
    };
}

interface HoveredData {
    open: number; high: number; low: number; close: number; volume?: number;
}

const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtVol = (n?: number): string | null => {
    if (!n || n === 0) return null;
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)}Cr`;
    if (n >= 100_000)    return `${(n / 100_000).toFixed(2)}L`;
    if (n >= 1_000)      return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
};

export const StockChart = ({ instrumentKey }: { instrumentKey: string }) => {
    const { isDark } = useTheme();
    const isDarkRef    = useRef(isDark);
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef     = useRef<any>(null);

    const [range, setRange]                       = useState<Range>('1D');
    const [selectedInterval, setSelectedInterval] = useState<IntervalOption>(DEFAULT_INTERVAL['1D']);
    const [chartType, setChartType]               = useState<ChartType>('area');
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState('');
    const [hovered, setHovered]                   = useState<HoveredData | null>(null);

    // Keep ref in sync so the main effect can read isDark without it being a dep
    useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

    // Theme-only effect — applyOptions, never recreates the chart
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions(getThemeOptions(isDark));
    }, [isDark]);

    const handleRangeChange = (r: Range) => {
        setRange(r);
        setSelectedInterval(DEFAULT_INTERVAL[r]);
    };


    // Main chart effect — isDark intentionally NOT in deps
    useEffect(() => {
        if (!containerRef.current) return;

        // Tear down previous instance
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const dark = isDarkRef.current;
        const pos  = dark ? '#5ab870' : '#2e7d32';
        const neg  = dark ? '#e06060' : '#c62828';

        const chart = createChart(containerRef.current, {
            ...getThemeOptions(dark),
            crosshair: { mode: CrosshairMode.Normal },
            timeScale: {
                ...getThemeOptions(dark).timeScale,
                timeVisible: selectedInterval.unit === 'minutes' || selectedInterval.unit === 'hours',
                secondsVisible: false,
            },
            width:  containerRef.current.clientWidth,
            height: 400,
            handleScroll: true,
            handleScale:  true,
        });

        chartRef.current = chart;

        let aborted = false;
        setLoading(true);
        setError('');
        setHovered(null);

        const fetchData = async () => {
            try {
                const res = selectedInterval.isIntraday
                    ? await chartsApi.intraday(instrumentKey, selectedInterval.unit, selectedInterval.interval)
                    : await chartsApi.history(instrumentKey, range, selectedInterval.unit, selectedInterval.interval);

                if (aborted || !chartRef.current) return;

                const rawData = res.data;
                if (!rawData?.length) {
                    setError('No data available for this range');
                    setLoading(false);
                    return;
                }

                // Time mapper — JS Date correctly handles +05:30 offset, no manual IST math needed
                const usesTimestamp = selectedInterval.unit === 'minutes' || selectedInterval.unit === 'hours';
                const IST_OFFSET = 5.5 * 60 * 60; // 19800 seconds
                const toTime = (d: typeof rawData[0]): any =>
                    usesTimestamp
                        ? Math.floor(new Date(d.date).getTime() / 1000) + IST_OFFSET
                        : d.date.split('T')[0];

                // Deduplicate by time key — prevents lightweight-charts assertion crash
                const seen = new Set<string | number>();
                const deduped = rawData.filter(d => {
                    const key = toTime(d);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                const mapped = deduped.map(d => ({ ...d, _t: toTime(d) }));

                // ── Main series ───────────────────────────────────────────────
                if (chartType === 'area') {
                    const series = chart.addSeries(AreaSeries, {
                        lineColor: pos,
                        topColor:    dark ? 'rgba(90,184,112,0.18)' : 'rgba(46,125,50,0.12)',
                        bottomColor: 'rgba(0,0,0,0)',
                        lineWidth: 2,
                        priceLineVisible: false,
                    });
                    series.setData(mapped.map(d => ({ time: d._t, value: d.close })));

                    chart.subscribeCrosshairMove(param => {
                        if (!param.point || !param.seriesData.has(series)) { setHovered(null); return; }
                        const idx = (param.logical ?? -1) as number;
                        if (idx >= 0 && idx < mapped.length) {
                            const d = mapped[idx];
                            setHovered({ open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume });
                        }
                    });
                } else {
                    const series = chart.addSeries(CandlestickSeries, {
                        upColor: pos, downColor: neg,
                        borderVisible: false,
                        wickUpColor: pos, wickDownColor: neg,
                    });
                    series.setData(mapped.map(d => ({
                        time: d._t, open: d.open, high: d.high, low: d.low, close: d.close,
                    })));

                    chart.subscribeCrosshairMove(param => {
                        if (!param.point || !param.seriesData.has(series)) { setHovered(null); return; }
                        const sd  = param.seriesData.get(series) as any;
                        const idx = (param.logical ?? -1) as number;
                        const vol = idx >= 0 && idx < mapped.length ? mapped[idx].volume : undefined;
                        if (sd) setHovered({ open: sd.open, high: sd.high, low: sd.low, close: sd.close, volume: vol });
                    });
                }

                // ── Volume — 22% of chart height, high opacity ────────────────
                const volSeries = chart.addSeries(HistogramSeries, {
                    priceFormat: { type: 'volume' },
                    priceScaleId: 'vol',
                });
                chart.priceScale('vol').applyOptions({
                    scaleMargins: { top: 0.78, bottom: 0 },
                });
                volSeries.setData(mapped.map(d => ({
                    time:  d._t,
                    value: d.volume,
                    color: d.close >= d.open
                        ? (dark ? 'rgba(90,184,112,0.50)' : 'rgba(46,125,50,0.40)')
                        : (dark ? 'rgba(224,96,96,0.50)'  : 'rgba(198,40,40,0.40)'),
                })));

                chart.timeScale().fitContent();
            } catch (err) {
                console.error('Chart error:', err);
                if (!aborted) setError('Failed to load chart data');
            } finally {
                if (!aborted) setLoading(false);
            }
        };

        fetchData();

        const observer = new ResizeObserver(() => {
            if (!containerRef.current || !chartRef.current) return;
            const width = containerRef.current.clientWidth;
            if (width > 0) chartRef.current.applyOptions({ width });
        });
        observer.observe(containerRef.current);

        return () => {
            aborted = true;
            observer.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [instrumentKey, range, selectedInterval, chartType]);
    // ↑ isDark intentionally excluded — handled by the applyOptions effect above

    return (
        <div className="space-y-2">

            {/* Top row — sub-interval buttons + fullscreen */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 flex-wrap">
                    {INTERVAL_OPTIONS[range].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => setSelectedInterval(opt)}
                            className={`px-2 py-1 text-[10px] font-mono rounded-md transition-colors ${
                                selectedInterval.label === opt.label
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-primary hover:bg-neutral'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* OHLCV hover bar */}
            <div className="h-5 flex items-center gap-3 text-[11px] font-mono">
                {hovered ? (
                    <>
                        <span className="text-muted">O <span className="text-primary">{fmt(hovered.open)}</span></span>
                        <span className="text-positive">H <span className="text-primary">{fmt(hovered.high)}</span></span>
                        <span className="text-negative">L <span className="text-primary">{fmt(hovered.low)}</span></span>
                        <span className={hovered.close >= hovered.open ? 'text-positive' : 'text-negative'}>
              C {fmt(hovered.close)}
            </span>
                        {fmtVol(hovered.volume) && (
                            <span className="text-muted">V <span className="text-primary">{fmtVol(hovered.volume)}</span></span>
                        )}
                    </>
                ) : (
                    <span className="text-muted text-[10px]">Hover to see OHLCV</span>
                )}
            </div>

            {/* Chart area */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col gap-2 pointer-events-none">
                        <Skeleton className="rounded-lg" style={{ height: 320 }} />
                        <Skeleton className="rounded-lg" style={{ height: 64 }} />
                    </div>
                )}
                {error && !loading && (
                    <div className="flex items-center justify-center text-[12px] text-muted" style={{ height: 400 }}>
                        {error}
                    </div>
                )}
                <div ref={containerRef} className="w-full" />
            </div>

            {/* Bottom row — range selector + chart type */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1 flex-wrap">
                    {RANGES.map(r => (
                        <button
                            key={r}
                            onClick={() => handleRangeChange(r)}
                            className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors ${
                                range === r
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-primary hover:bg-neutral'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    {(['area', 'candle'] as ChartType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setChartType(t)}
                            className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors capitalize ${
                                chartType === t
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-primary hover:bg-neutral'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};