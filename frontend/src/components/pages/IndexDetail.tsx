import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
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
import { useCandleStats, type DayStats } from '../../hooks/useCandleStats';
import { useTheme } from '../../context/ThemeContext';
import { analysisApi, classifyAnalysisError, type AnalysisError } from '../../lib/api';
import { fmt, fmtCr, getChangeColor } from '../../lib/utils';
import { StockChart } from '../ui/StockChart';
import { AnalysisDialog } from '../ui/AnalysisDialog';
import { ComingSoon, Tooltip } from '../ui/ComingSoon';
import { YearRangeCard } from '../ui/YearRangeCard';
import type { IndexPriceInfo } from '../../types/market';

const AI_CREDITS_TIP = (
  <>
    <p className="font-medium mb-1">3 free AI credits / day</p>
    <p className="opacity-90">
      We&apos;re expanding our AI services, so each user gets a limited number of
      free analyses per day.
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

  const { dayStats, yearStats, statsLoading } = useCandleStats(index?.instrumentKey ?? null);

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
  const prevClose = (() => {
    const cpSane = index.liveCp != null && ltp != null && Math.abs(index.liveCp - ltp) >= 0.005;
    return cpSane ? index.liveCp : (dayStats?.prevClose ?? index.liveCp ?? null);
  })();
  const change = ltp != null && prevClose != null ? ltp - prevClose : null;
  const pChange = change != null && prevClose != null && prevClose > 0 ? (change / prevClose) * 100 : null;
  const isUp = (change ?? 0) >= 0;
  const { exchange } = parseExchangeSegment(index.instrumentKey);

  const positiveColor = isDark ? '#5ab870' : '#2e7d32';
  const negativeColor = isDark ? '#e06060' : '#c62828';
  const lineColor = isUp ? positiveColor : negativeColor;

  const yearHighPct = (() => {
    if (!yearStats || ltp == null || yearStats.yearHigh == null || yearStats.yearLow == null) return null;
    const range = yearStats.yearHigh - yearStats.yearLow;
    if (range <= 0) return null;
    return ((yearStats.yearHigh - ltp) / range) * 100;
  })();

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
                exchange === 'BSE' ? 'text-amber-500 dark:text-amber-400' : 'text-accent'
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
                <span>{isUp ? '+' : ''}{fmt(change ?? 0)}</span>
                <span className="text-muted">({isUp ? '+' : ''}{(pChange ?? 0).toFixed(2)}%)</span>
                <span className="text-[13px] font-mono font-semibold text-primary ml-1">1D</span>
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
            <div className="bg-surface border border-border-light p-4 rounded-none h-full flex flex-col">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
                Index Info
              </h3>
              <div className="space-y-2 text-[12px] pb-4">
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
                <InfoRow
                  label="Free Float MCap"
                  value={index.indexPriceInfoDTO?.ffmc != null ? fmtCr(index.indexPriceInfoDTO.ffmc) : null}
                />
                <InfoRow
                  label="Volume (Today)"
                  value={index.indexPriceInfoDTO?.totalTradedVolume != null ? fmtQty(index.indexPriceInfoDTO.totalTradedVolume) : null}
                />
                <InfoRow
                  label="Traded Value"
                  value={index.indexPriceInfoDTO?.totalTradedValue != null ? fmtCr(index.indexPriceInfoDTO.totalTradedValue) : null}
                />
              </div>

              {/* Today snapshot — pinned to the bottom so the card never looks
                  half-empty next to the tall chart */}
              <div className="mt-auto border-t border-border-light pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Open</div>
                    <div className="text-[18px] font-mono font-semibold text-primary mt-1 tabular-nums">
                      {dayStats?.open != null ? fmt(dayStats.open) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Prev Close</div>
                    <div className="text-[18px] font-mono font-semibold text-primary mt-1 tabular-nums">
                      {prevClose != null ? fmt(prevClose) : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 mt-5">
                  <div>
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Day Low</div>
                    <div className="text-[18px] font-mono font-semibold text-negative mt-1 tabular-nums">
                      {dayStats?.low != null ? fmt(dayStats.low) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Day High</div>
                    <div className="text-[18px] font-mono font-semibold text-positive mt-1 tabular-nums">
                      {dayStats?.high != null ? fmt(dayStats.high) : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 mt-5">
                  <div>
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Lower Circuit</div>
                    <div className="text-[18px] font-mono font-semibold text-negative mt-1 tabular-nums">—</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Upper Circuit</div>
                    <div className="text-[18px] font-mono font-semibold text-positive mt-1 tabular-nums">—</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════ BENTO BLOCK: Day's Range + OHLC (left ~65%) | Market Breadth (right ~33%) ════════ */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT column — Day's Range on top, OHLC below (~65% wide) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-surface border border-border-light p-5 rounded-none flex-1">
            {dayStats && dayStats.high != null && dayStats.low != null ? (
              <DayRangeBar dayStats={dayStats} ltp={ltp} lineColor={lineColor} change={change} />
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

          <YearRangeCard yearStats={yearStats} ltp={ltp} yearHighPct={yearHighPct} lineColor={lineColor} />
        </div>

        {/* RIGHT column — Market Breadth on top, Volume & Value below */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
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

          <IndexVolumeCard priceInfo={index.indexPriceInfoDTO} />
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
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
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

          <div className="bg-surface border border-border-light p-5 rounded-none h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-3 w-3 text-muted" />
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                Disclaimer
              </h3>
            </div>
            <p className="text-[12px] font-sans text-primary font-medium leading-relaxed">
              Index levels and constituent data stream from the exchange feed
              and are indicative. Fundamentals and sector benchmarks are
              reference values — do your own research before investing.
            </p>
            <div className="mt-auto pt-3 text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
              NOT AN INVESTMENT ADVICE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Local helpers ── */

const fmtQty = (n: number | undefined | null) =>
  n != null ? n.toLocaleString('en-IN') : '—';

/* ── Volume & Value — totalTradedVolume / totalTradedValue / ffmc from the
 * IndexPriceInfo DTO (these exist for indices too). ── */
function IndexVolumeCard({ priceInfo }: { priceInfo: IndexPriceInfo | null }) {
  const items: Array<{ label: string; value: string }> = [];
  if (priceInfo?.totalTradedVolume != null)
    items.push({ label: 'Volume (Today)', value: fmtQty(priceInfo.totalTradedVolume) });
  if (priceInfo?.totalTradedValue != null)
    items.push({ label: 'Traded Value', value: fmtCr(priceInfo.totalTradedValue) });
  if (priceInfo?.ffmc != null)
    items.push({ label: 'Free Float MCap', value: fmtCr(priceInfo.ffmc) });

  return (
    <div className="bg-surface border border-border-light p-4 rounded-none">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-3.5 w-3.5 text-muted" />
        <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
          Volume &amp; Value
        </h3>
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] text-muted py-2">
          Volume data unavailable for this index yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <div key={item.label} className="flex justify-between items-center gap-2">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                {item.label}
              </span>
              <span className="text-[13px] font-mono font-medium text-primary tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
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
 * currently sits. The LTP sits in the middle with a direction arrow
 * against the previous close. ── */
function DayRangeBar({
  dayStats,
  ltp,
  lineColor,
  change,
}: {
  dayStats: DayStats;
  ltp: number | null;
  lineColor: string;
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

  const isUp = change != null && change >= 0;

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
        {/* Values: Low pinned to the left end, High to the right end; only the
             LTP sits in the middle with a direction arrow vs the previous close. */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest font-bold">
              Low
            </div>
            <div className="text-[14px] font-mono font-medium text-negative mt-0.5">
              {dayStats.low != null ? fmt(dayStats.low) : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest font-bold">
              LTP
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              {isUp
                ? <ArrowUp className="h-3.5 w-3.5 text-positive" />
                : <ArrowDown className="h-3.5 w-3.5 text-negative" />}
              <span className="text-[15px] font-mono font-semibold text-primary tabular-nums">
                {ltp != null ? fmt(ltp) : '—'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-mono text-muted uppercase tracking-widest font-bold">
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
                <span className="text-muted font-medium">O&nbsp;</span>{fmt(dayStats.open!)}
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
          {/* Open diamond marker on the track (marks where the index opened) */}
          {openPct != null && (
            <span
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border border-surface"
              style={{
                left: `${openPct}%`,
                backgroundColor: lineColor,
                boxShadow: `0 0 0 3px ${lineColor}22`,
              }}
              title={`Open ${dayStats.open != null ? fmt(dayStats.open) : ''}`}
            />
          )}
        </div>
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