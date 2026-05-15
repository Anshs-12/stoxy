import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useTheme } from '../../context/ThemeContext';
import { fmt, getChangeColor } from '../../lib/utils';

const fmtVol = (n: number) => n?.toLocaleString('en-IN') ?? '—';

const dayRangeChart = (low: number, high: number, last: number) => {
  if (!low || !high || low === high) return [];
  const steps = 8;
  return Array.from({ length: steps }, (_, i) => ({
    v: i === steps - 1 ? last : low + ((high - low) * i) / (steps - 1),
  }));
};

const Mini = ({ data, color }: { data: { v: number }[]; color: string }) => {
  if (!data.length) return <div className="h-16 w-full mt-3 bg-neutral" />;
  return (
    <div className="h-16 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                fillOpacity={1} fill={`url(#g-${color.replace('#', '')})`} isAnimationActive={false} />
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

  if (loading && indices.length === 0) return (
    <div className="flex items-center justify-center h-64 text-muted-heavy">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm font-inter">Loading market data...</span>
    </div>
  );

  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-600/80 font-inter mb-2">⚠ Connection Error</p>
      <p className="text-[13px] text-muted-heavy max-w-md mx-auto">{error}</p>
    </div>
  );

  const adv = indices[0]?.indexAdvanceDTO;
  const totalAD = (adv?.advances ?? 0) + (adv?.declines ?? 0);
  const advPct = totalAD > 0 ? Math.round((adv!.advances / totalAD) * 100) : 50;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-manrope font-normal tracking-tight">Stoxy Finance</h1>
          <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-semibold">
            Real-Time Equity Benchmarks
          </p>
        </div>
        <div className="flex items-end gap-6 text-right">
          <div>
            <p className="text-[10px] text-muted tracking-wider">Last Updated</p>
            <p className="text-[13px] font-semibold mt-0.5">{indices[0]?.time ?? '—'}</p>
          </div>
          <button onClick={refreshDashboard} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral hover:bg-neutral transition-colors text-[11px] font-semibold border border-border disabled:opacity-50 text-primary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {indices.map((idx, i) => {
          const p = idx.indexPriceInfoDTO;
          const isUp = (p?.change ?? 0) >= 0;
          const chart = dayRangeChart(p?.dayLow, p?.dayHigh, p?.lastPrice);
          return (
            <Link to={`/index/${encodeURIComponent(INDEX_SYMBOLS[i])}`} key={i} className="bg-surface p-5 academic-shadow block hover:ring-1 hover:ring-border transition-all group">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-manrope font-medium group-hover:underline">{idx.name}</span>
                <span className="text-lg font-inter font-medium">{fmt(p?.lastPrice)}</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-[10px] font-medium">
                <span className="text-muted tracking-wider">
                  {p?.totalTradedVolume ? `VOL: ${fmtVol(p.totalTradedVolume)}` : 'NSE INDEX'}
                </span>
                <span className={getChangeColor(p?.change)}>
                  {isUp ? '↗' : '↘'} {isUp ? '+' : ''}{fmt(p?.change)} ({isUp ? '+' : ''}{fmt(p?.pChange ?? p?.pchange)}%)
                </span>
              </div>
              <Mini data={chart} color={isUp ? (isDark ? '#4ADE80' : '#A5D6A7') : (isDark ? '#F87171' : '#EF9A9A')} />
            </Link>
          );
        })}
      </div>

      {adv && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-4 bg-neutral p-5">
            <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-6">Market Breadth</h3>
            <div className="flex justify-between items-end mb-5">
              <div>
                <div className="text-3xl font-inter font-light text-positive">{fmtVol(adv.advances)}</div>
                <div className="text-[9px] text-muted tracking-widest mt-1">ADVANCES</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-inter font-light text-muted">{fmtVol(adv.unChanged)}</div>
                <div className="text-[9px] text-muted tracking-widest mt-1">UNCHANGED</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-inter font-light">{fmtVol(adv.declines)}</div>
                <div className="text-[9px] text-muted tracking-widest mt-1">DECLINES</div>
              </div>
            </div>
            <div className="h-1 w-full bg-neutral rounded-full overflow-hidden flex mb-5">
              <div className="h-full bg-positive rounded-full" style={{ width: `${advPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <div><span className="text-primary block text-[11px]">{advPct}% Positive</span>Momentum</div>
              <div className="text-right"><span className="text-primary block text-[11px]">{100 - advPct}% Negative</span>Drag</div>
            </div>
          </div>

          <div className="col-span-8 bg-surface p-5 academic-shadow">
            <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-semibold mb-5">Index Overview</h3>
            <table className="w-full text-[13px] font-inter">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left font-semibold">
                  {['Index', 'Last', 'Open', 'Day High', 'Day Low', '52W High', 'Chg %'].map(h => (
                    <th key={h} className={`pb-3 font-medium ${h !== 'Index' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indices.map((idx, i) => {
                  const p = idx.indexPriceInfoDTO;
                  const pChg = p?.pChange ?? p?.pchange;
                  const isUp = (pChg ?? 0) >= 0;
                  return (
                    <tr key={i} onClick={() => navigate(`/index/${encodeURIComponent(INDEX_SYMBOLS[i])}`)} className="hover:bg-neutral transition-colors cursor-pointer group">
                      <td className="py-3 font-semibold group-hover:underline text-primary">{idx.name}</td>
                      <td className="py-3 text-right text-muted-heavy font-medium">{fmt(p?.lastPrice)}</td>
                      <td className="py-3 text-right text-muted-heavy">{fmt(p?.open)}</td>
                      <td className="py-3 text-right text-muted-heavy">{fmt(p?.dayHigh)}</td>
                      <td className="py-3 text-right text-muted-heavy">{fmt(p?.dayLow)}</td>
                      <td className="py-3 text-right text-muted-heavy">{fmt(p?.yearHigh)}</td>
                      <td className={`py-3 text-right font-semibold ${getChangeColor(pChg)}`}>
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

      <div className="pt-10 flex justify-between items-end text-[9px] text-muted tracking-wider border-t border-border-light">
        <div>
          <p className="font-semibold text-primary uppercase mb-1 text-[10px]">NSE Precision</p>
          <p>Live data sourced from NSE India via your Spring Boot backend.</p>
        </div>
        <div className="flex gap-5 uppercase">
          <span>Data Delayed ~15 mins</span>
        </div>
      </div>
    </div>
  );
};
