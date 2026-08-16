import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import type { DashboardIndex } from '../../hooks/useDashboard';
import { useTopStocks } from '../../hooks/useTopStocks';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor, isMarketOpen } from '../../lib/utils';
import { AIInsight } from '../layout/AIInsight';
import { MarketPulse } from '../ui/MarketPulse';
import { MiniChart } from '../ui/MiniChart';

// Maps well-known NSE sectoral index names → short sector label
const SECTOR_LABEL_MAP: Record<string, string> = {
  'NIFTY BANK': 'Banking',
  'NIFTY PSU BANK': 'PSU Bank',
  'NIFTY PRIVATE BANK': 'Pvt Bank',
  'NIFTY FINANCIAL SERVICES': 'Finance',
  'NIFTY IT': 'IT',
  'NIFTY FMCG': 'FMCG',
  'NIFTY AUTO': 'Auto',
  'NIFTY PHARMA': 'Pharma',
  'NIFTY METAL': 'Metal',
  'NIFTY ENERGY': 'Energy',
  'NIFTY REALTY': 'Realty',
  'NIFTY MEDIA': 'Media',
  'NIFTY HEALTHCARE': 'Health',
  'NIFTY INFRASTRUCTURE': 'Infra',
  'NIFTY COMMODITIES': 'Commod',
  'NIFTY CONSUMPTION': 'Consump',
};

const SECTOR_COLORS = [
  '#4d9fff', '#4dd6c4', '#a78bfa', '#ffb454', '#3ddc84',
  '#ff6b5e', '#facc15', '#22d3ee', '#fb923c', '#a3e635',
  '#f472b6', '#94a3b8',
];

