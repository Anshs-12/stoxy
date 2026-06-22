import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { stocksApi } from '../../lib/api';
import { StockSearchResponse } from '../../types';

export const StockSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<StockSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const doSearch = (q: string, p: number) => {
    if (q.length < 1) { setData(null); setError(''); return; }
    setLoading(true);
    setError('');
    stocksApi.search(q, p, 15)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setData(null); setError('Search failed. Is the backend running?'); setLoading(false); });
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(query, page), 300);
    return () => clearTimeout(t);
  }, [query, page]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Stock Search</h1>
        <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
          Search across all NSE-listed equities
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search by name or symbol..."
          className="w-full bg-surface text-[14px] pl-11 pr-4 py-3 border border-border outline-none focus:border-border font-sans rounded-xl text-primary placeholder:text-muted transition-colors"
          autoFocus />
      </div>

      {loading && (
        <div className="flex items-center text-muted py-8">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-accent" />
          <span className="text-[13px]">Searching...</span>
        </div>
      )}

      {error && (
        <p className="text-[13px] text-negative text-center py-4">{error}</p>
      )}

      {data && !loading && (
        <div className="bg-surface rounded-xl border border-border-light p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-light">
            <span className="text-[10px] text-muted tracking-widest uppercase font-medium">
              {data.content.length} result{data.content.length !== 1 ? 's' : ''} found
            </span>
            {/* pagination not supported by backend */}
          </div>
          <table className="w-full text-[13px] font-sans">
            <thead>
              <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                <th className="pb-3 font-medium">SYMBOL</th>
                <th className="pb-3 font-medium">NAME</th>
                <th className="pb-3 font-medium">COMPANY</th>
                <th className="pb-3 font-medium">EXCHANGE</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((s) => (
                <tr key={s.stockSymbol} className="hover:bg-neutral transition-colors cursor-pointer border-t border-border-light"
                    onClick={() => navigate(`/stocks/${s.stockSymbol}`, { state: s })}>
                  <td className="py-3">
                    <div className="font-medium text-primary">{s.stockSymbol}</div>
                    <div className="text-[10px] text-muted mt-0.5">{s.isin || ''}</div>
                  </td>
                  <td className="py-3 text-muted">{s.stockName}</td>
                  <td className="py-3 text-muted text-[12px]">{s.companyName || '—'}</td>
                  <td className="py-3">
                    {s.exchange && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        s.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-500' : 'bg-accent/15 text-accent'
                      }`}>{s.exchange}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!data && !loading && query.length === 0 && (
        <p className="text-[13px] text-muted py-8 text-center">Start typing to search for stocks...</p>
      )}
    </div>
  );
};