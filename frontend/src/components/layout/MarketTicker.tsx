import { useEffect, useState } from 'react';
import { indexApi } from '../../lib/api';
import { fmt, getChangeColor } from '../../lib/utils';

interface TickerItem {
  id: string;
  symbol: string;
  price: string;
  change: number;
}

const FALLBACK_ITEMS: TickerItem[] = [
  { id: 'nifty', symbol: 'NIFTY 50', price: '—', change: 0 },
  { id: 'bank', symbol: 'NIFTY BANK', price: '—', change: 0 },
  { id: 'next50', symbol: 'NIFTY NEXT 50', price: '—', change: 0 },
];

const INDEX_SYMBOLS = ['NIFTY 50', 'NIFTY BANK', 'NIFTY NEXT 50'];
const MAP_KEY: Record<string, string> = {
  'NIFTY 50': 'nifty',
  'NIFTY BANK': 'bank',
  'NIFTY NEXT 50': 'next50',
};

export const MarketTicker = () => {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchIndices = async () => {
      try {
        const results = await Promise.all(
          INDEX_SYMBOLS.map(s => indexApi.getBySymbol(s))
        );
        if (cancelled) return;
        const live: TickerItem[] = results.map(r => {
          const p = r.data.indexPriceInfoDTO;
          return {
            id: MAP_KEY[r.data.name] || r.data.name,
            symbol: r.data.name,
            price: p?.lastPrice ? fmt(p.lastPrice) : '—',
            change: p?.change ?? 0,
          };
        });
        setItems(live);
      } catch {
        if (!cancelled) setItems(FALLBACK_ITEMS);
      }
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (items.length === 0) return null;

  const repeated = [...items, ...items];

  return (
    <div className="w-full bg-neutral border-b border-border-light overflow-hidden">
      <div className="ticker-animate flex items-center gap-8 py-2 px-4 whitespace-nowrap">
        {repeated.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex items-center gap-2 text-[12px] font-mono flex-shrink-0">
            <span className="text-muted-heavy font-medium">{item.symbol}</span>
            <span className="text-primary">{item.price}</span>
            <span className={`font-medium ${getChangeColor(item.change)}`}>
              {item.change >= 0 ? '+' : ''}{item.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
