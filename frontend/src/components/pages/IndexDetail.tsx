import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Activity,
  BarChart3,
  Info,
  Layers,
  Building2,
  CreditCard,
} from 'lucide-react';
import { useIndexDetail } from '../../hooks/useIndexDetail';
import { useTheme } from '../../context/ThemeContext';
import { analysisApi, chartsApi, classifyAnalysisError, type AnalysisError } from '../../lib/api';
import { fmt, getChangeColor } from '../../lib/utils';
import { StockChart } from '../ui/StockChart';
import { AnalysisDialog } from '../ui/AnalysisDialog';
import { ComingSoon, Tooltip } from '../ui/ComingSoon';

/* ── Summary stats derived from chart data (no backend change needed) ── */
interface DayStats {
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
}

interface YearStats {
  yearHigh: number | null;
  yearLow: number | null;
}

const AI_CREDITS_TIP = (
  <>
    <p className="font-medium mb-1">3 free AI credits / day</p>
    <p className="opacity-90">
      We&apos;re expanding our AI services, so each user gets a limited number of
      free analyses per day. Payments are coming soon to unlock higher limits,
      chat-based analysis, and more.
    </p>
  </>
);

export const NSEIndexDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { index, loading, error, refreshIndex } = useIndexDetail(symbol);
  const { isDark } = useTheme();

  // AI analysis state — collapsed by default; the user expands to read.
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<Date | null>(null);
  // Master toggle for whether the analysis panel is mounted at all.
  const [analysisDismissed, setAnalysisDismissed] = useState(false);
  // Credits remaining today — decrements after a successful analysis.
  const [credits, setCredits] = useState<number>(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('stoxy-ai-credits')
      : null;
    if (stored != null) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed >= 0) return Math.min(3, parsed);
    }
    return 3;
  });

  // Reset AI analysis state when navigating between different indices
  useEffect(() => {
    setAnalysisOpen(false);
    setAnalysisLoading(false);
    setAnalysisError(null);
    setAnalysisText(null);
    setAnalysisGeneratedAt(null);
    setAnalysisDismissed(false);
  }, [symbol]);

  // Persist credits; reset to 3 at the start of a new day.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('stoxy-ai-credits-day')
      : null;
    if (stored !== today) {
      localStorage.setItem('stoxy-ai-credits', '3');
      localStorage.setItem('stoxy-ai-credits-day', today);
      setCredits(3);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('stoxy-ai-credits', String(credits));
    }
  }, [credits]);

  const [dayStats, setDayStats] = useState<DayStats | null>(null);
  const [yearStats, setYearStats] = useState<YearStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const parseExchangeSegment = (key: string) => {
    const [prefix] = key.split('|');
    const [exchange, segment] = (prefix ?? '').split('_');
    return { exchange: exchange ?? '', segment: segment ?? '' };
  };

  const handleAnalyze = async () => {
    if (!index) return;
    if (credits <= 0) {
      setAnalysisDismissed(false);
      setAnalysisOpen(true);
      setAnalysisError({
        kind: 'rate_limit',
        retryAfterSeconds: null,
        raw: "You've used all your free AI analyses for today.",
      });
      return;
    }
    const { exchange, segment } = parseExchangeSegment(index.instrumentKey);
    setAnalysisDismissed(false);
    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisText(null);
    setAnalysisGeneratedAt(null);
    try {
      const r = await analysisApi.index({
        indexName: index.indexName,
        indexSymbol: index.indexSymbol,
        exchange,
        segment,
        instrumentKey: index.instrumentKey,
      });
      setAnalysisText(typeof r.data === 'string' ? r.data : '');
      setAnalysisGeneratedAt(new Date());
      setCredits((c) => Math.max(0, c - 1));
    } catch (err) {
      setAnalysisError(classifyAnalysisError(err));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const dismissAnalysis = () => {
    setAnalysisDismissed(true);
    setAnalysisOpen(false);
  };

  // Derive Day OHLC from intraday candles (1-minute, full day) and 52W
  // High/Low from 1Y daily history. Depends ONLY on the instrumentKey.
  useEffect(() => {
    if (!index) return;
    const instrumentKey = index.instrumentKey;
    let cancelled = false;
    setDayStats(null);
    setYearStats(null);
    setStatsLoading(true);

    const loadStats = async () => {
      try {
        const [dayRes, yearRes] = await Promise.all([
          chartsApi.intraday(instrumentKey, 'minutes', '1').catch(() => null),
          chartsApi.history(instrumentKey, '1Y', 'days', '1').catch(() => null),
        ]);

        if (cancelled) return;

        const dayCandles = (dayRes?.data ?? []) as Array<{
          date: string; open: number; high: number; low: number; close: number;
        }>;
        const yearCandles = (yearRes?.data ?? []) as Array<{
          date: string; open: number; high: number; low: number; close: number;
        }>;

        if (dayCandles.length > 0) {
          const open = dayCandles[0].open;
          const high = dayCandles.reduce((m, c) => Math.max(m, c.high), dayCandles[0].high);
          const low = dayCandles.reduce((m, c) => Math.min(m, c.low), dayCandles[0].low);
          const prevClose = dayCandles[dayCandles.length - 1].close;
          setDayStats({ open, high, low, prevClose });
        } else {
          setDayStats({ open: null, high: null, low: null, prevClose: null });
        }

        if (yearCandles.length > 0) {
          const yearHigh = yearCandles.reduce((m, c) => Math.max(m, c.high), yearCandles[0].high);
          const yearLow = yearCandles.reduce((m, c) => Math.min(m, c.low), yearCandles[0].low);
          setYearStats({ yearHigh, yearLow });
        } else {
          setYearStats({ yearHigh: null, yearLow: null });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    loadStats();
    return () => { cancelled = true; };
  }, [index?.instrumentKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-accent" />
        <span className="text-sm font-sans">Loading index data…</span>
      </div>
    );
  }

  if (error || !index) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-negative font-sans mb-2">⚠ Error</p>
        <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error || 'Index not found.'}</p>
        <Link to="/" className="text-[12px] text-primary border-b border-primary pb-px">← Back to Dashboard</Link>
      </div>
    );
  }

  const m = index.indexMetadataDTO;
  const adv = index.indexAdvanceDTO;
  const ltp = index.liveLtp;
  const change = index.liveChange;
  const pChange = index.livePChange;
  const isUp = (change ?? 0) >= 0;
  const { exchange } = parseExchangeSegment(index.instrumentKey);

  const positiveColor = isDark ? '#5ab870' : '#2e7d32';
  const negativeColor = isDark ? '#e06060' : '#c62828';
  const lineColor = isUp ? positiveColor : negativeColor;

  const dayRangePct = (() => {
    if (!dayStats || ltp == null || dayStats.high == null || dayStats.low == null) return null;
    const range = dayStats.high - dayStats.low;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((ltp - dayStats.low) / range) * 100));
  })();

  const yearHighPct = (() => {
    if (!yearStats || ltp == null || yearStats.yearHigh == null || yearStats.yearLow == null) return null;
    const range = yearStats.yearHigh - yearStats.yearLow;
    if (range <= 0) return null;
    return ((yearStats.yearHigh - ltp) / range) * 100;
  })();

  const prevClose = dayStats?.prevClose ?? index.liveCp ?? null;

  const showAnalysisPanel =
    !analysisDismissed && (analysisOpen || analysisLoading || !!analysisError || !!analysisText);

  // 12-col bento. Each row is its own grid; widths are expressed as col-spans.
  return (
    <div className="pb-12 space-y-4">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">/</span>
          <span className="text-[10px] font-mono text-muted tracking-wider uppercase truncate">
            {index.indexName}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refreshIndex}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary transition-colors rounded-none"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analysisLoading}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary disabled:opacity-50 transition-colors rounded-none"
          >
            {analysisLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Analyze
          </button>
          <Tooltip content={AI_CREDITS_TIP} side="bottom" align="right">
            <button
              aria-label="AI credits info"
              className="flex items-center gap-1.5 px-2.5 py-2 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary transition-colors rounded-none"
            >
              <CreditCard className="h-3.5 w-3.5 text-muted" />
              <span className="text-primary font-medium tabular-nums">{credits}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Hero Band ── */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono text-muted tracking-widest uppercase">
              {index.instrumentKey}
            </span>
            {exchange && (
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                exchange === 'BSE' ? 'text-amber-500' : 'text-accent'
              }`}>
                {exchange}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-heading font-light tracking-tight text-primary">
            {index.indexName}
          </h1>
          {m?.numberOfConstituents != null && (
            <p className="text-[12px] font-mono text-muted mt-1.5">
              {m.numberOfConstituents} constituents
              {m.methodology ? ` · ${m.methodology}` : ''}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {ltp != null ? (
            <>
              <div className="text-3xl font-mono font-semibold tracking-tight text-primary leading-none">
                {fmt(ltp)}
              </div>
              <div className={`flex items-center justify-end gap-1.5 text-[13px] font-medium mt-2 ${getChangeColor(change)}`}>
                {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{isUp ? '+' : ''}{fmt(change)}</span>
                <span className="text-muted">({isUp ? '+' : ''}{pChange?.toFixed(2)}%)</span>
              </div>
            </>
          ) : (
            <div className="text-muted text-[13px] font-sans">
              Live price unavailable
              <p className="text-[11px] mt-1 opacity-60">Market may be closed</p>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Analysis Panel (above chart, mounted only when activated) ── */}
      {showAnalysisPanel && (
        <AnalysisDialog
          open={analysisOpen}
          onOpenChange={setAnalysisOpen}
          onDismiss={dismissAnalysis}
          title={`AI Analysis — ${index.indexName}`}
          loading={analysisLoading}
          error={analysisError}
          content={analysisText}
          generatedAt={analysisGeneratedAt}
          onRetry={handleAnalyze}
        />
      )}

      {/* ════════ BENTO ROW 1: Chart 75% + Index Info 25% ════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-surface border border-border-light p-5 rounded-none h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted" />
                <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                  Price Chart
                </h3>
              </div>
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                {exchange === 'BSE' ? 'BSE' : 'NSE'} · 1m – 10Y
              </span>
            </div>
            <StockChart instrumentKey={index.instrumentKey} />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-3">
          {m && (
            <div className="bg-surface border border-border-light p-4 rounded-none">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
                Index Info
              </h3>
              <div className="space-y-2 text-[12px]">
                <InfoRow label="Symbol" value={index.indexSymbol} />
                <InfoRow
                  label="Constituents"
                  value={m.numberOfConstituents ? String(m.numberOfConstituents) : null}
                />
                <InfoRow label="Methodology" value={m.methodology} />
                <InfoRow label="Base Date" value={m.baseDate} />
                <InfoRow label="Launch Date" value={m.launchDate} />
                <InfoRow
                  label="Status"
                  value={m.isActive ? 'ACTIVE' : 'INACTIVE'}
                  tone={m.isActive ? 'positive' : 'negative'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════ BENTO BLOCK: Day's Range + OHLC (left ~65%) | Market Breadth (right ~33%) ════════ */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT column — Day's Range on top, OHLC below (~65% wide) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-surface border border-border-light p-5 rounded-none">
            {dayStats && dayStats.high != null && dayStats.low != null ? (
              <DayRangeBar dayStats={dayStats} ltp={ltp} lineColor={lineColor} dayRangePct={dayRangePct} change={change} />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-3 w-3 text-muted" />
                  <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                    Day's Range
                  </h3>
                </div>
                <div className="text-[12px] text-muted py-4">
                  {statsLoading ? 'Loading range data…' : 'Range data unavailable for this index yet.'}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 border border-border-light bg-surface rounded-none">
            <StatTile
              icon={<BarChart3 className="h-3 w-3 text-muted" />}
              label="Open"
              value={dayStats?.open != null ? fmt(dayStats.open) : null}
              sub="Today"
              loading={statsLoading && dayStats === null}
            />
            <StatTile
              icon={<BarChart3 className="h-3 w-3 text-muted" />}
              label="Prev Close"
              value={prevClose != null ? fmt(prevClose) : null}
              sub="Reference"
              loading={statsLoading && dayStats === null && index.liveCp == null}
            />
            <StatTile
              icon={<Activity className="h-3 w-3 text-positive" />}
              label="Day's High"
              value={dayStats?.high != null ? fmt(dayStats.high) : null}
              sub="Intraday"
              loading={statsLoading && dayStats === null}
            />
            <StatTile
              icon={<Activity className="h-3 w-3 text-negative" />}
              label="Day's Low"
              value={dayStats?.low != null ? fmt(dayStats.low) : null}
              sub="Intraday"
              loading={statsLoading && dayStats === null}
            />
            <StatTile
              icon={<TrendingUp className="h-3 w-3 text-positive" />}
              label="52W High"
              value={yearStats?.yearHigh != null ? fmt(yearStats.yearHigh) : null}
              sub={yearHighPct != null ? `${yearHighPct.toFixed(2)}% from high` : undefined}
              loading={statsLoading && yearStats === null}
            />
            <StatTile
              icon={<TrendingDown className="h-3 w-3 text-negative" />}
              label="52W Low"
              value={yearStats?.yearLow != null ? fmt(yearStats.yearLow) : null}
              sub={yearHighPct != null ? `${(100 - yearHighPct).toFixed(2)}% from low` : undefined}
              loading={statsLoading && yearStats === null}
            />
          </div>
        </div>

        {/* RIGHT column — Market Breadth (~33% wide, spans full height of left col) */}
        <div className="col-span-12 lg:col-span-4">
          {adv && adv.advances + adv.declines + adv.unChanged > 0 ? (
            <MarketBreadthCard adv={adv} />
          ) : (
            <ComingSoon
              variant="bare-with-card"
              icon={<Layers className="h-3 w-3" />}
              title="Market Breadth"
              message="Real-time advance / decline tracking across the full constituent list is coming soon."
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* ════════ BENTO ROW 4: Top Constituents 75% (Coming Soon, NO border around text, div has card bg) + About 25% ════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9">
          <ComingSoon
            variant="bare-with-card"
            icon={<Building2 className="h-3 w-3" />}
            title="Top Constituents"
            message="Live constituent breakdown, weights, and sectoral mix are on the way."
            className="h-full min-h-[180px]"
          />
        </div>
        <div className="col-span-12 lg:col-span-3">
          {m?.description && (
            <div className="bg-surface border border-border-light p-5 rounded-none h-full">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-3.5 w-3.5 text-muted" />
                <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
                  About this Index
                </h3>
              </div>
              <p className="text-[12px] text-muted font-sans leading-relaxed">
                {m.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Local helpers ── */

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  sub?: string;
  loading?: boolean;
}

function StatTile({ icon, label, value, sub, loading }: StatTileProps) {
  return (
    <div className="p-4 border-r border-b border-border-light last:border-r-0 [&:nth-child(3n)]:border-r-0 [&:nth-child(n+4)]:border-b-0">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-4 w-16 skeleton animate-shimmer" />
      ) : value != null ? (
        <>
          <div className="text-[15px] font-mono font-semibold text-primary leading-tight">
            {value}
          </div>
          {sub && (
            <div className="text-[10px] font-mono text-muted mt-1">{sub}</div>
          )}
        </>
      ) : (
        <div className="text-[13px] font-mono text-muted">—</div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null;
  tone?: 'positive' | 'negative' | 'neutral';
}

function InfoRow({ label, value, tone = 'neutral' }: InfoRowProps) {
  if (value == null || String(value) === '') return null;
  const valueClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-primary';
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-muted flex-shrink-0">{label}</span>
      <span className={`font-medium text-right ${valueClass}`}>{value}</span>
    </div>
  );
}

/* ── Day's Range — sleek, minimal, modern.
 *
 * Three values (Low / LTP / High) in a single row, plus a hair-thin
 * track underneath showing where the index opened and where the LTP
 * currently sits. The "% from low" sits as the headline number on
 * the right. ── */
function DayRangeBar({
  dayStats,
  ltp,
  lineColor,
  dayRangePct,
  change,
}: {
  dayStats: DayStats;
  ltp: number | null;
  lineColor: string;
  dayRangePct: number | null;
  change: number | null;
}) {
  // Where did this index open? We compute its position on the day's
  // range track (0–100) so the opening dot can be drawn on the same bar
  // as the LTP marker.
  const openPct = (() => {
    if (dayStats.open == null || dayStats.high == null || dayStats.low == null) return null;
    const range = dayStats.high - dayStats.low;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((dayStats.open - dayStats.low) / range) * 100));
  })();

  // LTP-vs-open: positive means price moved up since the open.
  const openDelta = ltp != null && dayStats.open != null ? ltp - dayStats.open : null;

  return (
    <div className="flex items-start gap-6">
      {/* Left: small heading + Low/LTP/High row */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3 w-3 text-muted" />
          <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
            Day&apos;s Range
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest">
              Low
            </div>
            <div className="text-[14px] font-mono font-medium text-negative mt-0.5">
              {dayStats.low != null ? fmt(dayStats.low) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest">
              LTP
            </div>
            <div className="text-[14px] font-mono font-medium mt-0.5" style={{ color: lineColor }}>
              {ltp != null ? fmt(ltp) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest">
              High
            </div>
            <div className="text-[14px] font-mono font-medium text-positive mt-0.5">
              {dayStats.high != null ? fmt(dayStats.high) : '—'}
            </div>
          </div>
        </div>

        {/* Range track: visible baseline + Low/Open/High tick labels on the
             underside, LTP diamond on the line. The Open is a labelled tick
             with a small "O" caption — readable at a glance, not hidden
             behind a hover. */}
        <div className="relative mt-4 pt-4 pb-7">
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-border" />

          {/* Low tick (left edge) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-negative"
            style={{ left: '0%' }}
          />
          <div
            className="absolute bottom-0 left-0 -translate-x-1/4 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            L
          </div>

          {/* Open tick — vertical mark on the track plus a small "O"
              caption above it so it reads as a labelled point of interest */}
          {openPct != null && (
            <>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-primary/60"
                style={{ left: `${openPct}%` }}
              />
              <div
                className="absolute -top-1 -translate-x-1/2 px-1 py-px text-[9px] font-mono font-semibold text-primary bg-surface border border-border-light rounded-none leading-none tabular-nums"
                style={{ left: `${openPct}%` }}
              >
                {fmt(dayStats.open!)}
              </div>
            </>
          )}

          {/* High tick (right edge) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-positive"
            style={{ right: '0%' }}
          />
          <div
            className="absolute bottom-0 right-0 translate-x-1/4 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            H
          </div>

          {/* LTP diamond marker on the track (primary point of interest) */}
          {dayRangePct != null && (
            <span
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border border-surface"
              style={{
                left: `${dayRangePct}%`,
                backgroundColor: lineColor,
                boxShadow: `0 0 0 3px ${lineColor}22`,
              }}
              title={`LTP ${ltp != null ? fmt(ltp) : ''}`}
            />
          )}
        </div>
      </div>

      {/* Right: big "% from low" headline + small open/close delta */}
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] font-mono text-muted uppercase tracking-widest">
          From Low
        </div>
        <div
          className={`text-[26px] font-mono font-light leading-none mt-1 ${
            dayRangePct != null ? getChangeColor(change) : 'text-muted'
          }`}
        >
          {dayRangePct != null ? `${dayRangePct.toFixed(1)}%` : '—'}
        </div>
        {openDelta != null && dayStats.open != null && (
          <div
            className={`text-[10px] font-mono mt-2 ${
              openDelta >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {openDelta >= 0 ? '+' : ''}{fmt(openDelta)}{' '}
            <span className="text-muted">vs open</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Market Breadth — advances / declines / unchanged.
 *
 * When the backend has IndexAdvanceDTO populated, show a stacked
 * progress bar with the live counts. When it's null, fall back to
 * the bare "Coming Soon" message so the slot never looks broken. */
function MarketBreadthCard({
  adv,
}: {
  adv: { advances: number; declines: number; unChanged: number };
}) {
  const total = adv.advances + adv.declines + adv.unChanged;
  return (
    <div className="bg-surface border border-border-light p-5 rounded-none h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-3 w-3 text-muted" />
          <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
            Market Breadth
          </h3>
        </div>
        <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
          {total} constituents
        </span>
      </div>
      <div className="flex h-2 border border-border-light overflow-hidden rounded-none">
        {adv.advances > 0 && (
          <div
            className="bg-positive"
            style={{ width: `${(adv.advances / total) * 100}%` }}
            title={`${adv.advances} advances`}
          />
        )}
        {adv.unChanged > 0 && (
          <div
            className="bg-muted"
            style={{ width: `${(adv.unChanged / total) * 100}%` }}
            title={`${adv.unChanged} unchanged`}
          />
        )}
        {adv.declines > 0 && (
          <div
            className="bg-negative"
            style={{ width: `${(adv.declines / total) * 100}%` }}
            title={`${adv.declines} declines`}
          />
        )}
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
        <span className="text-positive font-medium">{adv.advances} ↑</span>
        <span className="text-muted">{adv.unChanged} —</span>
        <span className="text-negative font-medium">{adv.declines} ↓</span>
      </div>
    </div>
  );
}