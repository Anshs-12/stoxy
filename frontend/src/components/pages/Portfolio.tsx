import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Minus, ChevronDown, List, RefreshCw, Download, X } from 'lucide-react';
import { stocksApi } from '../../lib/api';
import { PortfolioStock } from '../../types';
import { usePortfolio } from '../../hooks/usePortfolio';
import { fmt, fmtCr, getChangeColor } from '../../lib/utils';

interface TradeModalProps {
  type: 'buy' | 'sell';
  stock: PortfolioStock | null;
  onClose: () => void;
  onConfirm: (symbol: string, qty: number) => void;
  loadingLTP?: boolean;
}

const TradeModal = ({ type, stock, onClose, onConfirm, loadingLTP }: TradeModalProps) => {
  const [qtyStr, setQtyStr] = useState('1');
  if (!stock) return null;

  const qty = Math.max(1, parseInt(qtyStr, 10) || 1);
  const total = qty * (stock.LTP || 0);
  const overSell = type === 'sell' && qty > stock.totalQuantity;

  const handleQtyChange = (val: string) => {
    if (val === '' || /^\d+$/.test(val)) setQtyStr(val);
  };
  const handleQtyBlur = () => {
    const n = parseInt(qtyStr, 10);
    setQtyStr(String(Math.max(1, isNaN(n) || n <= 0 ? 1 : n)));
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface p-6 w-[400px] academic-shadow">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-base font-manrope font-medium">
              {type === 'buy' ? 'Buy' : 'Sell'} {stock.stockSymbol}
            </h3>
            {stock.stockName && (
              <p className="text-[11px] text-muted mt-0.5">{stock.stockName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-muted uppercase tracking-widest block mb-2">Quantity</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyStr}
              onChange={e => handleQtyChange(e.target.value)}
              onBlur={handleQtyBlur}
              placeholder="Enter quantity"
              className="w-full bg-neutral text-[22px] font-manrope font-light px-4 py-3 outline-none focus:bg-neutral transition-colors tracking-tight"
            />
            {type === 'sell' && (
              <p className="text-[10px] text-muted mt-1.5">
                You hold <span className="text-primary font-medium">{stock.totalQuantity}</span> shares
              </p>
            )}
            {overSell && (
              <p className="text-[11px] text-red-500 mt-1">Quantity exceeds holdings</p>
            )}
          </div>

          <div className="bg-neutral p-4 space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Last Traded Price</span>
              {loadingLTP ? (
                <span className="flex items-center gap-1.5 text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" /> fetching...
                </span>
              ) : (
                <span className="font-medium">₹{fmt(stock.LTP)}</span>
              )}
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Quantity</span>
              <span>{qty}</span>
            </div>
            <div className="flex justify-between text-[14px] font-medium border-t border-primary/8 pt-3 mt-1">
              <span>Estimated Total</span>
              <span>{loadingLTP ? '—' : `₹${fmt(total)}`}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-neutral text-[12px] font-medium hover:bg-neutral/80 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(stock.stockSymbol, qty)}
              disabled={overSell || loadingLTP}
              className={`flex-1 py-2.5 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                type === 'buy'
                  ? 'bg-primary text-base hover:bg-primary/90'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}>
              Confirm {type === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Portfolio = () => {
  const navigate = useNavigate();
  const {
    portfolio,
    loading,
    error,
    loadPortfolio,
    buyStock,
    sellStock,
    txHistory,
    txLoading,
    fetchTransactionHistory,
    exportPDF,
    buyResults,
    searchStocks
  } = usePortfolio();

  const [tradeModal, setTradeModal] = useState<{ type: 'buy' | 'sell'; stock: PortfolioStock | null } | null>(null);
  const [loadingLTP, setLoadingLTP] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const [selectedStockForTx, setSelectedStockForTx] = useState<string | null>(null);
  const [buySearch, setBuySearch] = useState('');
  const buyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (buySearch.length < 2) { return; }
    clearTimeout(buyTimerRef.current);
    buyTimerRef.current = setTimeout(() => {
      searchStocks(buySearch);
    }, 400);
    return () => clearTimeout(buyTimerRef.current);
  }, [buySearch, searchStocks]);

  const openBuyModal = (symbol: string, stockName: string, existingLTP?: number) => {
    const skeleton: PortfolioStock = { 
      stockSymbol: symbol, stockName, LTP: existingLTP || 0, 
      totalQuantity: 0, avgBuyingPrice: 0, currentValue: 0, 
      investedAmount: 0, unrealizedPnL: 0, unrealizedPnLPercent: 0, 
      dayPnL: 0, dayPnLPercent: 0 
    };
    
    setTradeModal({ type: 'buy', stock: skeleton });

    if (!existingLTP || existingLTP <= 0) {
      setLoadingLTP(true);
      stocksApi.getDetails(symbol)
        .then(r => {
          const ltp = r.data.stockPriceInfoDTO?.lastPrice ?? 0;
          setTradeModal(prev => prev ? { ...prev, stock: { ...skeleton, LTP: ltp } } : null);
        })
        .finally(() => setLoadingLTP(false));
    }
  };

  const handleTrade = async (symbol: string, quantity: number) => {
    const success = tradeModal?.type === 'buy'
      ? await buyStock(symbol, quantity)
      : await sellStock(symbol, quantity);
    
    if (success) {
      setTradeModal(null);
    }
  };

  const toggleTx = () => {
    if (!showTx || selectedStockForTx) {
      setSelectedStockForTx(null);
      fetchTransactionHistory();
      setShowTx(true);
    } else {
      setShowTx(false);
    }
  };

  const openStockTx = (symbol: string) => {
    if (selectedStockForTx === symbol && showTx) {
      setShowTx(false);
      setSelectedStockForTx(null);
      return;
    }
    setShowTx(true);
    setSelectedStockForTx(symbol);
    fetchTransactionHistory(symbol);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  if (loading && !portfolio) return (
    <div className="flex items-center justify-center h-64 text-muted">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm font-inter">Loading portfolio...</span>
    </div>
  );

  if (error && !portfolio) return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-manrope font-light tracking-tight">Portfolio</h1>
          <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">Holdings &amp; P&amp;L Analysis</p>
        </div>
        <button onClick={loadPortfolio} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral hover:bg-neutral transition-colors text-[11px] font-medium border border-border-light disabled:opacity-50 text-primary">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="text-center py-12 bg-surface academic-shadow">
        <p className="text-sm text-muted font-inter mb-6">{error}</p>
        <div className="relative inline-block">
          <input value={buySearch} onChange={e => setBuySearch(e.target.value)}
            placeholder="Search a stock to buy..."
            className="bg-neutral text-[13px] px-4 py-2.5 w-72 outline-none font-inter focus:bg-neutral transition-colors" />
          {buyResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-surface academic-shadow border border-border-light z-10 text-left">
              {buyResults.map((s, i) => (
                <button key={i} onClick={() => {
                  setBuySearch('');
                  openBuyModal(s.stockSymbol, s.stockName);
                }} className="w-full text-left px-4 py-2.5 hover:bg-neutral flex justify-between text-[13px]">
                  <span>{s.stockName}</span>
                  <span className="text-muted">{s.stockSymbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!portfolio) return null;

  const totalPnLPositive = (portfolio.totalUnrealizedPnL ?? 0) >= 0;
  const dayPnLPositive = (portfolio.totalDayPnL ?? 0) >= 0;

  return (
    <div className="space-y-8 pb-12">
      {tradeModal && (
        <TradeModal type={tradeModal.type} stock={tradeModal.stock} loadingLTP={loadingLTP}
          onClose={() => { setTradeModal(null); setLoadingLTP(false); }}
          onConfirm={handleTrade} />
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-manrope font-light tracking-tight">Portfolio</h1>
          <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
            Holdings &amp; P&amp;L Analysis
          </p>
        </div>
        <div className="flex items-end gap-4 text-right">
          <div className="relative">
            <input value={buySearch} onChange={e => setBuySearch(e.target.value)}
              placeholder="+ Buy a new stock..."
              className="bg-surface academic-shadow text-[12px] px-4 py-2 w-52 outline-none border border-border-light font-inter" />
            {buyResults.length > 0 && (
              <div className="absolute top-full right-0 w-64 bg-surface academic-shadow border border-border-light z-10">
                {buyResults.map((s, i) => (
                  <button key={i} onClick={() => {
                    setBuySearch('');
                    openBuyModal(s.stockSymbol, s.stockName);
                  }} className="w-full text-left px-4 py-2.5 hover:bg-neutral flex justify-between text-[12px]">
                    <span>{s.stockName}</span>
                    <span className="text-muted">{s.stockSymbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={loadPortfolio} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral hover:bg-neutral transition-colors text-[11px] font-medium border border-border-light disabled:opacity-50 text-primary">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'INVESTED', v: fmtCr(portfolio.totalInvestedValue), sub: null, color: '' },
          { l: 'CURRENT VALUE', v: fmtCr(portfolio.totalCurrentValue), sub: null, color: '' },
          {
            l: 'UNREALISED P&L',
            v: `${totalPnLPositive ? '+' : ''}${fmtCr(portfolio.totalUnrealizedPnL)}`,
            sub: `${totalPnLPositive ? '+' : ''}${fmt(portfolio.totalUnrealizedPnLPercent)}%`,
            color: getChangeColor(portfolio.totalUnrealizedPnL),
          },
          {
            l: "TODAY'S P&L",
            v: `${dayPnLPositive ? '+' : ''}${fmtCr(portfolio.totalDayPnL)}`,
            sub: `${dayPnLPositive ? '+' : ''}${fmt(portfolio.totalDayPnLPercent)}%`,
            color: getChangeColor(portfolio.totalDayPnL),
          },
        ].map((k, i) => (
          <div key={i} className="bg-surface p-4 academic-shadow">
            <p className="text-[9px] text-muted uppercase tracking-widest mb-2">{k.l}</p>
            <p className={`text-xl font-inter font-light ${k.color}`}>{k.v}</p>
            {k.sub && <p className={`text-[11px] mt-0.5 ${k.color}`}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div className="bg-surface p-5 academic-shadow">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
          <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
            Holdings ({portfolio.stocks?.length ?? 0})
          </h3>
          <button onClick={toggleTx}
            className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
            Transaction History <ChevronDown className={`h-3 w-3 transition-transform ${showTx ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {!portfolio.stocks?.length ? (
          <p className="text-[13px] text-muted py-8 text-center">No holdings yet.</p>
        ) : (
          <table className="w-full text-[13px] font-inter">
            <thead>
              <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                {['Symbol', 'Qty', 'Avg Buy', 'LTP', 'Invested', 'Current', 'P&L', 'P&L %', 'Day P&L', ''].map(h => (
                  <th key={h} className={`pb-3 font-medium ${h && h !== 'Symbol' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.stocks.map((s: PortfolioStock) => {
                const pnlPos = (s.unrealizedPnL ?? 0) >= 0;
                const dayPos = (s.dayPnL ?? 0) >= 0;
                return (
                  <tr key={s.stockSymbol} className="hover:bg-neutral transition-colors group">
                    <td className="py-3">
                      <button onClick={() => navigate(`/stocks/${s.stockSymbol}`)}
                        className="font-medium text-primary hover:underline text-left">
                        <div>{s.stockSymbol}</div>
                        <div className="text-[10px] text-muted font-normal">{s.stockName}</div>
                      </button>
                    </td>
                    <td className="py-3 text-right">{s.totalQuantity}</td>
                    <td className="py-3 text-right text-muted">₹{fmt(s.avgBuyingPrice)}</td>
                    <td className="py-3 text-right font-medium">₹{fmt(s.LTP)}</td>
                    <td className="py-3 text-right text-muted">₹{fmt(s.investedAmount)}</td>
                    <td className="py-3 text-right">₹{fmt(s.currentValue)}</td>
                    <td className={`py-3 text-right font-medium ${getChangeColor(s.unrealizedPnL)}`}>
                      {pnlPos ? '+' : ''}₹{fmt(s.unrealizedPnL)}
                    </td>
                    <td className={`py-3 text-right font-medium ${getChangeColor(s.unrealizedPnL)}`}>
                      {pnlPos ? '+' : ''}{fmt(s.unrealizedPnLPercent)}%
                    </td>
                    <td className={`py-3 text-right text-[11px] ${getChangeColor(s.dayPnL)}`}>
                      {dayPos ? '+' : ''}₹{fmt(s.dayPnL)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openStockTx(s.stockSymbol)}
                          title="Transactions" className="p-1 bg-neutral hover:bg-blue-100 transition-colors rounded">
                          <List className="h-3 w-3" />
                        </button>
                        <button onClick={() => setTradeModal({ type: 'buy', stock: s })}
                          title="Buy more" className="p-1 bg-neutral hover:bg-[#C7FFD8] transition-colors rounded">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => setTradeModal({ type: 'sell', stock: s })}
                          title="Sell" className="p-1 bg-neutral hover:bg-red-100 transition-colors rounded">
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sector Breakdown */}
      {portfolio.sectorBreakdown && Object.keys(portfolio.sectorBreakdown).length > 0 && (
        <div className="bg-surface p-5 academic-shadow">
          <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-5">Sector Allocation</h3>
          <div className="space-y-3">
            {Object.entries(portfolio.sectorBreakdown)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([sector, value]) => {
                const pct = portfolio.totalCurrentValue
                  ? Math.round((Number(value) / portfolio.totalCurrentValue) * 100)
                  : 0;
                return (
                  <div key={sector}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="font-medium">{sector}</span>
                      <span className="text-muted">{pct}% · {fmtCr(Number(value))}</span>
                    </div>
                    <div className="h-1 w-full bg-neutral rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 dark:bg-white/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {showTx && (
        <div className="bg-surface p-5 academic-shadow mt-4">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
            <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
              {selectedStockForTx ? `${selectedStockForTx} Transactions` : 'All Transactions'}
            </h3>
            <button onClick={exportPDF} title="Download Statement" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors rounded p-1.5 hover:bg-neutral">
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
          </div>
          {txLoading ? (
            <div className="flex items-center text-muted py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-[13px]">Loading...</span>
            </div>
          ) : txHistory && txHistory.length > 0 ? (
            <table className="w-full text-[13px] font-inter">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                  <th className="pb-3 font-medium">SYMBOL</th>
                  <th className="pb-3 font-medium">TYPE</th>
                  <th className="pb-3 font-medium text-right">QTY</th>
                  <th className="pb-3 font-medium text-right">PRICE</th>
                  <th className="pb-3 font-medium text-right">DATE</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((tx, i) => (
                  <tr key={i} className="hover:bg-neutral transition-colors">
                    <td className="py-2.5 font-medium">{tx.stockSymbol}</td>
                    <td className={`py-2.5 font-medium ${tx.transactionType === 'BUY' ? 'text-positive' : 'text-negative'}`}>
                      {tx.transactionType}
                    </td>
                    <td className="py-2.5 text-right">{tx.quantity}</td>
                    <td className="py-2.5 text-right text-muted-heavy">₹{fmt(tx.price)}</td>
                    <td className="py-2.5 text-right text-muted text-[11px]">
                      {new Date(tx.transactionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-muted py-6 text-center">No transactions yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
