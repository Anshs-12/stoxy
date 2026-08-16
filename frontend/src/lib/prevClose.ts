import { chartsApi } from './api';

interface CacheEntry {
  date: string;
  prevClose: number;
}

const STORAGE_KEY = 'stoxy-prev-close-v1';
const SANE_DELTA = 0.005;

const day = () => new Date().toISOString().slice(0, 10);

// ── Day-stamped previous-close cache (in-memory, hydrated from localStorage) ──
const cache = new Map<string, CacheEntry>();

const loadCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v.prevClose === 'number' && v.date === day()) cache.set(k, v);
    }
  } catch {
    // corrupt cache — ignore
  }
};
loadCache();

const saveCache = () => {
  if (typeof window === 'undefined') return;
  try {
    const fresh: Record<string, CacheEntry> = {};
    for (const [k, v] of cache) {
      if (v.date === day()) fresh[k] = v;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // storage unavailable — ignore
  }
};

/** A cp is trustworthy only when it clearly differs from the live price. */
export const isSaneCp = (cp: number | null | undefined, ltp: number | null | undefined) =>
  cp != null && ltp != null && cp > 0 && Math.abs(cp - ltp) >= SANE_DELTA;

/**
 * Resolve the previous close synchronously: sane cp first, else the
 * day-cached candle-derived value. Returns null when neither is available.
 */
export const getPrevClose = (
  key: string,
  cp: number | null | undefined,
  ltp: number | null | undefined
): number | null => {
  if (isSaneCp(cp, ltp)) return cp ?? null;
  const hit = cache.get(key);
  return hit && hit.date === day() ? hit.prevClose : null;
};

/**
 * Fetch the candle-derived previous close (yearCandles[len-2].close — the
 * same source the detail pages use) and cache it for the rest of the day.
 */
export const fillPrevClose = async (key: string): Promise<number | null> => {
  try {
    const r = await chartsApi.history(key, '1Y', 'days', '1');
    const candles = (r?.data ?? []) as Array<{ close: number }>;
    const prev = candles.length >= 2 ? candles[candles.length - 2].close : null;
    if (prev != null && prev > 0) {
      cache.set(key, { date: day(), prevClose: prev });
      saveCache();
    }
    return prev;
  } catch {
    return null;
  }
};