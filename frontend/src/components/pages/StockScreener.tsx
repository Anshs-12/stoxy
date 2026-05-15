import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { ScreenerStockResult } from '../../types';
import { useScreener, ScreenerFilters } from '../../hooks/useScreener';

export const StockScreener = () => {
  const navigate = useNavigate();
  const {
    filters,
    setFilters,
    data,
    loading,
    error,
    hasSearched,
    screenStocks,
    handlePageChange,
    resetFilters
  } = useScreener();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    screenStocks({ ...filters, pageNumber: 0 });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-manrope font-light tracking-tight">Stock Screener</h1>
        <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
          Filter NSE equities by fundamental criteria
        </p>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSearch} className="bg-surface p-5 academic-shadow space-y-5">
        <h3 className="text-[10px] text-muted tracking-[0.12em] uppercase font-medium">Filter Parameters</h3>
        <div className="grid grid-cols-4 gap-5">
          {[
            { label: 'MIN P/E', key: 'minPe', placeholder: 'e.g. 10', type: 'number' },
            { label: 'MAX P/E', key: 'maxPe', placeholder: 'e.g. 50', type: 'number' },
            { label: 'SECTOR', key: 'sector', placeholder: 'e.g. Information Technology', type: 'text' },
            { label: 'INDUSTRY', key: 'industry', placeholder: 'e.g. IT - Software', type: 'text' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="text-[9px] text-muted uppercase tracking-widest block mb-2">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={filters[key as keyof ScreenerFilters] as string}
                onChange={(e) => setFilters(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-neutral text-[13px] px-3 py-2 border-none outline-none focus:bg-neutral font-inter placeholder:text-muted transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border-light">
          <div className="flex items-center gap-5 text-[11px]">
            {/* Sort By */}
            <div className="flex items-center gap-2 text-muted">
              <span>Sort:</span>
              <div className="flex">
                {[['stockName', 'Name'], ['stockSymbol', 'Symbol']].map(([val, label]) => (
                  <button key={val}
                    type="button"
                    onClick={() => setFilters(p => ({ ...p, sortBy: val }))}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors border border-border first:rounded-l last:rounded-r -ml-px ${
                      filters.sortBy === val
                        ? 'bg-primary text-base border-primary z-10'
                        : 'bg-surface text-muted hover:bg-neutral'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Sort Order */}
            <div className="flex items-center gap-2 text-muted">
              <span>Order:</span>
              <div className="flex">
                {[['asc', 'A → Z'], ['desc', 'Z → A']].map(([val, label]) => (
                  <button key={val}
                    type="button"
                    onClick={() => setFilters(p => ({ ...p, sortOrder: val }))}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors border border-border first:rounded-l last:rounded-r -ml-px ${
                      filters.sortOrder === val
                        ? 'bg-primary text-base border-primary z-10'
                        : 'bg-surface text-muted hover:bg-neutral'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetFilters}
              className="px-4 py-2 bg-neutral text-[12px] font-medium hover:bg-neutral/80 transition-colors">
              Reset
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-primary text-base text-[12px] font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              {loading ? 'Screening...' : 'Screen Stocks'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="text-sm text-red-600/70 text-center py-4">{error}</p>
      )}

      {/* Results */}
      {data && (
        <div className="bg-surface p-5 academic-shadow">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-border-light">
            <span className="text-[10px] text-muted tracking-widest uppercase font-medium">
              {data.totalElements} result{data.totalElements !== 1 ? 's' : ''}
            </span>
            {data.totalPages > 1 && (
              <div className="flex items-center gap-2 text-[11px]">
                <button disabled={data.pageNumber === 0}
                  onClick={() => handlePageChange(data.pageNumber - 1)}
                  className="px-3 py-1 bg-neutral disabled:opacity-30 hover:bg-neutral transition-colors">
                  ← Prev
                </button>
                <span className="text-muted">Page {data.pageNumber + 1} of {data.totalPages}</span>
                <button disabled={data.pageNumber >= data.totalPages - 1}
                  onClick={() => handlePageChange(data.pageNumber + 1)}
                  className="px-3 py-1 bg-neutral disabled:opacity-30 hover:bg-neutral transition-colors">
                  Next →
                </button>
              </div>
            )}
          </div>

          {data.content.length === 0 ? (
            <p className="text-[13px] text-muted py-8 text-center">
              No stocks match your filter criteria. Try widening the P/E range or changing sector.
            </p>
          ) : (
            <table className="w-full text-[13px] font-inter">
              <thead>
                <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                  <th className="pb-3 font-medium">SYMBOL</th>
                  <th className="pb-3 font-medium">NAME</th>
                  <th className="pb-3 font-medium">SECTOR</th>
                  <th className="pb-3 font-medium">INDUSTRY</th>
                  <th className="pb-3 font-medium text-right">P/E</th>
                  <th className="pb-3 font-medium text-right">SECTOR P/E</th>
                  <th className="pb-3 font-medium text-right">MARKET CAP (CR)</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s: ScreenerStockResult) => (
                  <tr key={s.stockSymbol}
                    className="hover:bg-neutral transition-colors cursor-pointer"
                    onClick={() => navigate(`/stocks/${s.stockSymbol}`)}>
                    <td className="py-3 font-medium">{s.stockSymbol}</td>
                    <td className="py-3 text-muted-heavy">{s.stockName}</td>
                    <td className="py-3 text-muted">{s.companyResponseDTO?.sector || '—'}</td>
                    <td className="py-3 text-muted">{s.companyResponseDTO?.industry || '—'}</td>
                    <td className="py-3 text-right">{s.stockFinancialsDTO?.pe?.toFixed(2) || '—'}</td>
                    <td className="py-3 text-right text-muted">{s.stockFinancialsDTO?.sectorPe?.toFixed(2) || '—'}</td>
                    <td className="py-3 text-right">{s.stockFinancialsDTO?.marketCap
                      ? (Number(s.stockFinancialsDTO.marketCap) / 1e7).toFixed(0)
                      : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="text-center py-16 text-muted">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-[13px]">Set your filters and click "Screen Stocks" to search</p>
        </div>
      )}
    </div>
  );
};
