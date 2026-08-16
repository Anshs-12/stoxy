import { useState, useEffect, useCallback } from 'react';
import { stocksApi, tickerApi } from '../lib/api';
import { marketSocket } from '../lib/marketSocket';
import { getPrevClose } from '../lib/prevClose';
import { usePrevCloseFix, recomputeChange } from './usePrevCloseFix';
import type { StockSearchResult, LtpcData } from '../types';

export interface TopStock extends StockSearchResult {
    ltp: number | null;
    cp: number | null;
    change: number | null;
    pChange: number | null;
}

// Curated set of large-cap / high-volume Indian blue chips — searches the
// stock index for each and uses the first match. Picks by exact symbol so we
// always land on the right instrument regardless of search result order.
const BLUE_CHIPS = [
    'RELIANCE',
    'HDFCBANK',
    'INFY',
    'TCS',
    'ICICIBANK',
    'BHARTIARTL',
];

/**
 * Pulls a curated set of large-cap stocks from the search API and subscribes
 * to live LTPC updates so the dashboard shows actual market data.
 */
export const useTopStocks = (limit = 6) => {
    const [stocks, setStocks] = useState<TopStock[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const found: StockSearchResult[] = [];

            // Search each symbol; keep the first NSE match (highest priority)
            for (const symbol of BLUE_CHIPS.slice(0, limit)) {
                try {
                    const r = await stocksApi.search(symbol, 0, 4);
                    const match =
                        r.data.content.find(s => s.stockSymbol === symbol && s.exchange === 'NSE') ||
                        r.data.content.find(s => s.stockSymbol === symbol) ||
                        r.data.content[0];
                    if (match && !found.some(f => f.stockSymbol === match.stockSymbol)) {
                        found.push(match);
                    }
                } catch {
                    // skip on error
                }
            }

            const keys = found.map(s => s.instrumentKey);
            let liveMap: Record<string, LtpcData> = {};
            if (keys.length > 0) {
                try {
                    const r = await tickerApi.getLtpc(keys);
                    liveMap = r.data ?? {};
                } catch {
                    liveMap = {};
                }
            }

            setStocks(
                found.map(s => {
                    const live = liveMap[s.instrumentKey];
                    const ltp = live?.ltp ?? null;
                    const cp = live?.cp ?? null;
                    const prevClose = getPrevClose(s.instrumentKey, cp, ltp);
                    const change = ltp != null && prevClose != null ? ltp - prevClose : null;
                    const pChange =
                        prevClose != null && prevClose > 0 && change != null ? (change / prevClose) * 100 : null;
                    return { ...s, ltp, cp, change, pChange };
                })
            );
        } catch {
            setStocks([]);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        load();
    }, [load]);

    // Live updates via WebSocket
    useEffect(() => {
        if (stocks.length === 0) return;
        const keys = stocks.map(s => s.instrumentKey);
        const wsUnsub = marketSocket.subscribe(keys, 'ltpc');
        const tickUnsub = marketSocket.addTickListener(msg => {
            const key = msg.instrumentKey;
            if (!key) return;
            const ltp = msg.ltp;
            if (ltp == null) return;

            setStocks(prev =>
                prev.map(s => {
                    if (s.instrumentKey !== key) return s;
                    const cpVal = msg.cp ?? s.cp ?? ltp;
                    const change = ltp - cpVal;
                    const pChange = cpVal > 0 ? (change / cpVal) * 100 : 0;
                    return { ...s, ltp, cp: cpVal, change, pChange };
                })
            );
        });

        return () => {
            wsUnsub();
            tickUnsub();
        };
    }, [stocks.length]);

    // ── Previous-close repair: fills stale cp (cp == ltp on closed days)
    // from candle history once per day, then patches change/pChange. ──
    usePrevCloseFix(stocks, setStocks, s => s.instrumentKey, s => ({ cp: s.cp, ltp: s.ltp }), recomputeChange);

    return { stocks, loading };
};
