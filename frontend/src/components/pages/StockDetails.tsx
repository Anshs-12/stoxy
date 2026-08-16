import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
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
  Building2,
  CreditCard,
  ShoppingCart,
  ListPlus,
  X,
  Layers,
  Gauge,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useStockDetails } from '../../hooks/useStockDetails';
import { useFullFeed } from '../../hooks/useFullFeed';
import { useCandleStats, type DayStats } from '../../hooks/useCandleStats';
import { useTheme } from '../../context/ThemeContext';
import { analysisApi, classifyAnalysisError, type AnalysisError } from '../../lib/api';
import { fmt, fmtCr, getChangeColor, isMarketOpen } from '../../lib/utils';
import { StockChart } from '../ui/StockChart';
import { AnalysisDialog } from '../ui/AnalysisDialog';
import { ComingSoon, Tooltip } from '../ui/ComingSoon';
import { YearRangeCard } from '../ui/YearRangeCard';
import type { FullFeedData, QuoteLevel } from '../../types';

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

const fmtQty = (n: number | undefined | null) =>
  n != null ? n.toLocaleString('en-IN') : '—';

export const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const location = useLocation();
  const {
    stock,
    loading,
    error,
    ltp,
    ltt,
    cp,
    exchange: activeExchange,
    switchExchange,
    switchError,
    clearSwitchError,
    watchlists,
    wlLoading,
    addToWatchlist,
    buyStock,
    sellStock,
    refreshStock,
  } = useStockDetails(symbol, location.state);

  const { isDark } = useTheme();
  const marketOpen = isMarketOpen();

  const [exchangeOpen, setExchangeOpen] = useState(false);

  const instrumentKey = stock?.instrumentKey ?? null;
  const feed = useFullFeed(instrumentKey);

  // AI analysis state — collapsed by default; the user expands to read.
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<Date | null>(null);
  const [analysisDismissed, setAnalysisDismissed] = useState(false);
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

  // Trade panel + watchlist dropdown state
  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [buyQtyStr, setBuyQtyStr] = useState('1');
  const [sellQtyStr, setSellQtyStr] = useState('1');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [wlOpen, setWlOpen] = useState(false);

  // Reset per-stock transient state when navigating between stocks
  useEffect(() => {
    setAnalysisOpen(false);
    setAnalysisLoading(false);
    setAnalysisError(null);
    setAnalysisText(null);
    setAnalysisGeneratedAt(null);
    setAnalysisDismissed(false);
    setBuyOpen(false);
    setSellOpen(false);
    setWlOpen(false);
    setExchangeOpen(false);
  }, [symbol]);

  // Auto-dismiss the "stock does not exist on this exchange" notice
  useEffect(() => {
    if (!switchError) return;
    const t = setTimeout(clearSwitchError, 2000);
    return () => clearTimeout(t);
  }, [switchError, clearSwitchError]);

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

  const parseExchangeSegment = (key: string) => {
    const [prefix] = key.split('|');
    const [exchange, segment] = (prefix ?? '').split('_');
    return { exchange: exchange ?? '', segment: segment ?? '' };
  };

  const handleAnalyze = async () => {
    if (!stock) return;
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
    const { exchange } = parseExchangeSegment(stock.instrumentKey);
    setAnalysisDismissed(false);
    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisText(null);
    setAnalysisGeneratedAt(null);
    try {
      const r = await analysisApi.stock({
        stockName: stock.stockName,
        stockSymbol: stock.stockSymbol,
        companyName: stock.companyResponseDTO?.companyName ?? '',
        exchange,
        instrumentKey: stock.instrumentKey,
        isin: stock.isin,
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

  const { dayStats, yearStats, statsLoading } = useCandleStats(stock?.instrumentKey ?? null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-accent" />
        <span className="text-sm font-sans">Loading {symbol}…</span>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-negative font-sans mb-2">⚠ Error</p>
        <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error || 'Stock not found.'}</p>
        <Link to="/" className="text-[12px] text-primary border-b border-primary pb-px">← Back to Dashboard</Link>
      </div>
    );
  }

  const f = stock.stockFinancialsDTO;
  const c = stock.companyResponseDTO;

  const prevClose = (() => {
    const cpSane = cp != null && ltp != null && Math.abs(cp - ltp) >= 0.005;
    return cpSane ? cp : (dayStats?.prevClose ?? cp ?? null);
  })();
  const change = ltp != null && prevClose != null ? ltp - prevClose : null;
  const pChange = change != null && prevClose != null && prevClose > 0 ? (change / prevClose) * 100 : null;
  const isUp = (change ?? 0) >= 0;

  const lttDate = ltt ? new Date(ltt) : null;
  const lttDisplay = lttDate
    ? lttDate.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).replace(',', '')
    : null;

  const positiveColor = isDark ? '#5ab870' : '#2e7d32';
  const negativeColor = isDark ? '#e06060' : '#c62828';
  const lineColor = isUp ? positiveColor : negativeColor;

  const yearHighPct = (() => {
    if (!yearStats || ltp == null || yearStats.yearHigh == null || yearStats.yearLow == null) return null;
    const range = yearStats.yearHigh - yearStats.yearLow;
    if (range <= 0) return null;
    return ((yearStats.yearHigh - ltp) / range) * 100;
  })();

  const { exchange, segment } = parseExchangeSegment(stock.instrumentKey);
  const showAnalysisPanel =
    !analysisDismissed && (analysisOpen || analysisLoading || !!analysisError || !!analysisText);

  const handleBuy = async () => {
    setBuyLoading(true);
    const qty = parseInt(buyQtyStr, 10);
    if (!qty || qty <= 0) { setBuyLoading(false); return; }
    const success = await buyStock(qty, ltp ?? 0);
    if (success) setBuyOpen(false);
    setBuyLoading(false);
  };

  const handleSell = async () => {
    setSellLoading(true);
    const qty = parseInt(sellQtyStr, 10);
    if (!qty || qty <= 0) { setSellLoading(false); return; }
    const success = await sellStock(qty, ltp ?? 0);
    if (success) setSellOpen(false);
    setSellLoading(false);
  };

  const tradeQty = buyOpen ? parseInt(buyQtyStr, 10) || 1 : parseInt(sellQtyStr, 10) || 1;

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
            {stock.stockSymbol}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={refreshStock}
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
              {stock.instrumentKey}
            </span>
            <div className="relative">
              <button
                onClick={() => setExchangeOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider transition-opacity ${
                  activeExchange === 'BSE' ? 'text-amber-500' : 'text-accent'
                } hover:opacity-75`}
              >
                {activeExchange}
                <ChevronDown className={`h-3 w-3 transition-transform ${exchangeOpen ? 'rotate-180' : ''}`} />
              </button>
              {exchangeOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setExchangeOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 z-30 bg-surface border border-border-light shadow-ambient overflow-hidden min-w-[112px]">
                  {(['NSE', 'BSE'] as const).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        setExchangeOpen(false);
                        if (ex !== activeExchange) switchExchange(ex);
                      }}
                      className={`w-full flex items-center justify-between gap-6 px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors ${
                        ex === activeExchange ? 'text-accent bg-neutral' : 'text-primary hover:bg-neutral'
                      }`}
                    >
                      {ex}
                      {ex === activeExchange && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                  </div>
                </>
              )}
            </div>
            {segment && (
              <span className="text-[9px] font-mono text-muted uppercase tracking-wider">· {segment}</span>
            )}
          </div>
          <h1 className="text-4xl font-heading font-light tracking-tight text-primary">
            {stock.stockName}
          </h1>
          <p className="text-[12px] font-mono text-muted mt-1.5">
            {c?.sector ?? '—'}
            {stock.isin ? ` · ISIN ${stock.isin}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          {ltp != null ? (
            <>
              {lttDisplay && (
                <div className="text-[11px] font-mono text-muted mb-1.5 tabular-nums">
                  Last traded at {lttDisplay}
                </div>
              )}
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
          title={`AI Analysis — ${stock.stockName}`}
          loading={analysisLoading}
          error={analysisError}
          content={analysisText}
          generatedAt={analysisGeneratedAt}
          onRetry={handleAnalyze}
        />
      )}

      {/* ════════ BENTO ROW 1: Chart ~72% | Trade ~28% ════════ */}
      <div className="grid grid-cols-12 lg:grid-cols-[8.6fr_3.4fr] gap-4">
        <div className="col-span-12 lg:col-auto">
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
            <StockChart instrumentKey={stock.instrumentKey} />
          </div>
        </div>
        <div className="col-span-12 lg:col-auto flex flex-col gap-4">
          {/* Trade box — panel overlays, never pushes the page */}
          <div className="bg-surface border border-border-light p-4 rounded-none relative">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="h-3.5 w-3.5 text-muted" />
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                Trade
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setBuyOpen(v => !v); setSellOpen(false); setWlOpen(false); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-white text-[10px] font-mono font-semibold hover:bg-accent/90 transition-colors rounded-none"
              >
                <ShoppingCart className="h-3 w-3" /> Buy
              </button>
              <button
                onClick={() => { setSellOpen(v => !v); setBuyOpen(false); setWlOpen(false); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-surface text-primary text-[10px] font-mono font-medium hover:bg-neutral transition-colors border border-border-light rounded-none"
              >
                Sell
              </button>
            </div>
            <div className="relative mt-2">
              <button
                onClick={() => { setWlOpen(v => !v); setBuyOpen(false); setSellOpen(false); }}
                disabled={wlLoading}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral text-[10px] font-mono text-primary hover:bg-neutral/80 disabled:opacity-50 transition-colors border border-border-light rounded-none"
              >
                {wlLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3 w-3" />}
                Watchlist
              </button>
              {wlOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-surface border border-border-light z-30 text-left overflow-hidden shadow-lg">
                  {watchlists.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] font-mono text-muted">
                      No watchlists. Create one in the Watchlist tab.
                    </div>
                  ) : (
                    watchlists.map(wl => (
                      <button key={wl.watchlistId}
                        onClick={() => { addToWatchlist(wl.watchlistId, wl.watchlistName); setWlOpen(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral text-[11px] font-mono text-primary transition-colors truncate"
                      >
                        {wl.watchlistName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Trade panel — absolute overlay so it floats above the UI */}
            {(buyOpen || sellOpen) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light p-4 text-left z-30 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary">
                    {buyOpen ? 'Buy' : 'Sell'} {stock.stockSymbol}
                  </span>
                  <button onClick={() => { setBuyOpen(false); setSellOpen(false); }} className="text-muted hover:text-primary p-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">Quantity</label>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={buyOpen ? buyQtyStr : sellQtyStr}
                      onChange={e => {
                        if (/^\d*$/.test(e.target.value)) {
                          buyOpen ? setBuyQtyStr(e.target.value) : setSellQtyStr(e.target.value);
                        }
                      }}
                      onBlur={() => {
                        buyOpen
                          ? setBuyQtyStr(String(Math.max(1, parseInt(buyQtyStr, 10) || 1)))
                          : setSellQtyStr(String(Math.max(1, parseInt(sellQtyStr, 10) || 1)));
                      }}
                      className="w-full bg-neutral text-[20px] font-heading font-light px-3 py-2.5 outline-none text-primary"
                    />
                  </div>
                  <div className="bg-neutral p-3 space-y-2 text-[12px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">LTP</span>
                      <span className="font-medium text-primary">{ltp != null ? fmt(ltp) : '—'}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border-light pt-2 text-primary">
                      <span>Estimated Total</span>
                      <span>{ltp ? `₹${fmt(tradeQty * ltp)}` : '—'}</span>
                    </div>
                  </div>
                  <button
                    onClick={buyOpen ? handleBuy : handleSell}
                    disabled={buyOpen ? buyLoading : sellLoading}
                    className={`w-full py-2.5 text-white text-[11px] font-mono font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      buyOpen ? 'bg-accent hover:bg-accent/90' : 'bg-negative hover:bg-negative/90'
                    }`}
                  >
                    {(buyLoading || sellLoading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm {buyOpen ? 'Buy' : 'Sell'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stock Info — with a Today snapshot pinned to the bottom so the
              card never looks half-empty next to the tall chart */}
          <div className="bg-surface border border-border-light p-5 rounded-none h-full flex flex-col">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
              Stock Info
            </h3>
            <div className="space-y-2 text-[12px] pb-4">
              <InfoRow label="Company" value={c?.companyName ?? null} />
              <InfoRow label="Symbol" value={stock.stockSymbol} />
              <InfoRow label="Exchange" value={stock.exchange} />
              <InfoRow label="ISIN" value={stock.isin} />
              <InfoRow label="Sector" value={c?.sector ?? null} />
              <InfoRow label="Sector MCap" value={c?.sectorMarketCap ?? null} />
            </div>

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
                  <div className="text-[18px] font-mono font-semibold text-negative mt-1 tabular-nums">
                    {feed?.lower_circuit != null ? fmt(feed.lower_circuit) : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-muted uppercase tracking-widest">Upper Circuit</div>
                  <div className="text-[18px] font-mono font-semibold text-positive mt-1 tabular-nums">
                    {feed?.upper_circuit != null ? fmt(feed.upper_circuit) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ BENTO ROW 2: Day's Range + 52W Range (left ~67%) | Market Quote (right ~33%) ════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-surface border border-border-light p-5 rounded-none flex-1">
            {dayStats && dayStats.high != null && dayStats.low != null ? (
              <DayRangeBar dayStats={dayStats} ltp={ltp} lineColor={lineColor} change={change} />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-3 w-3 text-muted" />
                  <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                    Day&apos;s Range
                  </h3>
                </div>
                <div className="text-[12px] text-muted py-4">
                  {statsLoading ? 'Loading range data…' : 'Range data unavailable for this stock yet.'}
                </div>
              </>
            )}
          </div>

          <YearRangeCard yearStats={yearStats} ltp={ltp} yearHighPct={yearHighPct} lineColor={lineColor} />
        </div>

        {/* RIGHT column — live order book depth */}
        <div className="col-span-12 lg:col-span-4">
          <MarketDepthCard feed={feed} marketOpen={marketOpen} />
        </div>
      </div>

      {/* ════════ BENTO ROW 3: Fundamentals vs Sector 75% | Volume & Averages 25% ════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          {f ? (
            <div className="bg-surface border border-border-light p-5 rounded-none h-full">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-3.5 w-3.5 text-muted" />
                <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                  Fundamentals vs Sector
                </h3>
              </div>
              <p className="text-[11px] font-sans text-muted mb-4">
                Relative comparison with sector
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                <VsSectorMetric label="P/E" value={f.pe} sector={f.sectorPe} suffix="×" kind="valuation" />
                <VsSectorMetric label="P/B" value={f.pb} sector={f.sectorPb} suffix="×" kind="valuation" />
                <VsSectorMetric label="ROA" value={f.roa} sector={f.sectorRoa} suffix="%" kind="profitability" />
                <VsSectorMetric label="ROE" value={f.roe} sector={f.sectorRoe} suffix="%" kind="profitability" />
              </div>
              <div className="mt-4 pt-3 border-t border-border-light text-[9px] font-mono text-muted">
                ↑ / ↓ indicates deviation from sector benchmark.
              </div>
            </div>
          ) : (
            <ComingSoon
              variant="bare-with-card"
              icon={<Gauge className="h-3 w-3" />}
              title="Fundamentals vs Sector"
              message="Valuation and profitability metrics for this stock are on the way."
              className="h-full min-h-[180px]"
            />
          )}
        </div>
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <VolumeCard feed={feed} marketOpen={marketOpen} />
          <ComingSoon
            variant="bare-with-card"
            icon={<BarChart3 className="h-3 w-3" />}
            title="Analyst Estimates"
            message="Consensus price targets and analyst ratings are on the way."
            className="h-full min-h-[150px]"
          />
        </div>
      </div>

      {/* ════════ BENTO ROW 4: About Company 75% + Watchlist 25% ════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9">
          {c?.description ? (
            <div className="bg-surface border border-border-light p-5 rounded-none h-full">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-3.5 w-3.5 text-muted" />
                <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
                  About {c.companyName || stock.stockName}
                </h3>
              </div>
              <p className="text-[12px] text-muted font-sans leading-relaxed">
                {c.description}
              </p>
            </div>
          ) : (
            <ComingSoon
              variant="bare-with-card"
              icon={<Building2 className="h-3 w-3" />}
              title="About the Company"
              message="A company profile is being written for this stock."
              className="h-full min-h-[180px]"
            />
          )}
        </div>
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface border border-border-light p-5 rounded-none h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-3 w-3 text-muted" />
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
                Disclaimer
              </h3>
            </div>
            <p className="text-[12px] font-sans text-primary font-medium leading-relaxed">
              Live prices stream from the exchange feed and are indicative.
              Fundamentals and sector benchmarks are reference values — do your
              own research before investing.
            </p>
            <div className="mt-auto pt-3 text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
              NOT AN INVESTMENT ADVICE
            </div>
          </div>
        </div>
      </div>

      {/* ── Transient notice: the other exchange has no instrument for this stock ── */}
      {switchError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="toast-fade bg-surface border border-border-light shadow-ambient px-5 py-2.5 text-[12px] font-mono text-primary">
            {switchError}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Local helpers ── */

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

/* ── Day's Range — same treatment as the index detail page. ── */
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
  const openPct = (() => {
    if (dayStats.open == null || dayStats.high == null || dayStats.low == null) return null;
    const range = dayStats.high - dayStats.low;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((dayStats.open - dayStats.low) / range) * 100));
  })();

  const isUp = change != null && change >= 0;

  return (
    <div className="flex h-full items-start gap-6">
      <div className="flex-1 min-w-0 flex flex-col h-full">
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

        <div className="relative mt-auto pt-4 pb-7">
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-border" />

          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-negative"
            style={{ left: '0%' }}
          />
          <div
            className="absolute bottom-0 left-0 -translate-x-1/4 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            L
          </div>

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

          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-positive"
            style={{ right: '0%' }}
          />
          <div
            className="absolute bottom-0 right-0 translate-x-1/4 text-[9px] font-mono text-muted uppercase tracking-widest"
          >
            H
          </div>

          {/* Open diamond marker on the track (marks where the day opened) */}
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

/* ── Market Quote — live 5-level order book + circuit band from fullFeed.
 *
 * The backend pushes FullFeedDataDTO over the WebSocket (and via REST
 * snapshot when the socket is closed) — marketLevel holds 5 rows of
 * bid/ask qty+price, plus tbq/tsq totals and upper/lower circuit. ──
 */
function MarketDepthCard({
  feed,
  marketOpen,
}: {
  feed: FullFeedData | null;
  marketOpen: boolean;
}) {
  const levels: QuoteLevel[] = feed?.marketLevel ?? [];
  const hasDepth = levels.length > 0 && levels.some(l => (l.bidP ?? 0) > 0 || (l.askP ?? 0) > 0);

  return (
    <div className="bg-surface border border-border-light p-5 rounded-none h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-3 w-3 text-muted" />
          <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
            Market Quote
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-mono text-muted uppercase tracking-wider">
          <span className={`h-1.5 w-1.5 rounded-full ${marketOpen && hasDepth ? 'bg-positive animate-pulse' : 'bg-muted'}`} />
          {marketOpen ? (hasDepth ? 'Live' : 'Idle') : 'Closed'}
        </span>
      </div>

      {!marketOpen || !hasDepth ? (
        <div className="flex flex-col flex-1">
          <div className="grid grid-cols-4 bg-neutral border border-b-0 border-border-light px-2 py-1.5 text-[10px] font-mono text-muted uppercase tracking-widest">
            <span>Bid Qty</span>
            <span>Bid</span>
            <span className="text-right">Ask</span>
            <span className="text-right">Ask Qty</span>
          </div>
          <div className="border border-border-light divide-y divide-border-light">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 text-[13px] font-mono tabular-nums py-2 px-2">
                <span className="text-muted">--</span>
                <span className="text-positive font-medium">--</span>
                <span className="text-right text-negative font-medium">--</span>
                <span className="text-right text-muted">--</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-neutral px-2 py-1.5">
              <div className="text-[9px] font-mono text-muted uppercase tracking-widest">Total Buy</div>
              <div className="text-[13px] font-mono font-medium text-positive tabular-nums">--</div>
            </div>
            <div className="bg-neutral px-2 py-1.5">
              <div className="text-[9px] font-mono text-muted uppercase tracking-widest">Total Sell</div>
              <div className="text-[13px] font-mono font-medium text-negative tabular-nums">--</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 flex-1">
          <div>
            <div className="grid grid-cols-4 bg-neutral border border-b-0 border-border-light px-2 py-1.5 text-[10px] font-mono text-muted uppercase tracking-widest">
              <span>Bid Qty</span>
              <span>Bid</span>
              <span className="text-right">Ask</span>
              <span className="text-right">Ask Qty</span>
            </div>
            <div className="border border-border-light divide-y divide-border-light">
              {levels.slice(0, 5).map((l, i) => (
                <div key={i} className="grid grid-cols-4 text-[13px] font-mono tabular-nums py-2 px-2">
                  <span className="text-muted">{l.bidQ > 0 ? fmtQty(l.bidQ) : '—'}</span>
                  <span className="text-positive font-medium">{l.bidP > 0 ? fmt(l.bidP) : '—'}</span>
                  <span className="text-right text-negative font-medium">{l.askP > 0 ? fmt(l.askP) : '—'}</span>
                  <span className="text-right text-muted">{l.askQ > 0 ? fmtQty(l.askQ) : '—'}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-neutral px-2 py-1.5">
                <div className="text-[9px] font-mono text-muted uppercase tracking-widest">Total Buy</div>
                <div className="text-[13px] font-mono font-medium text-positive tabular-nums">{fmtQty(feed?.tbq)}</div>
              </div>
              <div className="bg-neutral px-2 py-1.5">
                <div className="text-[9px] font-mono text-muted uppercase tracking-widest">Total Sell</div>
                <div className="text-[13px] font-mono font-medium text-negative tabular-nums">{fmtQty(feed?.tsq)}</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ── Volume & Averages — ATP, volume, OI, IV from fullFeed.
 * Values show live during market hours; outside hours we fall back to the
 * last traded snapshot from the feed. ── */
function VolumeCard({ feed, marketOpen }: { feed: FullFeedData | null; marketOpen: boolean }) {
  const items: Array<{ label: string; value: string }> = [];
  if (feed?.atp != null) items.push({ label: 'Avg Trade Price', value: fmt(feed.atp) });
  if (feed?.vtt != null) items.push({ label: 'Volume (Today)', value: fmtQty(feed.vtt) });
  if (feed?.oi != null) items.push({ label: 'Open Interest', value: fmtQty(feed.oi) });
  if (feed?.iv != null) items.push({ label: 'Implied Volatility', value: fmt(feed.iv) });

  const showValues = items.length > 0;

  return (
    <div className="bg-surface border border-border-light p-4 rounded-none">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted" />
          <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
            Volume &amp; Averages
          </h3>
        </div>
        {!marketOpen && (
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Last traded
          </span>
        )}
      </div>
      {!showValues ? (
        <div className="text-[12px] text-muted py-2">
          {marketOpen
            ? 'Waiting for live trade statistics…'
            : 'No trade data available yet.'}
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

/* ── VsSectorMetric — stock value vs sector benchmark.
 * deviation = ((stock - sector) / sector) × 100, one decimal place.
 * Arrow indicates ONLY relative position (above/below sector), never a
 * buy/sell judgment. P/E & P/B use amber (valuation multiples are not
 * inherently good/bad); ROA & ROE use green/red only as a secondary cue. ── */

function VsSectorMetric({
  label,
  value,
  sector,
  suffix,
  kind,
}: {
  label: string;
  value: number | undefined | null;
  sector: number | undefined | null;
  suffix: string;
  kind: 'valuation' | 'profitability';
}) {
  const deviation =
    value != null && sector != null && sector > 0
      ? ((value - sector) / sector) * 100
      : null;

  let devDisplay: string | null = null;
  let devColor = 'text-muted';
  if (deviation != null) {
    if (Math.abs(deviation) < 0.5) {
      devDisplay = `≈ ${deviation.toFixed(1)}% vs sector`;
      devColor = 'text-muted';
    } else {
      const dir = deviation < 0 ? '↓' : '↑';
      devDisplay = `${dir} ${Math.abs(deviation).toFixed(1)}% vs sector`;
      devColor = kind === 'valuation'
        ? 'text-[#C5A15A]'
        : deviation >= 0 ? 'text-[#65B88A]' : 'text-[#D66B68]';
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-mono text-muted uppercase tracking-widest font-semibold">{label}</span>
        <span className="text-[22px] font-mono font-semibold text-primary tabular-nums leading-none">
          {value != null ? `${value.toFixed(2)}${suffix}` : '—'}
        </span>
      </div>
      <div className="mt-1.5 text-[12px] font-mono text-muted tabular-nums">
        Sector {sector != null ? `${sector.toFixed(2)}${suffix}` : '—'}
      </div>
      <div className={`mt-2 text-[13px] font-mono font-semibold tabular-nums ${devColor}`}>
        {devDisplay ?? '—'}
      </div>
    </div>
  );
}