import { useEffect, useState } from 'react';
import { chartsApi } from '../lib/api';

export interface DayStats {
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
}

export interface YearStats {
  yearHigh: number | null;
  yearLow: number | null;
}

/* ── useCandleStats — single source of truth for day/week OHLC stats.
 *
 * Derives:
 *  - Day stats (open/high/low) from the last session's 1-minute candles.
 *  - The true previous close from the daily history candles: the close of
 *    the completed session BEFORE the last one (yearCandles[len - 2]).
 *    The intraday series cannot provide it — its last candle close is the
 *    session's OWN close, not the previous close.
 *  - 52W high/low from the 1Y daily history.
 * ── */
export const useCandleStats = (instrumentKey: string | null) => {
  const [dayStats, setDayStats] = useState<DayStats | null>(null);
  const [yearStats, setYearStats] = useState<YearStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!instrumentKey) return;
    let cancelled = false;
    setDayStats(null);
    setYearStats(null);
    setStatsLoading(true);

    const loadStats = async () => {
      try {
        const [dayRes, yearRes] = await Promise.all([
          chartsApi.intraday(instrumentKey, 'minutes', '1').catch(() => null),
          chartsApi.history(instrumentKey, '1Y', 'days', '1').catch(() => null),
        ]);

        if (cancelled) return;

        const dayCandles = (dayRes?.data ?? []) as Array<{
          date: string; open: number; high: number; low: number; close: number;
        }>;
        const yearCandles = (yearRes?.data ?? []) as Array<{
          date: string; open: number; high: number; low: number; close: number;
        }>;

        if (dayCandles.length > 0) {
          const open = dayCandles[0].open;
          const high = dayCandles.reduce((m, c) => Math.max(m, c.high), dayCandles[0].high);
          const low = dayCandles.reduce((m, c) => Math.min(m, c.low), dayCandles[0].low);
          const candlePrevClose = yearCandles.length >= 2
            ? yearCandles[yearCandles.length - 2].close
            : null;
          setDayStats({ open, high, low, prevClose: candlePrevClose });
        } else {
          setDayStats({ open: null, high: null, low: null, prevClose: null });
        }

        if (yearCandles.length > 0) {
          const yearHigh = yearCandles.reduce((m, c) => Math.max(m, c.high), yearCandles[0].high);
          const yearLow = yearCandles.reduce((m, c) => Math.min(m, c.low), yearCandles[0].low);
          setYearStats({ yearHigh, yearLow });
        } else {
          setYearStats({ yearHigh: null, yearLow: null });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    loadStats();
    return () => { cancelled = true; };
  }, [instrumentKey]);

  return { dayStats, yearStats, statsLoading };
};