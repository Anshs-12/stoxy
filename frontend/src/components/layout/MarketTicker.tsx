import { useEffect, useState } from 'react';
import { indexApi, tickerApi } from '../../lib/api';
import { fmt, getChangeColor } from '../../lib/utils';
import type { IndexSearchResult } from '../../types';

interface TickerItem {
  key: string;
  symbol: string;
  price: string;
  pChange: number;
}

// Queries used to seed the ticker bar — resolved dynamically via API
const TICKER_QUERIES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX'];

export const MarketTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const discoverAndFetch = async () => {
      try {
        // Step 1: discover indices via search
        const seen = new Set<string>();
        const found: IndexSearchResult[] = [];

        const searchResults = await Promise.allSettled(
          TICKER_QUERIES.map(q => indexApi.search(q))
        );
        for (const r of searchResults) {
          if (r.status === 'fulfilled') {
            for (const item of r.value.data.indexSearchDTOList ?? []) {
              if (!seen.has(item.instrumentKey)) {
                seen.add(item.instrumentKey);
                found.push(item);
              }
            }
          }
        }

        if (cancelled || found.length === 0) return;

        const keys = found.map(i => i.instrumentKey);

        // Step 2: fetch live prices via ticker
        const fetchPrices = async () => {
          if (cancelled) return;
          try {
            const r = await tickerApi.getLtpc(keys);
            const liveMap = r.data ?? {};
            const live: TickerItem[] = found.map(item => {
              const tick = liveMap[item.instrumentKey];
              const ltp = tick?.ltp ?? null;
              const cp = tick?.cp ?? null;
              const pChange = ltp != null && cp != null && cp > 0
                ? ((ltp - cp) / cp) * 100
                : 0;
              return {
                key: item.instrumentKey,
                symbol: item.indexName,
                price: ltp != null ? fmt(ltp) : '—',
                pChange,
              };
            });
            if (!cancelled) setItems(live);
          } catch {
            // non-fatal — keep showing stale data
          }
        };

        await fetchPrices();
        intervalId = setInterval(fetchPrices, 30_000);
      } catch {
        // completely silent — ticker is decorative
      }
    };

    discoverAndFetch();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  if (items.length === 0) return null;

  // Repeat enough times for a seamless marquee scroll
  const repeated = Array(12).fill(items).flat();

  return (
    <div className="w-full bg-neutral/80 border-b border-border-light overflow-hidden flex select-none">
      <div className="ticker-animate flex items-center w-max whitespace-nowrap">
        {repeated.map((item: TickerItem, i) => (
          <div
            key={`${item.key}-${i}`}
            className="flex items-center gap-2.5 text-[12px] font-mono flex-shrink-0 px-4 py-1.5"
          >
            <span className="text-muted-heavy font-medium tracking-wide">{item.symbol}</span>
            <span className="text-primary font-semibold">{item.price}</span>
            <span className={`font-semibold ${getChangeColor(item.pChange)}`}>
              {item.pChange >= 0 ? '+' : ''}{item.pChange.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
