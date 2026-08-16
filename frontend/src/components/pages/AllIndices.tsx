import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, RefreshCw } from 'lucide-react';
import { indexApi, tickerApi } from '../../lib/api';
import { marketSocket } from '../../lib/marketSocket';
import { getPrevClose } from '../../lib/prevClose';
import { usePrevCloseFix, recomputeChange } from '../../hooks/usePrevCloseFix';
import type { IndexSearchResult, LtpcData } from '../../types';
import { fmt, getChangeColor } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { MiniChart } from '../../components/ui/MiniChart';

// Known NSE/BSE indices — search the upstream API for each to discover
// instrument keys dynamically. We also include broader "catch-all" queries
// (e.g. "NIFTY", "SENSEX") so the upstream fuzzy search can surface any
// indices we missed from the explicit list.
const ALL_INDICES = [
  // Catch-all queries (pull everything that fuzzy-matches these prefixes)
  'NIFTY', 'SENSEX',
  // Broad market
  'NIFTY 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500', 'NIFTY MIDCAP 50',
  'NIFTY MIDCAP 100', 'NIFTY SMALLCAP 100', 'NIFTY SMALLCAP 250', 'NIFTY LARGEMIDCAP 250',
  'SENSEX 50',
  // Sectoral
  'NIFTY BANK', 'NIFTY AUTO', 'NIFTY FINANCIAL SERVICES', 'NIFTY FMCG', 'NIFTY IT',
  'NIFTY MEDIA', 'NIFTY METAL', 'NIFTY PHARMA', 'NIFTY PSU BANK', 'NIFTY PRIVATE BANK',
  'NIFTY REALTY', 'NIFTY ENERGY', 'NIFTY HEALTHCARE',
  // Thematic
  'NIFTY INFRASTRUCTURE', 'NIFTY COMMODITIES', 'NIFTY CONSUMPTION', 'NIFTY CPSE',
  'NIFTY GROWTH SECTORS 15', 'NIFTY 100 ESG', 'NIFTY 50 SHARIAH',
  // Strategy
  'NIFTY 50 EQUAL WEIGHT', 'NIFTY 100 LOW VOLATILITY 30', 'NIFTY 100 QUALITY 30',
  'NIFTY DIVIDEND OPPORTUNITIES 50', 'NIFTY 50 VALUE 20', 'NIFTY 100 ALPHA 30',
];

// Indices that may be returned by fuzzy search but don't exist on
// NSE/BSE / aren't tracked by the upstream feed (SGX is Singapore
// Exchange — no LTPC). We skip them defensively when iterating results.
const BLOCKED_INDEX_TOKENS = ['SGX', 'SGX NIFTY', 'GIFT', 'GIFT NIFTY'];

interface IndexRow extends IndexSearchResult {
  ltp: number | null;
  cp: number | null;
  change: number | null;
  pChange: number | null;
}

type SortKey = 'name' | 'ltp' | 'change' | 'pChange';

/**
 * Procedurally generated sparkline points based on the current % change.
 * Uses a deterministic seeded walk so the curve is stable across re-renders
 * but visually reflects whether the index is up or down.
 */
function generateSparkPoints(pChange: number | null, key: string): string {
  // Seeded RNG so each card has a stable, distinct line
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) & 0xffff;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const N = 16;
  const up = (pChange ?? 0) >= 0;
  // Bias the walk: positive drift if up, negative if down
  const drift = up ? 0.5 : -0.5;
  const pts: [number, number][] = [];
  let val = 12;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    val += drift + (rand() - 0.5) * 4;
    // End points slightly toward the direction of the trend
    if (i === N - 1) {
      val = up ? 4 : 20;
    }
    pts.push([t * 100, Math.max(2, Math.min(22, val))]);
  }
  return pts.map(p => `${p[0]},${p[1]}`).join(' ');
}

