import { useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { ShoppingCart, Loader2, ArrowLeft, X, ListPlus, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useStockDetails } from '../../hooks/useStockDetails';
import { fmt, getChangeColor, isMarketOpen } from '../../lib/utils';

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
    watchlists,
    wlLoading,
    addToWatchlist,
    buyStock,
    sellStock,
  } = useStockDetails(symbol, location.state);

  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [buyQtyStr, setBuyQtyStr] = useState('1');
  const [sellQtyStr, setSellQtyStr] = useState('1');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [wlOpen, setWlOpen] = useState(false);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      <span className="text-sm font-sans">Loading {symbol}...</span>
    </div>
  );

  if (error || !stock) return (
    <div className="text-center py-20">
      <p className="text-sm text-negative font-sans mb-2">⚠ Error</p>
      <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error || 'Stock not found.'}</p>
      <Link to="/" className="text-[12px] text-primary border-b border-primary pb-px">← Back to Dashboard</Link>
    </div>
  );

  const f = stock.stockFinancialsDTO;
  const c = stock.companyResponseDTO;
  const marketOpen = isMarketOpen();
  const ltpDisplay = ltp != null ? `₹${fmt(ltp)}` : '—';
  // Only show change if market is open and the change is meaningful (not 0.00)
  const change = marketOpen && ltp != null && cp != null ? ltp - cp : null;
  const pChange = change != null && cp != null && cp > 0 ? (change / cp) * 100 : null;
  const showChange = change != null && Math.abs(change) >= 0.01;
  const isUp = (change ?? 0) >= 0;
  const lttDisplay = ltt
    ? new Date(ltt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

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
    <div className="pb-12 space-y-6">
      <Link to="/" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Dashboard
      </Link>

      {/* ── HEADER ── */}
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-muted tracking-[0.12em] uppercase mb-2 font-medium">
            <span className={`inline-block px-1.5 py-px rounded text-[8px] font-bold mr-2 ${
              stock.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-500' : 'bg-accent/15 text-accent'
            }`}>{stock.exchange}</span>
            {stock.stockSymbol} · ISIN: {stock.isin}
          </p>
          <h1 className="text-3xl font-heading font-light tracking-tight leading-tight mb-2 text-primary">
            {stock.stockName}
          </h1>
          {c?.sector && (
            <p className="text-sm text-muted font-sans font-light">{c.sector}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-sans font-medium tracking-tight text-primary">{ltpDisplay}</div>
          {showChange && (
            <div className={`flex items-center gap-1 text-[13px] font-medium mt-0.5 ${getChangeColor(change)}`}>
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isUp ? '+' : ''}{fmt(change)} ({isUp ? '+' : ''}{pChange?.toFixed(2)}%)
            </div>
          )}
          <div className="text-[11px] text-muted mt-1 mb-4">
            {marketOpen ? 'vs prev close' : 'Last closing price'}
          </div>

          <div className="flex gap-2 relative justify-end">
            {/* Watchlist */}
            <div className="relative">
              <button
                onClick={() => { setWlOpen(v => !v); setBuyOpen(false); setSellOpen(false); }}
                disabled={wlLoading}
                className="px-3 py-2 bg-neutral text-[12px] font-medium hover:bg-neutral/80 transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-border-light rounded-lg"
              >
                {wlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                Watchlist
              </button>
              {wlOpen && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-surface border border-border-light rounded-lg z-20 text-left shadow-ambient overflow-hidden">
                  {watchlists.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-muted">No watchlists. Create one in the Watchlist tab.</div>
                  ) : (
                    watchlists.map(wl => (
                      <button key={wl.watchlistId}
                        onClick={() => { addToWatchlist(wl.watchlistId, wl.watchlistName); setWlOpen(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-neutral text-[12px] transition-colors truncate"
                      >
                        {wl.watchlistName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => { setBuyOpen(true); setSellOpen(false); setWlOpen(false); }}
              className="px-4 py-2 bg-accent text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-accent/90 transition-all rounded-lg"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Buy
            </button>
            <button
              onClick={() => { setSellOpen(true); setBuyOpen(false); setWlOpen(false); }}
              className="px-4 py-2 bg-surface text-primary text-[12px] font-medium hover:bg-neutral transition-colors border border-border rounded-lg"
            >
              Sell
            </button>
          </div>

          {/* Trade Panel */}
          {(buyOpen || sellOpen) && (
            <div className="mt-3 bg-surface border border-border-light rounded-xl p-4 text-left shadow-ambient w-72">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-medium uppercase tracking-widest">{buyOpen ? 'Buy' : 'Sell'} {symbol}</span>
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
                    className="w-full bg-neutral text-[20px] font-heading font-light px-3 py-2.5 outline-none rounded-lg text-primary"
                  />
                </div>
                <div className="bg-neutral rounded-lg p-3 space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">LTP</span>
                    <span className="font-medium text-primary">{ltpDisplay}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border-light pt-2 text-primary">
                    <span>Estimated Total</span>
                    <span>{ltp ? `₹${fmt(tradeQty * ltp)}` : '—'}</span>
                  </div>
                </div>
                <button
                  onClick={buyOpen ? handleBuy : handleSell}
                  disabled={buyOpen ? buyLoading : sellLoading}
                  className={`w-full py-2.5 text-white text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-lg ${
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
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-12 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="col-span-8 space-y-6">

          {/* Chart Placeholder — upcoming feature */}
          <div className="bg-surface rounded-xl border border-border-light p-5 min-h-[220px] flex flex-col items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-muted/40" />
            <p className="text-[12px] text-muted font-sans">Price chart — coming soon</p>
          </div>

          {/* ── FINANCIALS ── */}
          {f && (
            <div className="bg-surface rounded-xl border border-border-light p-5">
              <h2 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-5">Key Fundamentals</h2>
              <div className="grid grid-cols-4 gap-5">
                {[
                  { l: 'P/E', v: f.pe?.toFixed(2) ?? '—', sub: `Sector ${f.sectorPe?.toFixed(2) ?? '—'}` },
                  { l: 'P/B', v: f.pb?.toFixed(2) ?? '—', sub: `Sector ${f.sectorPb?.toFixed(2) ?? '—'}` },
                  { l: 'ROA', v: f.roa != null ? `${f.roa.toFixed(2)}%` : '—', sub: `Sector ${f.sectorRoa?.toFixed(2) ?? '—'}%` },
                  { l: 'ROE', v: f.roe != null ? `${f.roe.toFixed(2)}%` : '—', sub: `Sector ${f.sectorRoe?.toFixed(2) ?? '—'}%` },
                ].map(item => (
                  <div key={item.l} className="border-l-2 border-accent/30 pl-4">
                    <div className="text-[8px] text-muted uppercase tracking-widest mb-1">{item.l}</div>
                    <div className="text-xl font-heading font-semibold text-primary">{item.v}</div>
                    <div className="text-[10px] text-muted mt-1">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ABOUT ── */}
          {c?.description && (
            <div className="bg-surface rounded-xl border border-border-light p-5">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-4">
                About {c.companyName || stock.stockName}
              </h3>
              <p className="text-[13px] text-muted leading-relaxed font-light">{c.description}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="col-span-4 space-y-4">

          {/* Live Price Card */}
          <div className="bg-neutral rounded-xl border border-border-light p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Live Price
              </h3>
              {/* Market status dot */}
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${marketOpen ? 'bg-positive animate-pulse' : 'bg-muted'}`} />
                <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
                  {marketOpen ? 'Live' : 'Closed'}
                </span>
              </div>
            </div>
            <div className="text-4xl font-heading font-light text-primary">{ltpDisplay}</div>
            {showChange && (
              <div className={`flex items-center gap-1 text-[12px] font-medium mt-1 ${getChangeColor(change)}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isUp ? '+' : ''}{fmt(change)} ({isUp ? '+' : ''}{pChange?.toFixed(2)}%)
              </div>
            )}
            {marketOpen && lttDisplay && (
              <p className="text-[10px] text-muted mt-2 font-mono">LTT: {lttDisplay}</p>
            )}
            {!marketOpen && ltp != null && (
              <p className="text-[10px] text-muted mt-2">As of market close</p>
            )}
            {ltp == null && (
              <p className="text-[10px] text-muted mt-2">Market may be closed</p>
            )}
          </div>

          {/* Stock Info Card */}
          <div className="bg-neutral rounded-xl border border-border-light p-5">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-4">Stock Info</h3>
            <div className="space-y-3.5">
              {([
                ['Company', c?.companyName],
                ['Symbol', stock.stockSymbol],
                ['Exchange', stock.exchange],
                ['ISIN', stock.isin],
                ['Sector', c?.sector],
                ['Sector MCap', c?.sectorMarketCap],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-2">
                  <span className="text-[11px] text-muted font-light flex-shrink-0">{k}</span>
                  <span className="text-[11px] font-medium text-primary text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
