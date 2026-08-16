import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { stocksApi, indexApi } from '../../lib/api';
import { StockSearchResponse, IndexSearchResponse } from '../../types';

export const StockSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<StockSearchResponse | null>(null);
  const [indexData, setIndexData] = useState<IndexSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doSearch = (q: string) => {
    if (q.length < 1) { setData(null); setIndexData(null); setError(''); return; }
    setLoading(true);
    setError('');
    Promise.all([
      stocksApi.search(q, 0, 15).then(r => r.data).catch(() => null),
      indexApi.search(q).then(r => r.data).catch(() => null),
    ])
      .then(([stocks, indices]) => {
        setData(stocks);
        setIndexData(indices);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setIndexData(null);
        setError('Search failed. Is the backend running?');
        setLoading(false);
      });
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const stockCount = data?.content?.length ?? 0;
  const indexCount = indexData?.indexSearchDTOList?.length ?? 0;
  const totalCount = stockCount + indexCount;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-heading font-light tracking-tight text-primary">Search</h1>
        <p className="text-[11px] text-muted tracking-[0.15em] uppercase mt-2 font-medium">
          Search across all <span className="text-accent font-medium">NSE</span> and <span className="text-amber-500 dark:text-amber-400 font-medium">BSE</span> equities and indices
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or symbol..."
          className="w-full bg-surface text-[14px] pl-11 pr-4 py-3 border border-border outline-none focus:border-border font-sans rounded-none text-primary placeholder:text-muted transition-colors"
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

      {!loading && query.length === 0 && (
        <p className="text-[13px] text-muted py-8 text-center">Start typing to search for stocks and indices...</p>
      )}

      {(data || indexData) && !loading && (
        <div className="bg-surface border border-border-light p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-light">
            <span className="text-[10px] text-muted tracking-widest uppercase font-medium">
              {totalCount} result{totalCount !== 1 ? 's' : ''} found
            </span>
          </div>

          {stockCount > 0 && (
            <>
              <div className="text-[9px] text-muted tracking-widest uppercase font-medium mb-2">Stocks</div>
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
                          <span className={`text-[10px] font-mono font-medium ${
                            s.exchange === 'BSE' ? 'text-amber-500 dark:text-amber-400' : 'text-accent'
                          }`}>{s.exchange}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {stockCount > 0 && indexCount > 0 && <div className="border-t border-border-light my-5" />}

          {indexCount > 0 && (
            <>
              <div className="text-[9px] text-muted tracking-widest uppercase font-medium mb-2">Indices</div>
              <table className="w-full text-[13px] font-sans">
                <thead>
                  <tr className="text-[9px] text-muted tracking-widest uppercase text-left">
                    <th className="pb-3 font-medium">NAME</th>
                    <th className="pb-3 font-medium">SYMBOL</th>
                    <th className="pb-3 font-medium">EXCHANGE</th>
                    <th className="pb-3 font-medium">SEGMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {indexData!.indexSearchDTOList.map((idx) => (
                    <tr key={idx.instrumentKey} className="hover:bg-neutral transition-colors cursor-pointer border-t border-border-light"
                        onClick={() => navigate(`/index/${encodeURIComponent(idx.instrumentKey)}`, { state: idx })}>
                      <td className="py-3 font-medium text-primary">{idx.indexName}</td>
                      <td className="py-3 text-muted">{idx.indexSymbol}</td>
                      <td className="py-3">
                        <span className="text-[10px] font-mono font-medium text-accent">{idx.exchange}</span>
                      </td>
                      <td className="py-3 text-muted text-[12px]">{idx.segment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {totalCount === 0 && (
            <p className="text-[13px] text-muted text-center py-4">No stocks or indices found for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
};