/* ── Dashboard Page ── */
export const Dashboard = () => {
  const navigate = useNavigate();
  const { indices, loading, error, refreshDashboard } = useDashboard();
  const { stocks: topStocks } = useTopStocks(6);
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [marketOpen, setMarketOpen] = useState(isMarketOpen);

  useEffect(() => {
    const t = setInterval(() => setMarketOpen(isMarketOpen()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  const handleRefresh = () => refreshDashboard();

  // Compute sector breadth from the loaded indices. Each mapped sector
  // shows the % change of the matching NSE sectoral index (live data).
  const sectorData = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; pct: number; color: string }[] = [];
    let colorIdx = 0;
    for (const idx of indices) {
      const label = SECTOR_LABEL_MAP[idx.indexName.toUpperCase().trim()];
      if (!label || seen.has(label)) continue;
      if (idx.pChange == null) continue;
      seen.add(label);
      out.push({
        name: label,
        pct: idx.pChange,
        color: SECTOR_COLORS[colorIdx++ % SECTOR_COLORS.length],
      });
      if (out.length >= 5) break;
    }
    return out;
  }, [indices]);

  // ── Top 5 indices in a fixed display order. Match is case-insensitive on
  // indexName and tolerant of minor backend variants (e.g. "NIFTY 50" vs
  // "Nifty 50"). Unmatched indices fall through to their natural search order.
  const STRIP_ORDER = [
    'NIFTY 50',
    'SENSEX',
    'NIFTY BANK',
    'NIFTY 100',
    'NIFTY 200',
  ];
  const stripIndices = useMemo(() => {
    const picked: DashboardIndex[] = [];
    const seen = new Set<string>();
    for (const target of STRIP_ORDER) {
      const match = indices.find(
        i => !seen.has(i.instrumentKey) && i.indexName.toUpperCase() === target,
      );
      if (match) {
        picked.push(match);
        seen.add(match.instrumentKey);
      }
    }
    // Append any remaining indices so the strip always has 5 cards if available.
    for (const i of indices) {
      if (picked.length >= 5) break;
      if (!seen.has(i.instrumentKey)) {
        picked.push(i);
        seen.add(i.instrumentKey);
      }
    }
    return picked;
  }, [indices]);

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
            <div key={i} className="bg-surface card-border p-6 h-36 skeleton animate-shimmer" />
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
          className="px-5 py-2.5 bg-accent text-white font-sans text-sm hover:bg-accent/90 transition-colors"
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
            <p className="text-[12px] font-mono text-muted mt-1.5">Equities · Indices · AI Analysis</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary disabled:opacity-50 group transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'} duration-500`} />
            Refresh
          </button>
        </div>
      </div>

      {/* AI Insight — above the index strip */}
      <AIInsight />

      {/* Index Strip — single horizontal strip with mini sparklines */}
      <div className="bg-surface border border-border-light mt-8 divide-x divide-border-light overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {stripIndices.map((idx: DashboardIndex, i) => {
            const isUp = (idx.pChange ?? 0) >= 0;
            const changeColor = isUp
              ? (isDark ? '#5ab870' : '#2e7d32')
              : (isDark ? '#e06060' : '#c62828');
            return (
              <Link
                to={`/index/${encodeURIComponent(idx.instrumentKey)}`}
                key={idx.instrumentKey}
                className="group px-5 py-4 hover:bg-neutral transition-colors fade-in-up border-b md:border-b-0 border-border-light"
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-[10px] font-mono text-muted tracking-wider uppercase truncate">
                    {idx.indexName}
                  </div>
                  {idx.exchange && (
                    <span className={`flex-shrink-0 text-[8px] font-bold uppercase tracking-wider ${
                      idx.exchange === 'BSE' ? 'text-amber-500 dark:text-amber-400' : 'text-accent'
                    }`}>
                      {idx.exchange}
                    </span>
                  )}
                </div>
                {idx.ltp != null ? (
                  <>
                    <div className="text-[16px] font-mono font-semibold tracking-tight text-primary">
                      {fmt(idx.ltp)}
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] font-mono font-medium mt-1 ${getChangeColor(idx.pChange)}`}>
                      <span>{isUp ? '↗' : '↘'}</span>
                      <span>{isUp ? '+' : ''}{idx.change?.toFixed(2)}</span>
                      <span className="text-muted">({isUp ? '+' : ''}{idx.pChange?.toFixed(2)}%)</span>
                    </div>
                    <div className="mt-2">
                      <MiniChart instrumentKey={idx.instrumentKey} color={changeColor} height={28} />
                    </div>
                  </>
                ) : (
                  <div className="h-4 w-20 skeleton animate-shimmer mt-1" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Index Summary Table */}
      {indices.length > 0 && (
        <div className="grid grid-cols-12 gap-4 mt-6">
          {/* Market Pulse — visual gauge */}
          <div
            className="col-span-12 lg:col-span-4 fade-in-up"
            style={{ animationDelay: '0.5s', opacity: 0 }}
          >
            <MarketPulse
              gaining={indices.filter(i => (i.pChange ?? 0) >= 0).length}
              declining={indices.filter(i => (i.pChange ?? 0) < 0).length}
              sectors={sectorData}
              note={
                sectorData.length > 0
                  ? `Breadth driven by ${sectorData[0].name} at ${sectorData[0].pct >= 0 ? '+' : ''}${sectorData[0].pct.toFixed(2)}% — ${indices.filter(i => (i.pChange ?? 0) >= 0).length} of ${indices.length} tracked indices advancing.`
                  : `Breadth — ${indices.filter(i => (i.pChange ?? 0) >= 0).length} of ${indices.length} tracked indices advancing.`
              }
            />
          </div>

          {/* Index Overview Table */}
          <div
            className="col-span-12 lg:col-span-8 bg-surface p-6 border border-border-light fade-in-up"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            <Link
              to="/indices"
              className="flex items-center justify-between mb-5 group hover:text-accent transition-colors"
            >
              <h3 className="text-[10px] font-mono text-muted tracking-widest uppercase group-hover:text-accent transition-colors">
                Index Overview · View all
              </h3>
              <ArrowRight className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors" />
            </Link>
            <table className="w-full text-[13px] font-mono">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                  {['Index', 'Exchange', 'Last', 'Change', 'Chg %'].map(h => (
                    <th key={h} className={`pb-3 font-medium ${h !== 'Index' && h !== 'Exchange' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-[13px] font-mono">
                <tbody>
                  {indices.map((idx: DashboardIndex) => {
                    const isUp = (idx.pChange ?? 0) >= 0;
                    return (
                      <tr
                        key={idx.instrumentKey}
                        onClick={() => navigate(`/index/${encodeURIComponent(idx.instrumentKey)}`)}
                        className="hover:bg-neutral transition-colors cursor-pointer group border-t border-border-light"
                      >
                        <td className="py-3 font-medium group-hover:text-accent transition-colors">{idx.indexName}</td>
                        <td className="py-3 text-muted text-[11px]">{idx.exchange}</td>
                        <td className="py-3 text-right text-muted-heavy">
                          {idx.ltp != null ? fmt(idx.ltp) : '—'}
                        </td>
                        <td className={`py-3 text-right font-medium ${getChangeColor(idx.change)}`}>
                          {idx.change != null ? `${isUp ? '+' : ''}${fmt(idx.change)}` : '—'}
                        </td>
                        <td className={`py-3 text-right font-medium ${getChangeColor(idx.pChange)}`}>
                          {idx.pChange != null ? `${isUp ? '+' : ''}${idx.pChange.toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Stocks — live data from screener ── */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-heading font-light tracking-tight text-primary">Top Stocks</h2>
            <p className="text-[12px] font-mono text-muted mt-1">Live from Financial Services · IT · Energy</p>
          </div>
          <Link
            to="/screener"
            className="text-[11px] font-mono text-muted hover:text-accent transition-colors flex items-center gap-1"
          >
            See more <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topStocks.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border-light p-4 h-32 skeleton animate-shimmer" />
            ))
          ) : (
            topStocks.map(s => {
              const isUp = (s.pChange ?? 0) >= 0;
              const changeColor = isUp
                ? (isDark ? '#5ab870' : '#2e7d32')
                : (isDark ? '#e06060' : '#c62828');
              return (
                <Link
                  key={s.stockSymbol}
                  to={`/stocks/${s.stockSymbol}`}
                  state={s}
                  className="bg-surface border border-border-light p-4 hover:border-accent transition-all group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-[13px] font-mono font-semibold text-primary group-hover:text-accent transition-colors truncate">{s.stockSymbol}</div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[12px] text-muted truncate">{s.companyName || s.stockName}</div>
                  {s.ltp != null ? (
                    <>
                      <div className="text-[15px] font-mono font-semibold text-primary tracking-tight">
                        ₹{fmt(s.ltp)}
                      </div>
                      <div className={`text-[11px] font-mono font-medium ${getChangeColor(s.pChange)}`}>
                        {isUp ? '+' : ''}{s.pChange?.toFixed(2)}%
                      </div>
                      <div className="mt-auto pt-1">
                        <MiniChart instrumentKey={s.instrumentKey} color={changeColor} height={24} />
                      </div>
                    </>
                  ) : (
                    <div className="h-4 w-16 skeleton animate-shimmer" />
                  )}
                  {s.exchange && (
                    <div className="text-[9px] font-mono text-muted mt-1 uppercase tracking-wider truncate">
                      {s.exchange}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
