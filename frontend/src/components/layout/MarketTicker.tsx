import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { indexApi, tickerApi } from '../../lib/api';
import { fmt, getChangeColor } from '../../lib/utils';
import type { IndexSearchResult } from '../../types';

interface TickerItem {
  key: string;           // instrument key — used for routing
  symbol: string;        // display name
  price: string;
  ltp: number | null;
  pChange: number;
}

// Queries used to seed the ticker bar
const TICKER_QUERIES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX'];

export const MarketTicker = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const discover = async (): Promise<IndexSearchResult[]> => {
      const seen = new Set<string>();
      const found: IndexSearchResult[] = [];
      const results = await Promise.allSettled(
        TICKER_QUERIES.map(q => indexApi.search(q))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const item of r.value.data.indexSearchDTOList ?? []) {
            if (!seen.has(item.instrumentKey)) {
              seen.add(item.instrumentKey);
              found.push(item);
            }
          }
        }
      }
      return found;
    };

    const fetchPrices = async (found: IndexSearchResult[]) => {
      if (cancelled || found.length === 0) return;
      try {
        const keys = found.map(i => i.instrumentKey);
        const r = await tickerApi.getLtpc(keys);
        const liveMap = r.data ?? {};

        const live: TickerItem[] = found.map(item => {
          const tick = liveMap[item.instrumentKey];
          const ltp = tick?.ltp ?? null;
          const cp = tick?.cp ?? null;
          const pChange =
            ltp != null && cp != null && cp > 0
              ? ((ltp - cp) / cp) * 100
              : 0;
          return {
            key: item.instrumentKey,
            symbol: item.indexName,
            price: ltp != null ? fmt(ltp) : '—',
            ltp,
            pChange,
          };
        });
        if (!cancelled) setItems(live);
      } catch {
        // silent — decorative ticker
      }
    };

    const init = async () => {
      try {
        const found = await discover();
        if (cancelled) return;
        await fetchPrices(found);
        // Poll live prices every 30s — pass found array to closure
        intervalId = setInterval(() => fetchPrices(found), 30_000);
      } catch {
        // completely silent
      }
    };

    init();
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  if (items.length === 0) return null;

  // Repeat enough copies for seamless infinite scroll
  const repeated: TickerItem[] = Array(16).fill(items).flat();

  return (
    <div
      className="w-full bg-neutral/80 border-b border-border-light overflow-hidden flex select-none cursor-pointer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex items-center w-max whitespace-nowrap"
        style={{
          animation: `ticker-scroll 100s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {repeated.map((item: TickerItem, i) => {
          const isUp = item.pChange >= 0;
          return (
            <button
              key={`${item.key}-${i}`}
              type="button"
              onClick={() => navigate(`/index/${encodeURIComponent(item.key)}`)}
              className="flex items-center gap-2 text-[11.5px] font-mono flex-shrink-0 px-5 py-1.5 hover:bg-border-light transition-colors rounded-sm group"
              title={`View ${item.symbol} details`}
            >
              {/* Colored dot */}
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isUp ? 'bg-positive' : 'bg-negative'}`} />

              <span className="text-muted-heavy font-semibold tracking-wide group-hover:text-primary transition-colors">
                {item.symbol}
              </span>
              <span className="text-primary font-semibold">{item.price}</span>
              <span className={`font-semibold ${getChangeColor(item.pChange)}`}>
                {isUp ? '+' : ''}{item.pChange.toFixed(2)}%
              </span>

              {/* Separator */}
              <span className="text-border ml-1 text-[10px]">·</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
