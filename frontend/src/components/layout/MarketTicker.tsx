import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { indexApi, tickerApi } from '../../lib/api';
import { marketSocket } from '../../lib/marketSocket';
import { getPrevClose } from '../../lib/prevClose';
import { usePrevCloseFix } from '../../hooks/usePrevCloseFix';
import { fmt, getChangeColor, isMarketOpen } from '../../lib/utils';
import type { IndexSearchResult } from '../../types';

interface TickerItem {
  key: string;           // instrument key — used for routing
  symbol: string;        // display name
  price: string;
  ltp: number | null;
  cp: number | null;
  pChange: number;
}

// Queries used to seed the ticker bar
const TICKER_QUERIES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX'];

export const MarketTicker = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [paused, setPaused] = useState(false);

  // Keep a ref to the discovered indices so the tick listener can update them
  const foundRef = useRef<IndexSearchResult[]>([]);
  // itemsRef mirrors state so the tick listener closure always has fresh data
  const itemsRef = useRef<TickerItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    let cancelled = false;

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

    const init = async () => {
      try {
        const found = await discover();
        if (cancelled || found.length === 0) return;
        foundRef.current = found;

        // ── Step 1: REST snapshot ──
        try {
          const keys = found.map(i => i.instrumentKey);
          const r = await tickerApi.getLtpc(keys);
          const liveMap = r.data ?? {};

          if (!cancelled) {
            const initial: TickerItem[] = found.map(item => {
              const tick = liveMap[item.instrumentKey];
              const ltp = tick?.ltp ?? null;
              const cp = tick?.cp ?? null;
              const prevClose = getPrevClose(item.instrumentKey, cp, ltp);
              const pChange =
                ltp != null && prevClose != null && prevClose > 0
                  ? ((ltp - prevClose) / prevClose) * 100
                  : 0;
              return {
                key: item.instrumentKey,
                symbol: item.indexName,
                price: ltp != null ? fmt(ltp) : '—',
                ltp,
                cp,
                pChange,
              };
            });
            setItems(initial);
          }
        } catch {
          // non-fatal — ticker bar is decorative; show names without prices
          if (!cancelled) {
            setItems(found.map(item => ({
              key: item.instrumentKey,
              symbol: item.indexName,
              price: '—',
              ltp: null,
              cp: null,
              pChange: 0,
            })));
          }
        }

        // ── Step 2: WebSocket subscription (ltpc mode for indices) ──
        if (!cancelled) {
          const keys = found.map(i => i.instrumentKey);

          // Subscribe returns unsubscribe — stored in cleanup below
          const wsUnsub = marketSocket.subscribe(keys, 'ltpc');

          const tickUnsub = marketSocket.addTickListener(msg => {
            const key = msg.instrumentKey;
            if (!key) return;

            const ltp = msg.ltp;
            if (ltp == null) return;

            setItems(prev =>
              prev.map(item =>
                item.key === key
                  ? {
                      ...item,
                      ltp,
                      price: fmt(ltp),
                      cp: msg.cp ?? item.cp,
                      pChange:
                        msg.cp != null && msg.cp > 0
                          ? ((ltp - msg.cp) / msg.cp) * 100
                          : item.pChange,
                    }
                  : item
              )
            );
          });

          // Return combined cleanup
          return () => {
            wsUnsub();
            tickUnsub();
          };
        }
      } catch {
        // completely silent — ticker bar failure is non-critical
      }
    };

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // ── Previous-close repair: fills stale cp (cp == ltp on closed days)
  // from candle history once per day, then patches pChange. ──
  usePrevCloseFix(
    items,
    setItems,
    i => i.key,
    i => ({ cp: i.cp, ltp: i.ltp }),
    (item, prevClose) => ({
      ...item,
      cp: prevClose,
      pChange: item.ltp != null && prevClose > 0 ? ((item.ltp - prevClose) / prevClose) * 100 : 0,
    })
  );

  if (items.length === 0) return null;

  const marketOpen = isMarketOpen();
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
          animation: `ticker-scroll 150s linear infinite`,
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
              {/* Colored dot — grey when market closed */}
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                marketOpen
                  ? (isUp ? 'bg-positive' : 'bg-negative')
                  : 'bg-muted'
              }`} />

              <span className="text-muted-heavy font-semibold tracking-wide group-hover:text-primary transition-colors">
                {item.symbol}
              </span>
              <span className="text-primary font-semibold">{item.price}</span>
              <span className={`font-semibold ${getChangeColor(item.pChange)}`}>
                {item.pChange >= 0 ? '+' : ''}{item.pChange.toFixed(2)}%
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