export const AllIndices = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [indices, setIndices] = useState<IndexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('pChange');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const seen = new Set<string>();
        const found: IndexSearchResult[] = [];
        const results = await Promise.allSettled(
          ALL_INDICES.map(q => indexApi.search(q))
        );
        for (const r of results) {
          if (r.status !== 'fulfilled') continue;
          const list = r.value.data.indexSearchDTOList ?? [];
          for (const item of list) {
            // Catch-all queries (e.g. "NIFTY") can match equity / F&O
            // instruments that share the name. Filter to real indices only.
            const isIndex = (item.segment ?? '').toUpperCase().includes('INDEX');
            if (!isIndex) continue;
            // Skip known non-existent / non-NSE indices (e.g. SGX NIFTY
            // lives on Singapore Exchange and has no live ticker feed).
            const nameUpper = (item.indexName ?? '').toUpperCase();
            if (BLOCKED_INDEX_TOKENS.some(tok => nameUpper.includes(tok))) continue;
            if (!seen.has(item.instrumentKey)) {
              seen.add(item.instrumentKey);
              found.push(item);
            }
          }
        }

        if (cancelled) return;

        if (found.length === 0) {
          setError('No indices found. The index data may not be seeded yet.');
          setIndices([]);
          return;
        }

        const keys = found.map(i => i.instrumentKey);
        let liveMap: Record<string, LtpcData> = {};
        try {
          // Chunk into small batches — some backends reject (or rate-limit)
          // long instrumentKeyList query strings. 12 keys/request keeps us
          // well under typical limits while staying parallel-friendly.
          const BATCH = 12;
          const batches: string[][] = [];
          for (let i = 0; i < keys.length; i += BATCH) {
            batches.push(keys.slice(i, i + BATCH));
          }
          const batchResults = await Promise.allSettled(
            batches.map(batch => tickerApi.getLtpc(batch))
          );
          for (const r of batchResults) {
            if (r.status !== 'fulfilled') continue;
            Object.assign(liveMap, r.value.data ?? {});
          }
        } catch {
          liveMap = {};
        }
        if (cancelled) return;

        setIndices(
          found.map(item => {
            const live = liveMap[item.instrumentKey];
            const ltp = live?.ltp ?? null;
            const cp = live?.cp ?? null;
            const prevClose = getPrevClose(item.instrumentKey, cp, ltp);
            const change = ltp != null && prevClose != null ? ltp - prevClose : null;
            const pChange = prevClose != null && prevClose > 0 && change != null
              ? (change / prevClose) * 100
              : null;
            return { ...item, ltp, cp, change, pChange };
          })
        );
      } catch (err: any) {
        if (!cancelled) {
          setError('Could not load indices. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshTick]);

  // Live updates via WebSocket
  useEffect(() => {
    if (indices.length === 0) return;
    const keys = indices.map(i => i.instrumentKey);
    const wsUnsub = marketSocket.subscribe(keys, 'ltpc');
    const tickUnsub = marketSocket.addTickListener(msg => {
      const key = msg.instrumentKey;
      if (!key) return;
      const ltp = msg.ltp;
      if (ltp == null) return;

      setIndices(prev =>
        prev.map(idx => {
          if (idx.instrumentKey !== key) return idx;
          const cpVal = msg.cp ?? idx.cp ?? ltp;
          const change = ltp - cpVal;
          const pChange = cpVal > 0 ? (change / cpVal) * 100 : 0;
          return { ...idx, ltp, cp: cpVal, change, pChange };
        })
      );
    });
    return () => {
      wsUnsub();
      tickUnsub();
    };
  }, [indices.length]);

  // ── Previous-close repair: fills stale cp (cp == ltp on closed days)
  // from candle history once per day, then patches change/pChange. ──
  usePrevCloseFix(indices, setIndices, i => i.instrumentKey, i => ({ cp: i.cp, ltp: i.ltp }), recomputeChange);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = indices;
    if (q) {
      rows = rows.filter(i =>
        i.indexName.toLowerCase().includes(q) ||
        i.exchange.toLowerCase().includes(q)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === 'name') return a.indexName.localeCompare(b.indexName) * dir;
      const av = (a[sortBy] ?? -Infinity) as number;
      const bv = (b[sortBy] ?? -Infinity) as number;
      return (av - bv) * dir;
    });
    return rows;
  }, [indices, query, sortBy, sortDir]);

  const reload = () => {
    setRefreshTick(t => t + 1);
  };

  const onSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const upCount = indices.filter(i => (i.pChange ?? 0) >= 0).length;
  const dnCount = indices.length - upCount;

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <Link to="/" className="text-[11px] font-mono text-muted hover:text-accent transition-colors inline-flex items-center gap-1 mb-3">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-heading font-light tracking-tight text-primary">All Indices</h1>
          <p className="text-[12px] font-mono text-muted mt-1.5">
            {indices.length} indices · <span className="text-positive">{upCount} advancing</span> · <span className="text-negative">{dnCount} declining</span>
          </p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search & Sort row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or exchange…"
            className="w-full bg-surface border border-border-light text-[12px] font-mono text-primary placeholder-muted pl-9 pr-3 py-2 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span>Sort</span>
          {(['pChange', 'ltp', 'name'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => onSort(k)}
              className={`px-2.5 py-1 border transition-colors ${
                sortBy === k
                  ? 'border-accent text-accent'
                  : 'border-border-light text-muted hover:text-primary hover:border-border'
              }`}
            >
              {k === 'pChange' ? '% Chg' : k === 'ltp' ? 'Price' : 'Name'}
              {sortBy === k && (sortDir === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-surface border border-border-light p-6 mb-4">
          <p className="text-sm text-negative">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && indices.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border-light p-4 h-32 skeleton animate-shimmer" />
          ))}
        </div>
      )}

      {/* Bento grid */}
      {!loading && indices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((idx) => {
            const isUp = (idx.pChange ?? 0) >= 0;
            const changeColor = isUp
              ? (isDark ? '#5ab870' : '#2e7d32')
              : (isDark ? '#e06060' : '#c62828');
            return (
              <button
                key={idx.instrumentKey}
                onClick={() => navigate(`/index/${encodeURIComponent(idx.instrumentKey)}`)}
                className="group bg-surface border border-border-light p-4 hover:border-accent transition-colors text-left flex flex-col gap-2 min-h-[140px]"
              >
                {/* Top row: name + arrow */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="text-[10px] font-mono text-muted tracking-wider uppercase truncate">
                    {idx.indexName}
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-muted opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all flex-shrink-0" />
                </div>

                {/* Price */}
                <div className="font-mono text-[15px] font-semibold tracking-tight text-primary">
                  {idx.ltp != null ? fmt(idx.ltp) : '—'}
                </div>

                {/* Change */}
                <div className={`flex items-baseline gap-1.5 text-[11px] font-mono font-medium ${getChangeColor(idx.pChange)}`}>
                  <span>{isUp ? '+' : ''}{idx.change?.toFixed(2) ?? '—'}</span>
                  <span className="text-muted">({isUp ? '+' : ''}{idx.pChange?.toFixed(2) ?? '—'}%)</span>
                </div>

                {/* Live intraday chart */}
                <div className="mt-auto">
                  <MiniChart instrumentKey={idx.instrumentKey} color={changeColor} height={32} />
                </div>

                {/* Footer: exchange */}
                <div className="flex items-center justify-between text-[9px] font-mono text-muted uppercase tracking-wider pt-1.5 border-t border-border-light">
                  <span>{idx.exchange}</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full px-5 py-12 text-center text-[12px] font-mono text-muted border border-border-light bg-surface">
              No indices match "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};