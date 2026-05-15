import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useIndexDetail } from '../../hooks/useIndexDetail';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor } from '../../lib/utils';

const dayChart = (low: number, high: number, last: number) => {
  if (!low || !high || low === high) return [];
  const steps = 12;
  return Array.from({ length: steps }, (_, i) => ({
    v: i === steps - 1 ? last : low + ((high - low) * i) / (steps - 1),
  }));
};

export const NSEIndexDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { index, loading, error } = useIndexDetail(symbol);
  const { isDark } = useTheme();

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm font-inter">Loading index...</span>
    </div>
  );

  if (error || !index) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-600/80 font-inter mb-2">⚠ Error</p>
      <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error}</p>
      <Link to="/" className="text-[12px] text-primary border-b border-primary pb-px">← Back to Dashboard</Link>
    </div>
  );

  const p = index.indexPriceInfoDTO;
  const m = index.indexMetadataDTO;
  const adv = index.indexAdvanceDTO;
  const isUp = (p?.change ?? 0) >= 0;
  const chart = dayChart(p?.dayLow, p?.dayHigh, p?.lastPrice);
  const totalAD = (adv?.advances ?? 0) + (adv?.declines ?? 0);
  const advPct = totalAD > 0 ? Math.round((adv!.advances / totalAD) * 100) : 50;

  return (
    <div className="pb-12 space-y-8">
      <Link to="/" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Dashboard
      </Link>

      <div className="flex justify-between items-start gap-8">
        <div className="flex-1">
          <p className="text-[9px] text-muted tracking-[0.12em] uppercase mb-3 font-medium">NSE India · Benchmark Index</p>
          <h1 className="text-3xl font-manrope font-light tracking-tight leading-tight">{index.name}</h1>
          <p className="text-sm text-muted font-inter mt-2">
            {m?.numberOfConstituents} constituents · Base: {m?.baseDate}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-inter font-medium tracking-tight">₹{fmt(p?.lastPrice)}</div>
          <div className={`text-[13px] font-medium mt-1 ${getChangeColor(p?.change)}`}>
            {isUp ? '↗' : '↘'} {isUp ? '+' : ''}{fmt(p?.change)} ({isUp ? '+' : ''}{fmt(p?.pChange ?? p?.pchange)}%)
          </div>
          <div className="text-[11px] text-muted mt-1">as of {index.time}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          {/* Chart */}
          <div className="bg-surface p-5 academic-shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">Day Range</h3>
              <span className="text-[10px] text-muted">Intraday low → high</span>
            </div>
            {chart.length > 0 ? (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? (isDark ? '#4ADE80' : '#A5D6A7') : (isDark ? '#F87171' : '#EF9A9A')} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isUp ? (isDark ? '#4ADE80' : '#A5D6A7') : (isDark ? '#F87171' : '#EF9A9A')} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={isUp ? (isDark ? '#4ADE80' : '#A5D6A7') : (isDark ? '#F87171' : '#EF9A9A')}
                      strokeWidth={1.5} fillOpacity={1} fill="url(#ig)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted text-[13px]">
                Chart data unavailable (market may be closed)
              </div>
            )}
          </div>

          {/* Price Data */}
          <div className="bg-surface p-5 academic-shadow">
            <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-5">Price Data</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
              {[
                { l: 'Open', v: fmt(p?.open) },
                { l: 'Day High', v: fmt(p?.dayHigh) },
                { l: 'Day Low', v: fmt(p?.dayLow) },
                { l: '52W High', v: fmt(p?.yearHigh) },
                { l: '52W Low', v: fmt(p?.yearLow) },
                { l: 'Volume', v: p?.totalTradedVolume?.toLocaleString('en-IN') ?? '—' },
              ].map(item => (
                <div key={item.l}>
                  <p className="text-[9px] text-muted uppercase tracking-widest mb-1">{item.l}</p>
                  <p className="text-base font-inter font-light">{item.v}</p>
                </div>
              ))}
            </div>
            {p?.yearHigh && p?.yearLow && (
              <div className="mt-6">
                <p className="text-[9px] text-muted uppercase tracking-widest mb-2">52-Week Range</p>
                <div className="relative h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full">
                  <div className="absolute h-full bg-black/20 dark:bg-white/20 rounded-full"
                    style={{
                      left: `${((p.dayLow - p.yearLow) / (p.yearHigh - p.yearLow)) * 100}%`,
                      width: `${Math.max(0.5, ((p.dayHigh - p.dayLow) / (p.yearHigh - p.yearLow)) * 100)}%`,
                    }} />
                  <div className="absolute h-3 w-3 bg-black dark:bg-white rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${((p.lastPrice - p.yearLow) / (p.yearHigh - p.yearLow)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted mt-1.5">
                  <span>₹{fmt(p.yearLow)}</span><span>₹{fmt(p.yearHigh)}</span>
                </div>
              </div>
            )}
          </div>

          {/* About */}
          {m?.description && (
            <div className="bg-surface p-5 academic-shadow">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-4">About this Index</h3>
              <p className="text-[13px] text-muted font-inter leading-relaxed mb-4">{m.description}</p>
              <div className="text-[12px] text-muted space-y-1.5">
                <p>Launch Date: <span className="text-primary">{m.launchDate}</span></p>
                {m.methodology && <p>Methodology: <span className="text-primary">{m.methodology}</span></p>}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-5">
          {/* Market Breadth */}
          {adv && (
            <div className="bg-neutral p-5">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-5">Market Breadth</h3>
              <div className="space-y-4">
                {[
                  { label: 'Advances', val: adv.advances, color: 'text-positive' },
                  { label: 'Declines', val: adv.declines, color: 'text-red-600/70' },
                  { label: 'Unchanged', val: adv.unChanged, color: 'text-muted' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[11px] text-muted">{label}</span>
                    <span className={`text-[20px] font-inter font-light ${color}`}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 h-1 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-positive rounded-full" style={{ width: `${advPct}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-muted mt-1.5 uppercase tracking-wider">
                <span>{advPct}% positive</span><span>{100 - advPct}% negative</span>
              </div>
            </div>
          )}

          {/* Index Info */}
          {m && (
            <div className="bg-surface p-5 academic-shadow">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-4">Index Info</h3>
              <div className="space-y-3 text-[13px]">
                {[
                  { l: 'Constituents', v: m.numberOfConstituents },
                  { l: 'Launch Date', v: m.launchDate },
                  { l: 'Base Date', v: m.baseDate },
                  { l: 'Identifier', v: m.indexIdentifier },
                ].map(item => (
                  <div key={item.l} className="flex justify-between">
                    <span className="text-muted">{item.l}</span>
                    <span className="font-medium text-right">{item.v ?? '—'}</span>
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
