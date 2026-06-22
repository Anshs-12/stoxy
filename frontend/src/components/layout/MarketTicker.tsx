import { useEffect, useState } from 'react';
import { indexApi } from '../../lib/api';
import { fmt, getChangeColor } from '../../lib/utils';

interface TickerItem {
  id: string;
  symbol: string;
  price: string;
  change: number;
}

const INDEX_INSTRUMENTS = [
  { id: 'sensex', symbol: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
  { id: 'sensex50', symbol: 'SENSEX 50', key: 'BSE_INDEX|SENSEX50' },
  { id: 'nifty', symbol: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' }
];

const FALLBACK_ITEMS: TickerItem[] = INDEX_INSTRUMENTS.map(i => ({
  id: i.id, symbol: i.symbol, price: '—', change: 0
}));

export const MarketTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchIndices = async () => {
      try {
        const results = await Promise.allSettled(
          INDEX_INSTRUMENTS.map(item => indexApi.getByInstrumentKey(item.key))
        );
        if (cancelled) return;
        
        const live: TickerItem[] = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map((r, idx) => {
            const data = r.value.data;
            const p = data.indexPriceInfoDTO;
            return {
              id: INDEX_INSTRUMENTS[idx].id,
              symbol: data.indexName || INDEX_INSTRUMENTS[idx].symbol,
              price: p?.lastPrice ? fmt(p.lastPrice) : '—',
              change: p?.pChange ?? 0,
            };
          });
          
        if (live.length > 0) {
          setItems(live);
        } else {
          setItems(FALLBACK_ITEMS);
        }
      } catch {
        if (!cancelled) setItems(FALLBACK_ITEMS);
      }
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (items.length === 0) return null;

  // We create enough repetitions so the marquee can scroll seamlessly.
  const repeated = Array(10).fill(items).flat();

  return (
    <div className="w-full bg-neutral/80 border-b border-border-light overflow-hidden flex">
      <div className="ticker-animate flex items-center w-max whitespace-nowrap">
        {repeated.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex items-center gap-2.5 text-[12px] font-mono flex-shrink-0 px-4">
            <span className="text-muted-heavy font-medium tracking-wide">{item.symbol}</span>
            <span className="text-primary font-medium">{item.price}</span>
            <span className={`font-semibold ${getChangeColor(item.change)}`}>
              {item.change >= 0 ? '+' : ''}{item.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
