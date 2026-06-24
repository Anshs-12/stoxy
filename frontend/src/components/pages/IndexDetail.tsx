import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useIndexDetail } from '../../hooks/useIndexDetail';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor } from '../../lib/utils';

export const NSEIndexDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { index, loading, error, refreshIndex } = useIndexDetail(symbol);
  const { isDark } = useTheme();

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-accent" />
        <span className="text-sm font-sans">Loading index data…</span>
      </div>
    );
  }

  /* ── Error ── */
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
  const ltp = index.liveLtp;
  const change = index.liveChange;
  const pChange = index.livePChange;
  const isUp = (change ?? 0) >= 0;
  const positiveColor = isDark ? '#5ab870' : '#2e7d32';
  const negativeColor = isDark ? '#e06060' : '#c62828';
  const lineColor = isUp ? positiveColor : negativeColor;

  return (
    <div className="pb-12 space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
        <button
          onClick={refreshIndex}
          className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors p-1.5 rounded-md hover:bg-neutral"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1">
          <p className="text-[9px] text-muted tracking-[0.12em] uppercase mb-3 font-medium">
            {index.instrumentKey}
          </p>
          <h1 className="text-3xl font-heading font-light tracking-tight leading-tight text-primary">
            {index.indexName}
          </h1>
          {m && (
            <p className="text-sm text-muted font-sans mt-2">
              {m.numberOfConstituents ? `${m.numberOfConstituents} constituents` : ''}
              {m.numberOfConstituents && m.baseDate ? ' · ' : ''}
              {m.baseDate ? `Base: ${m.baseDate}` : ''}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {ltp != null ? (
            <>
              <div className="text-4xl font-mono font-semibold tracking-tight text-primary">
                {fmt(ltp)}
              </div>
              <div className={`flex items-center justify-end gap-1.5 text-[14px] font-medium mt-1.5 ${getChangeColor(change)}`}>
                {isUp
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />
                }
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
          {/* Live indicator */}
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <div className={`h-1.5 w-1.5 rounded-full ${ltp != null ? 'bg-positive animate-pulse' : 'bg-muted'}`} />
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
              {ltp != null ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-8 space-y-5">

          {/* Trend Visual */}
          <div className="bg-surface p-6 card-border rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">Price Trend</h3>
              <span className="text-[10px] text-muted font-mono">
                {ltp != null ? `Last: ${fmt(ltp)}` : 'No live data'}
              </span>
            </div>
            {ltp != null ? (
              <div className="relative h-36 w-full">
                <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lineColor} stopOpacity="0.25" />
                      <stop offset="95%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Decorative trend line based on direction */}
                  <polyline
                    points={isUp
                      ? '0,70 50,58 100,48 150,36 200,24 250,14 300,6'
                      : '0,6 50,14 100,24 150,36 200,48 250,58 300,70'}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points={isUp
                      ? '0,70 50,58 100,48 150,36 200,24 250,14 300,6 300,80 0,80'
                      : '0,6 50,14 100,24 150,36 200,48 250,58 300,70 300,80 0,80'}
                    fill="url(#trend-grad)"
                  />
                </svg>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-muted text-[13px] font-sans">
                Live chart data unavailable — market may be closed
              </div>
            )}
          </div>

          {/* About */}
          {m?.description && (
            <div className="bg-surface p-6 card-border rounded-xl">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-4">About this Index</h3>
              <p className="text-[13px] text-muted font-sans leading-relaxed">{m.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-[12px]">
                {m.launchDate && (
                  <div>
                    <span className="text-muted">Launch Date </span>
                    <span className="text-primary font-medium">{m.launchDate}</span>
                  </div>
                )}
                {m.methodology && (
                  <div>
                    <span className="text-muted">Methodology </span>
                    <span className="text-primary font-medium">{m.methodology}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-5">

          {/* Live Price Card */}
          <div className="bg-neutral rounded-xl border border-border-light p-5">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
              {isUp
                ? <TrendingUp className="h-3 w-3 text-positive" />
                : <TrendingDown className="h-3 w-3 text-negative" />
              }
              Live Price
            </h3>
            <div className="text-3xl font-mono font-semibold text-primary">
              {ltp != null ? fmt(ltp) : '—'}
            </div>
            {change != null && (
              <div className={`text-[12px] font-medium mt-1 ${getChangeColor(change)}`}>
                {isUp ? '+' : ''}{fmt(change)} ({isUp ? '+' : ''}{pChange?.toFixed(2)}%)
              </div>
            )}
            {ltp == null && (
              <p className="text-[10px] text-muted mt-2">Market may be closed</p>
            )}
          </div>

          {/* Index Info */}
          {m && (
            <div className="bg-surface rounded-xl border border-border-light p-5">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-4">Index Info</h3>
              <div className="space-y-3 text-[13px]">
                {[
                  { l: 'Symbol', v: index.indexSymbol },
                  { l: 'Constituents', v: m.numberOfConstituents },
                  { l: 'Launch Date', v: m.launchDate },
                  { l: 'Base Date', v: m.baseDate },
                  { l: 'Methodology', v: m.methodology },
                  { l: 'Status', v: m.isActive ? '✓ Active' : 'Inactive' },
                ].filter(item => item.v != null && String(item.v) !== '').map(item => (
                  <div key={String(item.l)} className="flex justify-between items-start gap-2">
                    <span className="text-muted flex-shrink-0">{item.l}</span>
                    <span className={`font-medium text-right ${String(item.v).startsWith('✓') ? 'text-positive' : 'text-primary'}`}>
                      {String(item.v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
