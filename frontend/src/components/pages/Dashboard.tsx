import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Activity } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import type { DashboardIndex } from '../../hooks/useDashboard';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor } from '../../lib/utils';

/* ── Mini SVG sparkline using the day-range concept ── */
const MiniChart = ({ pChange, color }: { pChange: number | null; color: string }) => {
  // Generate a simple trend line based on % change (decorative)
  const isUp = (pChange ?? 0) >= 0;
  const points = isUp
    ? '0,30 20,22 40,18 60,12 80,8 100,4'
    : '0,4 20,8 40,12 60,18 80,24 100,30';
  return (
    <svg viewBox="0 0 100 36" className="w-full h-9 mt-3" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${isUp ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const fmtVol = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ── Dashboard Page ── */
export const Dashboard = () => {
  const navigate = useNavigate();
  const { indices, loading, error, refreshDashboard } = useDashboard();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [marketOpen] = useState(() => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    return (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30));
  });

  useEffect(() => { setMounted(true); }, []);

  const handleRefresh = () => refreshDashboard();

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="pb-12">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Loading Market Data…</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-surface card-border rounded-xl p-6 h-36 skeleton animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error && indices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-negative text-center max-w-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-5 py-2.5 bg-accent text-white font-sans text-sm rounded-lg hover:bg-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ── Main Content ── */
  return (
    <div className="pb-12">
      {/* Hero */}
      <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`h-2 w-2 rounded-full ${marketOpen ? 'bg-positive animate-pulse' : 'bg-muted'}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {marketOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Market Overview</h1>
            <p className="text-[12px] font-mono text-muted mt-1.5">Real-time NSE &amp; BSE indices · live via Upstox</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-border text-[11px] font-mono text-primary rounded-lg disabled:opacity-50 group transition-all hover:shadow-ambient"
          >
            <RefreshCw className={`h-3.5 w-3.5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'} duration-500`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Index Cards Grid */}
      <div className={`grid gap-4 mt-8 ${indices.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {indices.map((idx: DashboardIndex, i) => {
          const isUp = (idx.pChange ?? 0) >= 0;
          const changeColor = isUp
            ? (isDark ? '#5ab870' : '#2e7d32')
            : (isDark ? '#e06060' : '#c62828');
          return (
            <Link
              to={`/index/${encodeURIComponent(idx.instrumentKey)}`}
              key={idx.instrumentKey}
              className="group bg-surface card-border rounded-xl p-6 transition-all duration-300 cursor-pointer fade-in-up"
              style={{ animationDelay: `${i * 0.12 + 0.2}s`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center ${isUp ? 'bg-positive/10' : 'bg-negative/10'}`}>
                    {isUp
                      ? <TrendingUp className="h-3.5 w-3.5 text-positive" />
                      : <TrendingDown className="h-3.5 w-3.5 text-negative" />
                    }
                  </div>
                  <span className="text-[10px] font-mono text-muted tracking-wider uppercase">{idx.indexName}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {idx.ltp != null ? (
                <>
                  <div className="text-2xl font-mono font-semibold tracking-tight mt-3 text-primary">
                    {fmt(idx.ltp)}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[13px] font-mono font-medium mt-1 ${getChangeColor(idx.pChange)}`}>
                    {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{isUp ? '+' : ''}{fmt(idx.change)}</span>
                    <span className="text-muted">({isUp ? '+' : ''}{idx.pChange?.toFixed(2)}%)</span>
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <div className="h-6 w-24 skeleton animate-shimmer rounded mb-2" />
                  <div className="h-4 w-16 skeleton animate-shimmer rounded" />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Index Summary Table */}
      {indices.length > 0 && (
        <div className="grid grid-cols-12 gap-4 mt-6">
          {/* Market Sentiment */}
          <div
            className="col-span-5 bg-surface p-6 card-border rounded-xl fade-in-up"
            style={{ animationDelay: '0.5s', opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-4 w-4 text-muted" />
              <h3 className="text-[10px] font-mono text-muted tracking-widest uppercase">Market Pulse</h3>
            </div>

            {/* Show up/down split of found indices */}
            {(() => {
              const up = indices.filter(i => (i.pChange ?? 0) >= 0).length;
              const dn = indices.length - up;
              const upPct = indices.length > 0 ? Math.round((up / indices.length) * 100) : 50;
              return (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-3xl font-mono font-semibold text-positive">{fmtVol(up)}</div>
                      <div className="text-[9px] font-mono text-muted tracking-widest mt-1">GAINING</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-mono font-semibold text-negative">{fmtVol(dn)}</div>
                      <div className="text-[9px] font-mono text-muted tracking-widest mt-1">DECLINING</div>
                    </div>
                  </div>
                  <div className="relative h-2 w-full bg-neutral rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-positive rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${upPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted">
                    <span className="text-positive font-medium">{upPct}% Bullish</span>
                    <span className="text-negative font-medium">{100 - upPct}% Bearish</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Index Overview Table */}
          <div
            className="col-span-7 bg-surface p-6 card-border rounded-xl fade-in-up"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-mono text-muted tracking-widest uppercase">Index Overview</h3>
              <ArrowRight className="h-3.5 w-3.5 text-muted" />
            </div>
            <table className="w-full text-[13px] font-mono">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                  {['Index', 'Exchange', 'Last', 'Change', 'Chg %'].map(h => (
                    <th key={h} className={`pb-3 font-medium ${h !== 'Index' && h !== 'Exchange' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indices.map((idx: DashboardIndex) => {
                  const isUp = (idx.pChange ?? 0) >= 0;
                  return (
                    <tr
                      key={idx.instrumentKey}
                      onClick={() => navigate(`/index/${encodeURIComponent(idx.instrumentKey)}`)}
                      className="hover:bg-neutral transition-colors cursor-pointer group border-t border-border-light"
                    >
                      <td className="py-3.5 font-medium group-hover:text-accent transition-colors">{idx.indexName}</td>
                      <td className="py-3.5 text-muted text-[11px]">{idx.exchange}</td>
                      <td className="py-3.5 text-right text-muted-heavy">
                        {idx.ltp != null ? fmt(idx.ltp) : '—'}
                      </td>
                      <td className={`py-3.5 text-right font-medium ${getChangeColor(idx.change)}`}>
                        {idx.change != null ? `${isUp ? '+' : ''}${fmt(idx.change)}` : '—'}
                      </td>
                      <td className={`py-3.5 text-right font-medium ${getChangeColor(idx.pChange)}`}>
                        {idx.pChange != null ? `${isUp ? '+' : ''}${idx.pChange.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
