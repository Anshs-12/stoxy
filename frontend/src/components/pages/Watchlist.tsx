import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';

const fmt = (n?: number | null) =>
  n != null ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

export const Watchlist = () => {
  const navigate = useNavigate();
  const {
    lists,
    activeId,
    activeList,
    loading,
    detailLoading,
    error,
    searchResults,
    livePrices,
    livePricesLoading,
    loadDetail,
    createWatchlist,
    deleteWatchlist,
    addStock,
    removeStock,
    searchStocks
  } = useWatchlist();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleCreate = async () => {
    const success = await createWatchlist(newName);
    if (success) { setNewName(''); setShowCreate(false); }
  };

  const handleDelete = async (id: number) => {
    const success = await deleteWatchlist(id);
    if (success) setDeleteConfirmId(null);
  };

  const handleAddStock = async (symbol: string) => {
    const success = await addStock(symbol);
    if (success) setAddSymbol('');
  };

  useEffect(() => {
    const t = setTimeout(() => { searchStocks(addSymbol); }, 400);
    return () => clearTimeout(t);
  }, [addSymbol, searchStocks]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm font-sans">Loading watchlists...</span>
    </div>
  );

  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-negative font-sans mb-2">⚠ Authentication Required</p>
      <p className="text-[13px] text-muted max-w-md mx-auto mb-4">{error}</p>
      <a href="/api/v2/oauth2/authorization/google"
         className="inline-block px-5 py-2 bg-primary text-base text-[12px] font-medium hover:bg-primary/90 transition-colors">
        Login with Google
      </a>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Precision Assets</h1>
          <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
            Curated Watchlists & Tracking
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-accent text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-accent/90 transition-all rounded-lg shadow-ambient">
          <Plus className="h-3 w-3" /> Create Watchlist
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="bg-neutral rounded-xl p-5 flex gap-3 items-end border border-border-light">
          <div className="flex-1">
            <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">Watchlist Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full bg-surface text-[13px] px-3 py-2.5 border border-border outline-none focus:border-accent font-sans rounded-lg text-primary transition-colors"
              placeholder="e.g. Tech Growth" autoFocus />
          </div>
          <button onClick={handleCreate} className="px-4 py-2.5 bg-accent text-white text-[12px] font-semibold hover:bg-accent/90 rounded-lg transition-colors">Create</button>
          <button onClick={() => setShowCreate(false)} className="px-3 py-2.5 text-muted hover:text-primary rounded-lg hover:bg-neutral transition-colors"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Watchlist list */}
        <div className="col-span-4 space-y-2">
          {lists.length === 0 && (
            <p className="text-[13px] text-muted py-8 text-center">No watchlists yet. Create one to get started.</p>
          )}
          {lists.map(w => (
            <div key={w.watchlistId}>
              <button onClick={() => loadDetail(w.watchlistId)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  activeId === w.watchlistId
                    ? 'bg-surface border-accent/30 shadow-ambient'
                    : 'bg-surface border-border-light hover:border-border'
                }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {activeId === w.watchlistId && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    <span className="text-[13px] font-medium text-primary">{w.watchlistName}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(w.watchlistId); }}
                    className="text-muted hover:text-negative transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1">
                  Created {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </button>
              {deleteConfirmId === w.watchlistId && (
                <div className="bg-negative/10 p-3 flex justify-between items-center border border-negative/30">
                  <span className="text-[11px] text-negative flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3 w-3" /> Delete {w.watchlistName}?
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmId(null)} className="text-[11px] px-2 py-1 bg-surface border border-negative/30 text-negative hover:bg-negative/20 transition-colors">Cancel</button>
                    <button onClick={() => handleDelete(w.watchlistId)} className="text-[11px] px-2 py-1 bg-negative text-white hover:bg-negative/90 transition-colors">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Watchlist detail */}
        <div className="col-span-8">
          {!activeId && (
            <div className="text-center py-16 text-muted text-[13px]">
              Select a watchlist to view its stocks
            </div>
          )}

          {activeId && detailLoading && (
            <div className="flex items-center justify-center py-16 text-muted">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-[13px]">Loading...</span>
            </div>
          )}

          {activeId && !detailLoading && activeList && (
            <div className="bg-surface rounded-xl border border-border-light p-5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-heading font-medium">{activeList.watchlistName}</h3>
                  {livePricesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
                </div>
                {/* Add stock */}
                <div className="relative">
                  <input value={addSymbol} onChange={e => setAddSymbol(e.target.value)}
                    placeholder="+ Add stock..."
                    className="bg-neutral text-[12px] px-3 py-1.5 rounded w-44 border-none outline-none focus:bg-neutral placeholder:text-muted font-sans" />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full right-0 mt-1 bg-surface card-border border border-border-light rounded z-50 w-64 max-h-48 overflow-y-auto">
                      {searchResults.map((s) => (
                        <button key={s.stockSymbol} onClick={() => handleAddStock(s.stockSymbol)}
                          className="w-full text-left px-3 py-2 hover:bg-neutral transition-colors flex justify-between">
                          <span className="text-[12px]">{s.stockName}</span>
                          <span className="text-[10px] text-muted">{s.stockSymbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeList.watchlistStocks.length === 0 ? (
                <p className="text-[13px] text-muted py-8 text-center">No stocks in this watchlist. Use the search above to add.</p>
              ) : (
                <table className="w-full text-[13px] font-sans">
                  <thead>
                    <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                      <th className="pb-3 font-medium">SYMBOL</th>
                      <th className="pb-3 font-medium">NAME</th>
                      <th className="pb-3 font-medium text-right">ADDED AT</th>
                      <th className="pb-3 font-medium text-right">LIVE PRICE</th>
                      <th className="pb-3 font-medium text-right">CHG %</th>
                      <th className="pb-3 font-medium text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeList.watchlistStocks.map((s) => {
                      const live = livePrices[s.stockSymbol];
                      const pChg = live?.pChange ?? null;
                      const isUp = (pChg ?? 0) >= 0;
                      return (
                        <tr key={s.stockSymbol} className="hover:bg-neutral transition-colors group border-t border-border-light">
                          <td className="py-3">
                            <button onClick={() => navigate(`/stocks/${s.stockSymbol}`)}
                              className="font-medium text-primary hover:underline">{s.stockSymbol}</button>
                          </td>
                          <td className="py-3 text-muted text-[12px]">{s.stockName}</td>
                          <td className="py-3 text-right text-muted-heavy">
                            ₹{fmt(s.priceAddedAt)}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {live ? `₹${fmt(live.lastPrice)}` : (
                              <span className="text-muted text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {pChg != null ? (
                              <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-sm ${
                                isUp
                                  ? 'text-positive bg-positive/10'
                                  : 'text-negative bg-negative/10 dark:bg-negative/10'
                              }`}>
                                {isUp ? '+' : ''}{fmt(pChg)}%
                              </span>
                            ) : (
                              <span className="text-muted text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => removeStock(s.stockSymbol)}
                              className="text-muted hover:text-negative transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
