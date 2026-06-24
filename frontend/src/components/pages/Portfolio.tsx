import {useEffect, useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Loader2, Plus, Minus, ChevronDown, List, RefreshCw, Download, X} from 'lucide-react';
import {PortfolioStock} from '../../types';
import {usePortfolio} from '../../hooks/usePortfolio';
import {fmt, fmtCr, getChangeColor} from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { tickerApi } from '../../lib/api';

interface TradeModalProps {
    type: 'buy' | 'sell';
    stock: PortfolioStock | null;
    onClose: () => void;
    onConfirm: (symbol: string, qty: number) => void;
    loadingLTP?: boolean;
}

const TradeModal = ({type, stock, onClose, onConfirm, loadingLTP}: TradeModalProps) => {
    const [qtyStr, setQtyStr] = useState('1');
    if (!stock) return null;

    const qty = Math.max(1, parseInt(qtyStr, 10) || 1);
    const total = qty * (stock.ltp || 0);
    const overSell = type === 'sell' && qty > stock.totalQuantity;

    const handleQtyChange = (val: string) => {
        if (val === '' || /^\d+$/.test(val)) setQtyStr(val);
    };
    const handleQtyBlur = () => {
        const n = parseInt(qtyStr, 10);
        setQtyStr(String(Math.max(1, isNaN(n) || n <= 0 ? 1 : n)));
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl p-6 w-[400px] border border-border shadow-ambient">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-base font-heading font-semibold text-primary">
                            {type === 'buy' ? 'Buy' : 'Sell'} {stock.stockSymbol}
                        </h3>
                        {stock.stockName && (
                            <p className="text-[11px] text-muted mt-0.5">{stock.stockName}</p>
                        )}
                    </div>
                    <button onClick={onClose}
                            className="text-muted hover:text-primary transition-colors p-1 rounded-md hover:bg-neutral">
                        <X className="h-4 w-4"/>
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
                            className="w-full bg-neutral text-[22px] font-heading font-light px-4 py-3 outline-none rounded-lg focus:ring-1 focus:ring-border transition-colors tracking-tight text-primary"
                        />
                        {type === 'sell' && (
                            <p className="text-[10px] text-muted mt-1.5">
                                You hold <span className="text-primary font-medium">{stock.totalQuantity}</span> shares
                            </p>
                        )}
                        {overSell && (
                            <p className="text-[11px] text-negative mt-1">Quantity exceeds holdings</p>
                        )}
                    </div>

                    <div className="bg-neutral rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-[13px]">
                            <span className="text-muted">Last Traded Price</span>
                            {loadingLTP ? (
                                <span className="flex items-center gap-1.5 text-muted">
                  <Loader2 className="h-3 w-3 animate-spin"/> fetching...
                </span>
                            ) : (
                                <span className="font-medium text-primary">₹{fmt(stock.ltp)}</span>
                            )}
                        </div>
                        <div className="flex justify-between text-[13px]">
                            <span className="text-muted">Quantity</span>
                            <span className="text-primary">{qty}</span>
                        </div>
                        <div
                            className="flex justify-between text-[14px] font-semibold border-t border-border-light pt-3 mt-1 text-primary">
                            <span>Estimated Total</span>
                            <span>{loadingLTP ? '—' : `₹${fmt(total)}`}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose}
                                className="flex-1 py-2.5 bg-neutral text-[12px] font-medium hover:bg-neutral/80 transition-colors rounded-lg text-primary">
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(stock.stockSymbol, qty)}
                            disabled={overSell || loadingLTP}
                            className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors disabled:opacity-40 rounded-lg text-white ${
                                type === 'buy'
                                    ? 'bg-accent hover:bg-accent/90'
                                    : 'bg-negative hover:bg-negative/90'
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
    const { addToast } = useToast();
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
        if (buySearch.length < 2) {
            return;
        }
        clearTimeout(buyTimerRef.current);
        buyTimerRef.current = setTimeout(() => {
            searchStocks(buySearch);
        }, 400);
        return () => clearTimeout(buyTimerRef.current);
    }, [buySearch, searchStocks]);

    const openBuyModal = async (stockSymbol: string, stockName: string, instrumentKey?: string) => {
        let ltp = 0;
        if (instrumentKey) {
            try {
                const t = await tickerApi.getLtpc([instrumentKey]);
                const liveData = t.data as any;
                ltp = Number(liveData[instrumentKey]?.ltp) || 0;
            } catch {
                // non-fatal
            }
        }
        if (!ltp || ltp <= 0) {
            addToast('Live price unavailable. Try during market hours.', 'error');
            return;
        }
        const skeleton: PortfolioStock = {
            stockSymbol, stockName, ltp,
            totalQuantity: 0, avgBuyingPrice: 0, currentValue: 0,
            instrumentKey: instrumentKey || '',
            investedAmount: 0, unrealizedPnL: 0, unrealizedPnLPercent: 0,
            dayPnL: 0, dayPnLPercent: 0
        };
        setTradeModal({ type: 'buy', stock: skeleton });
    };

    const handleTrade = async (symbol: string, quantity: number) => {
        const stock = tradeModal?.stock;
        if (!stock) return;
        const price = stock.ltp || 0;
        const instrumentKey = stock.instrumentKey || '';
        const success = tradeModal?.type === 'buy'
            ? await buyStock(symbol, quantity, price, instrumentKey)
            : await sellStock(symbol, quantity, price, instrumentKey);
        if (success) setTradeModal(null);
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
            window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
        }, 100);
    };

    if (loading && !portfolio) return (
        <div className="flex items-center justify-center h-64 text-muted">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-accent"/>
            <span className="text-sm font-sans">Loading portfolio...</span>
        </div>
    );

    if (error && !portfolio) return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Portfolio</h1>
                    <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">Holdings &amp; P&amp;L
                        Analysis</p>
                </div>
                <button onClick={loadPortfolio} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border hover:border-border text-[11px] font-medium disabled:opacity-50 text-primary rounded-lg transition-all">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
                    Refresh
                </button>
            </div>
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
                <p className="text-sm text-muted font-sans mb-6">{error}</p>
                <div className="relative inline-block">
                    <input value={buySearch} onChange={e => setBuySearch(e.target.value)}
                           placeholder="Search a stock to buy..."
                           className="bg-neutral text-[13px] px-4 py-2.5 w-72 outline-none font-sans rounded-lg border border-border focus:border-accent transition-colors text-primary"/>
                    {buyResults.length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 bg-neutral border border-border rounded-lg z-10 text-left shadow-ambient mt-1">
                            {buyResults.map((s) => (
                                <button key={s.stockSymbol} onClick={() => {
                                    setBuySearch('');
                                    openBuyModal(s.stockSymbol, s.stockName, s.instrumentKey);
                                }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-neutral flex justify-between text-[13px] text-primary transition-colors">
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
        <div className="space-y-6 pb-12">
            {tradeModal && (
                <TradeModal type={tradeModal.type} stock={tradeModal.stock} loadingLTP={loadingLTP}
                            onClose={() => {
                                setTradeModal(null);
                                setLoadingLTP(false);
                            }}
                            onConfirm={handleTrade}/>
            )}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Portfolio</h1>
                    <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
                        Holdings &amp; P&amp;L Analysis
                    </p>
                </div>
                <div className="flex items-end gap-3 text-right">
                    <div className="relative">
                        <input value={buySearch} onChange={e => setBuySearch(e.target.value)}
                               placeholder="+ Buy a new stock..."
                               className="bg-surface border border-border text-[12px] px-4 py-2 w-52 outline-none font-sans rounded-lg focus:border-accent transition-colors text-primary"/>
                        {buyResults.length > 0 && (
                            <div
                                className="absolute top-full right-0 w-64 bg-neutral border border-border rounded-lg z-10 shadow-ambient mt-1">
                                {buyResults.map((s) => (
                                    <button key={s.stockSymbol} onClick={() => {
                                        setBuySearch('');
                                        openBuyModal(s.stockSymbol, s.stockName, s.instrumentKey);
                                    }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-neutral flex justify-between text-[12px] text-primary transition-colors">
                                        <span>{s.stockName}</span>
                                        <span className="text-muted">{s.stockSymbol}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={loadPortfolio} disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border hover:border-border text-[11px] font-medium disabled:opacity-50 text-primary rounded-lg transition-all">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    {l: 'INVESTED', v: fmtCr(portfolio.totalInvestedValue), sub: null, color: ''},
                    {l: 'CURRENT VALUE', v: fmtCr(portfolio.totalCurrentValue), sub: null, color: ''},
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
                ].map((k) => (
                    <div key={k.l} className="bg-surface p-5 rounded-xl border border-border-light">
                        <p className="text-[9px] text-muted uppercase tracking-widest mb-2">{k.l}</p>
                        <p className={`text-2xl font-heading font-light tracking-tight ${k.color || 'text-primary'}`}>{k.v}</p>
                        {k.sub && <p className={`text-[11px] mt-1 font-medium ${k.color}`}>{k.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Holdings Table */}
            <div className="bg-surface rounded-xl border border-border-light p-5">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
                    <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
                        Holdings ({portfolio.stocks?.length ?? 0})
                    </h3>
                    <button onClick={toggleTx}
                            className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors">
                        Transaction History <ChevronDown
                        className={`h-3 w-3 transition-transform ${showTx ? 'rotate-180' : ''}`}/>
                    </button>
                </div>

                {!portfolio.stocks?.length ? (
                    <p className="text-[13px] text-muted py-8 text-center">No holdings yet.</p>
                ) : (
                    <table className="w-full text-[13px] font-sans">
                        <thead>
                        <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                            {['Symbol', 'Qty', 'Avg Buy', 'LTP', 'Invested', 'Current', 'P&L', 'P&L %', 'Day P&L', ''].map(h => (
                                <th key={h}
                                    className={`pb-3 font-medium ${h && h !== 'Symbol' ? 'text-right' : ''}`}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {portfolio.stocks.map((s: PortfolioStock) => {
                            const pnlPos = (s.unrealizedPnL ?? 0) >= 0;
                            const dayPos = (s.dayPnL ?? 0) >= 0;
                            return (
                                <tr key={s.stockSymbol}
                                    className="hover:bg-neutral transition-colors group border-t border-border-light">
                                    <td className="py-3">
                                        <button onClick={() => navigate(`/stocks/${s.stockSymbol}`)}
                                                className="font-medium text-primary hover:text-accent transition-colors text-left">
                                            <div>{s.stockSymbol}</div>
                                            <div className="text-[10px] text-muted font-normal">{s.stockName}</div>
                                        </button>
                                    </td>
                                    <td className="py-3 text-right text-primary">{s.totalQuantity}</td>
                                    <td className="py-3 text-right text-muted">₹{fmt(s.avgBuyingPrice)}</td>
                                    <td className="py-3 text-right font-medium text-primary">₹{fmt(s.ltp)}</td>
                                    <td className="py-3 text-right text-muted">₹{fmt(s.investedAmount)}</td>
                                    <td className="py-3 text-right text-primary">₹{fmt(s.currentValue)}</td>
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
                                        <div
                                            className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openStockTx(s.stockSymbol)}
                                                    title="Transactions"
                                                    className="p-1.5 bg-neutral hover:bg-border-light transition-colors rounded-md">
                                                <List className="h-3 w-3 text-muted"/>
                                            </button>
                                            <button onClick={() => setTradeModal({type: 'buy', stock: s})}
                                                    title="Buy more"
                                                    className="p-1.5 bg-positive/10 hover:bg-positive/20 transition-colors rounded-md">
                                                <Plus className="h-3 w-3 text-positive"/>
                                            </button>
                                            <button onClick={() => setTradeModal({type: 'sell', stock: s})}
                                                    title="Sell"
                                                    className="p-1.5 bg-negative/10 hover:bg-negative/20 transition-colors rounded-md">
                                                <Minus className="h-3 w-3 text-negative"/>
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
                <div className="bg-surface rounded-xl border border-border-light p-5">
                    <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium mb-5">Sector
                        Allocation</h3>
                    <div className="space-y-4">
                        {Object.entries(portfolio.sectorBreakdown)
                            .sort(([, a], [, b]) => Number(b) - Number(a))
                            .map(([sector, value]) => {
                                const pct = portfolio.totalCurrentValue
                                    ? Math.round((Number(value) / portfolio.totalCurrentValue) * 100)
                                    : 0;
                                return (
                                    <div key={sector}>
                                        <div className="flex justify-between text-[12px] mb-1.5">
                                            <span className="font-medium text-primary">{sector}</span>
                                            <span className="text-muted">{pct}% · {fmtCr(Number(value))}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent/70 rounded-full transition-all duration-700"
                                                style={{width: `${pct}%`}}/>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Transaction History */}
            {showTx && (
                <div className="bg-surface rounded-xl border border-border-light p-5">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
                        <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">
                            {selectedStockForTx ? `${selectedStockForTx} Transactions` : 'All Transactions'}
                        </h3>
                        <button onClick={exportPDF} title="Download Statement"
                                className="flex items-center gap-1.5 text-[11px] text-muted hover:text-primary transition-colors rounded-md p-1.5 hover:bg-neutral">
                            <Download className="h-3.5 w-3.5"/> Export PDF
                        </button>
                    </div>
                    {txLoading ? (
                        <div className="flex items-center text-muted py-8 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-accent"/>
                            <span className="text-[13px]">Loading...</span>
                        </div>
                    ) : txHistory && txHistory.length > 0 ? (
                        <table className="w-full text-[13px] font-sans">
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
                                <tr key={`${tx.stockSymbol}-${tx.transactionAt}-${i}`}
                                    className="hover:bg-neutral transition-colors border-t border-border-light">
                                    <td className="py-2.5 font-medium text-primary">{tx.stockSymbol}</td>
                                    <td className={`py-2.5 font-semibold text-[12px] ${tx.type === 'BUY' ? 'text-positive' : 'text-negative'}`}>
                                        {tx.type}
                                    </td>
                                    <td className="py-2.5 text-right text-primary">{tx.quantity}</td>
                                    <td className="py-2.5 text-right text-muted-heavy">₹{fmt(tx.price)}</td>
                                    <td className="py-2.5 text-right text-muted text-[11px]">
                                        {new Date(tx.transactionAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
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
