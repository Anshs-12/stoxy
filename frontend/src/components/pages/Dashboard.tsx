import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Activity } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor } from '../../lib/utils';

const fmtVol = (n: number) => n?.toLocaleString('en-IN') ?? '—';

const dayRangeChart = (low: number, high: number, last: number) => {
  if (!low || !high || low === high) return [];
  const steps = 12;
  return Array.from({ length: steps }, (_, i) => ({
    v: i === steps - 1 ? last : low + ((high - low) * i) / (steps - 1),
  }));
};

const MiniChart = ({ data, color }: { data: { v: number }[]; color: string }) => {
  if (!data.length) return <div className="h-16 w-full mt-4 bg-neutral rounded-md" />;
  return (
    <div className="h-16 w-full mt-4 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`mc-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                fillOpacity={1} fill={`url(#mc-${color.replace('#', '')})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const INDEX_SYMBOLS = ['NIFTY 50', 'NIFTY BANK', 'NIFTY NEXT 50'];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { indices, loading, error, refreshDashboard } = useDashboard();
  const { isDark } = useTheme();
  const [marketOpen, setMarketOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = ist.getHours();
      const minutes = ist.getMinutes();
      const day = ist.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = (hours === 9 && minutes >= 15) || (hours > 9 && hours < 15) || (hours === 15 && minutes <= 30);
      setMarketOpen(isWeekday && isMarketHours);
      setCurrentTime(ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  if (loading && indices.length === 0) return (
    <div className="flex flex-col items-center justify-center h-80">
      <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      <p className="text-sm font-mono text-muted mt-4">Loading market data...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-20">
      <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-negative/10 flex items-center justify-center">
        <TrendingDown className="h-5 w-5 text-negative" />
      </div>
      <p className="text-sm font-mono text-negative mb-2">Connection Error</p>
      <p className="text-[13px] text-muted max-w-md mx-auto mb-6">{error}</p>
      <button onClick={handleRefresh}
        className="px-5 py-2.5 bg-accent text-white font-sans text-sm rounded-lg hover:bg-accent/90 transition-colors">
        Try Again
      </button>
    </div>
  );

  const adv = indices[0]?.indexAdvanceDTO;
  const totalAD = (adv?.advances ?? 0) + (adv?.declines ?? 0);
  const advPct = totalAD > 0 ? Math.round((adv!.advances / totalAD) * 100) : 50;

  return (
    <div className="pb-12">
      {/* Hero Section */}
      <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`h-2 w-2 rounded-full ${marketOpen ? 'bg-positive' : 'bg-muted'} ${marketOpen ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            {marketOpen ? 'Market Open' : 'Market Closed'}
          </span>
          <span className="text-[10px] font-mono text-muted ml-auto">{currentTime}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Market Overview</h1>
            <p className="text-[12px] font-mono text-muted mt-1.5">Real-time NSE India indices &amp; market breadth</p>
          </div>
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-border text-[11px] font-mono text-primary rounded-lg disabled:opacity-50 group transition-all hover:shadow-ambient">
            <RefreshCw className={`h-3.5 w-3.5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'} duration-500`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {indices.map((idx, i) => {
          const p = idx.indexPriceInfoDTO;
          const isUp = (p?.change ?? 0) >= 0;
          const chart = dayRangeChart(p?.dayLow, p?.dayHigh, p?.lastPrice);
          const changeColor = isUp ? (isDark ? '#5ab870' : '#2e7d32') : (isDark ? '#e06060' : '#c62828');
          return (
            <Link to={`/index/${encodeURIComponent(INDEX_SYMBOLS[i])}`} key={idx.name}
              className={`group bg-surface card-border rounded-xl p-6 transition-all duration-300 cursor-pointer fade-in-up`}
              style={{ animationDelay: `${i * 0.12 + 0.2}s`, opacity: 0 }}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center ${isUp ? 'bg-positive/10' : 'bg-negative/10'}`}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5 text-positive" /> : <TrendingDown className="h-3.5 w-3.5 text-negative" />}
                  </div>
                  <span className="text-[10px] font-mono text-muted tracking-wider uppercase">{idx.name}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-mono font-semibold tracking-tight mt-3 text-primary">{fmt(p?.lastPrice)}</div>
              <div className={`flex items-center gap-1.5 text-[13px] font-mono font-medium mt-1 ${getChangeColor(p?.change)}`}>
                {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{isUp ? '+' : ''}{fmt(p?.change)}</span>
                <span className="text-muted">({isUp ? '+' : ''}{fmt(p?.pChange)}%)</span>
              </div>
              <MiniChart data={chart} color={changeColor} />
            </Link>
          );
        })}
      </div>

      {/* Market Breadth + Index Table */}
      {adv && (
        <div className="grid grid-cols-12 gap-4 mt-6">
          {/* Market Breadth */}
          <div className={`col-span-5 bg-surface p-6 card-border rounded-xl fade-in-up`} style={{ animationDelay: '0.5s', opacity: 0 }}>
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-4 w-4 text-muted" />
              <h3 className="text-[10px] font-mono text-muted tracking-widest uppercase">Market Breadth</h3>
            </div>

            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-3xl font-mono font-semibold text-positive">{fmtVol(adv.advances)}</div>
                <div className="text-[9px] font-mono text-muted tracking-widest mt-1">ADVANCES</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono text-muted">{fmtVol(adv.unChanged)}</div>
                <div className="text-[9px] font-mono text-muted tracking-widest mt-1">UNCHANGED</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-semibold text-negative">{fmtVol(adv.declines)}</div>
                <div className="text-[9px] font-mono text-muted tracking-widest mt-1">DECLINES</div>
              </div>
            </div>

            {/* Animated breadth bar */}
            <div className="relative h-2 w-full bg-neutral rounded-full overflow-hidden mb-3">
              <div className="h-full bg-positive rounded-full transition-all duration-1000 ease-out" style={{ width: `${advPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span className="text-positive font-medium">{advPct}% Bullish</span>
              <span className="text-negative font-medium">{100 - advPct}% Bearish</span>
            </div>
          </div>

          {/* Index Overview Table */}
          <div className={`col-span-7 bg-surface p-6 card-border rounded-xl fade-in-up`} style={{ animationDelay: '0.6s', opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-mono text-muted tracking-widest uppercase">Index Overview</h3>
              <ArrowRight className="h-3.5 w-3.5 text-muted" />
            </div>
            <table className="w-full text-[13px] font-mono">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                  {['Index', 'Last', 'Open', 'High', 'Low', 'Chg %'].map(h => (
                    <th key={h} className={`pb-3 font-medium ${h !== 'Index' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indices.map((idx, i) => {
                  const p = idx.indexPriceInfoDTO;
                  const pChg = p?.pChange;
                  const isUp = (pChg ?? 0) >= 0;
                  return (
                    <tr key={idx.name} onClick={() => navigate(`/index/${encodeURIComponent(INDEX_SYMBOLS[i])}`)}
                      className="hover:bg-neutral transition-colors cursor-pointer group border-t border-border-light">
                      <td className="py-3.5 font-medium group-hover:text-accent transition-colors">{idx.name}</td>
                      <td className="py-3.5 text-right text-muted-heavy">{fmt(p?.lastPrice)}</td>
                      <td className="py-3.5 text-right text-muted">{fmt(p?.open)}</td>
                      <td className="py-3.5 text-right text-muted">{fmt(p?.dayHigh)}</td>
                      <td className="py-3.5 text-right text-muted">{fmt(p?.dayLow)}</td>
                      <td className={`py-3.5 text-right font-medium ${getChangeColor(pChg)}`}>
                        {isUp ? '+' : ''}{fmt(pChg)}%
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
