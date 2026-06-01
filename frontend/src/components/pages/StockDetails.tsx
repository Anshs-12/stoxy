import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Loader2, ArrowLeft, X, ListPlus } from 'lucide-react';
import { useStockDetails } from '../../hooks/useStockDetails';
import { useTheme } from '../../context/ThemeContext';
import { fmt, fmtCr, getChangeColor } from '../../lib/utils';

const makeDayChart = (low: number, high: number, last: number) => {
  if (!low || !high || low === high) return [];
  const steps = 10;
  return Array.from({ length: steps }, (_, i) => ({
    v: i === steps - 1 ? last : low + ((high - low) * i) / (steps - 1),
  }));
};

export const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { isDark } = useTheme();
  const {
    stock,
    loading,
    error,
    watchlists,
    wlLoading,
    addToWatchlist,
    buyStock,
    sellStock
  } = useStockDetails(symbol);

  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [buyQtyStr, setBuyQtyStr] = useState('1');
  const [sellQtyStr, setSellQtyStr] = useState('1');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [wlOpen, setWlOpen] = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm font-sans">Loading {symbol}...</span>
    </div>
  );

  if (error || !stock) return (
    <div className="text-center py-20">
      <p className="text-sm text-negative font-sans mb-2">⚠ Error</p>
      <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error}</p>
      <Link to="/" className="text-[12px] text-primary border-b border-primary pb-px">← Back to Dashboard</Link>
    </div>
  );

  const p = stock.stockPriceInfoDTO;
  const f = stock.stockFinancialsDTO;
  const c = stock.companyResponseDTO;
  const isUp = p.change >= 0;
  const weekRange = p.weekHigh - p.weekLow;
  const currentPos = weekRange > 0 ? ((p.lastPrice - p.weekLow) / weekRange) * 100 : 50;

  const handleBuy = async () => {
    setBuyLoading(true);
    const qty = parseInt(buyQtyStr, 10);
    if (!qty || qty <= 0) { setBuyLoading(false); return; }
    const success = await buyStock(qty);
    if (success) setBuyOpen(false);
    setBuyLoading(false);
  };

  const handleSell = async () => {
    setSellLoading(true);
    const qty = parseInt(sellQtyStr, 10);
    if (!qty || qty <= 0) { setSellLoading(false); return; }
    const success = await sellStock(qty);
    if (success) setSellOpen(false);
    setSellLoading(false);
  };

  const chartData = makeDayChart(p.dayLow, p.dayHigh, p.lastPrice);

  return (
    <div className="pb-12 space-y-8">
      <Link to="/" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Dashboard
      </Link>

      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 max-w-lg">
          <p className="text-[9px] text-muted tracking-[0.12em] uppercase mb-3">
            {stock.listedExchangeName}: {stock.stockSymbol} &bull; {c.sector} &bull; {c.industry}
          </p>
          <h1 className="text-3xl font-heading font-light tracking-tight leading-tight mb-3">
            {stock.stockName}
          </h1>
          <p className="text-sm text-muted font-sans font-light leading-relaxed">
            {c.subIndustry} &bull; Listed since {c.listingDate} &bull; ISIN: {c.isIN}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-sans font-medium tracking-tight">₹{fmt(p.lastPrice)}</div>
          <div className={`text-[13px] font-medium mt-1 mb-4 ${getChangeColor(p.change)}`}>
            {isUp ? '↗' : '↘'} {isUp ? '+' : ''}{fmt(p.change)} ({isUp ? '+' : ''}{fmt(p.pChange)}%)
          </div>
          <div className="flex gap-2 relative justify-end">
            <div className="relative">
              <button onClick={() => { setWlOpen(v => !v); setBuyOpen(false); setSellOpen(false); }} disabled={wlLoading}
                className="px-4 py-2 bg-neutral text-[12px] font-medium hover:bg-neutral/80 transition-colors flex items-center gap-1.5 disabled:opacity-50 h-full border border-transparent">
                {wlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                Add to Watchlist
              </button>
              {wlOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-surface card-border border border-border-light z-20 text-left">
                  {watchlists.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-muted">No watchlists found. Create one in Watchlist tab.</div>
                  ) : (
                    watchlists.map(wl => (
                      <button key={wl.watchlistId} onClick={() => { addToWatchlist(wl.watchlistId, wl.watchlistName); setWlOpen(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral text-[12px] transition-colors truncate">
                        {wl.watchlistName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { setBuyOpen(true); setSellOpen(false); setWlOpen(false); }}
              className="px-4 py-2 bg-primary text-base text-[12px] font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors border border-transparent">
              <ShoppingCart className="h-3.5 w-3.5" /> Buy
            </button>
            <button onClick={() => { setSellOpen(true); setBuyOpen(false); setWlOpen(false); }}
              className="px-4 py-2 bg-surface text-primary text-[12px] font-medium flex items-center gap-1.5 hover:bg-neutral transition-colors border border-border">
              Sell
            </button>
          </div>

          {(buyOpen || sellOpen) && (
            <div className="mt-3 bg-surface border border-primary/8 p-4 card-border text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-muted uppercase tracking-widest">{buyOpen ? 'Buy' : 'Sell'} {symbol}</span>
                <button onClick={() => { setBuyOpen(false); setSellOpen(false); }} className="text-muted hover:text-primary">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">Quantity</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*"
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
                    className="w-full bg-neutral text-[18px] font-heading font-light px-3 py-2.5 outline-none focus:bg-neutral transition-colors" />
                </div>
                <div className="bg-neutral p-3 space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">LTP</span>
                    <span className="font-medium">₹{fmt(p.lastPrice)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-border-light pt-2">
                    <span>Estimated Total</span>
                    <span>₹{fmt((buyOpen ? parseInt(buyQtyStr, 10) || 1 : parseInt(sellQtyStr, 10) || 1) * p.lastPrice)}</span>
                  </div>
                </div>
                <button onClick={buyOpen ? handleBuy : handleSell} disabled={buyOpen ? buyLoading : sellLoading}
                  className={`w-full py-2.5 text-base text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${buyOpen ? 'bg-primary hover:bg-primary/90' : 'bg-negative hover:bg-negative/90'}`}>
                  {(buyLoading || sellLoading) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm {buyOpen ? 'Buy' : 'Sell'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-8">
          <div className="bg-surface p-5 card-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">Price Velocity</h3>
              <div className="flex gap-3 text-[10px] text-muted uppercase tracking-wider">
                {['1D','1W','1M','1Y','ALL'].map(t => (
                  <button key={t} className={t === '1M' ? 'text-primary border-b border-primary pb-0.5' : 'hover:text-primary transition-colors'}>{t}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-price" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? (isDark ? '#6bd6b4' : '#2E7D32') : (isDark ? '#ff6b6b' : '#DC2626')} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isUp ? (isDark ? '#6bd6b4' : '#2E7D32') : (isDark ? '#ff6b6b' : '#DC2626')} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={isUp ? (isDark ? '#6bd6b4' : '#2E7D32') : (isDark ? '#ff6b6b' : '#DC2626')} strokeWidth={1.5}
                        fillOpacity={1} fill="url(#g-price)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-heading font-light mb-5">Price & Trading Data</h2>
            <div className="grid grid-cols-4 gap-x-5 gap-y-6">
              {[
                { l: 'OPEN', v: `₹${fmt(p.open)}` },
                { l: 'PREVIOUS CLOSE', v: `₹${fmt(p.previousClose)}` },
                { l: 'DAY HIGH', v: `₹${fmt(p.dayHigh)}` },
                { l: 'DAY LOW', v: `₹${fmt(p.dayLow)}` },
                { l: 'UPPER CIRCUIT', v: `₹${fmt(p.upperCP)}` },
                { l: 'LOWER CIRCUIT', v: `₹${fmt(p.lowerCP)}` },
                { l: '52W HIGH', v: `₹${fmt(p.weekHigh)}`, sub: p.weekHighDate },
                { l: '52W LOW', v: `₹${fmt(p.weekLow)}`, sub: p.weekLowDate },
              ].map((item) => (
                <div key={item.l} className="text-primary border-t border-border-light pt-3">
                  <div className="text-[8px] text-muted uppercase tracking-widest mb-1.5 ">{item.l}</div>
                  <div className="text-base font-sans font-semibold text-primary">{item.v}</div>
                  {item.sub && <div className="text-[9px] text-muted mt-0.5 ">{item.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {c.aboutCompany && (
            <div className="pt-6 border-t border-border-light">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-4">About {c.companyName || stock.stockName}</h3>
              <div className="text-[13px] text-muted leading-relaxed font-light"
                   dangerouslySetInnerHTML={{ __html: c.aboutCompany.replace(/<[^>]*>/g, '') }} />
              {stock.stockWebsite && (
                <a href={stock.stockWebsite} target="_blank" rel="noopener noreferrer"
                   className="text-[12px] font-medium text-primary border-b border-primary pb-px inline-block mt-4">
                  Official Website ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-5">
          <div className="bg-neutral border border-border-light p-5">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-5">Valuation Core</h3>
            <div className="space-y-4 border-b border-border-light pb-5 mb-5">
              {[
                ['Market Cap', fmtCr(f.marketCap)],
                ['P/E Ratio', f.pe?.toFixed(2) || '—'],
                ['Sector P/E', f.sectorPe?.toFixed(2) || '—'],
                ['Face Value', `₹${f.faceValue || '—'}`],
                ['Issued Size', f.issuedSize?.toLocaleString('en-IN') || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-end ">
                  <span className="text-[13px] text-muted font-light">{k}</span>
                  <span className="text-base font-semibold text-primary">{v}</span>
                </div>
              ))}
            </div>

            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">Trading Range (52W)</h3>
            <div className="mb-1.5 h-1 w-full bg-neutral rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-primary/70 rounded-full" style={{ width: `${currentPos}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full ring-2 ring-surface"
                   style={{ left: `${currentPos}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-muted">
              <span>₹{fmt(p.weekLow)}</span>
              <span>₹{fmt(p.weekHigh)}</span>
            </div>
          </div>

          <div className="bg-neutral border border-border-light p-5">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-4">Stock Info</h3>
            <div className="space-y-3">
              {[
                ['EXCHANGE', stock.listedExchangeName],
                ['SECTOR', c.sector],
                ['INDUSTRY', c.industry],
                ['ISIN', c.isIN],
                ['LISTED', c.listingDate],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[8px] text-muted uppercase tracking-widest mb-0.5">{k}</p>
                  <p className="text-[13px] font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
