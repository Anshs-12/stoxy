import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tickerApi, parseApiError } from '@/lib/api';
import type { LtpcData, FullFeedData } from '@/types';

const LTPC_POLL_MS = 2000;
const FULLFEED_POLL_MS = 3000;

interface TickerContextType {
  ltpcData: Record<string, LtpcData | null>;
  fullFeedData: Record<string, FullFeedData | null>;
  subscribeLtpc: (keys: string[]) => () => void;
  subscribeFullFeed: (key: string) => () => void;
  lastError: string | null;
  consecutiveFailures: number;
}

const TickerContext = createContext<TickerContextType | undefined>(undefined);

export function TickerProvider({ children }: { children: React.ReactNode }) {
  // State for merged price data (accumulated across all polls)
  const [ltpcData, setLtpcData] = useState<Record<string, LtpcData | null>>({});
  const [fullFeedData, setFullFeedData] = useState<Record<string, FullFeedData | null>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Track active subscription keys as state so React Query re-renders
  const [activeLtpcKeys, setActiveLtpcKeys] = useState<string[]>([]);
  const [activeFullFeedKeys, setActiveFullFeedKeys] = useState<string[]>([]);

  // Ref-counted subscription maps
  const ltpcSubsRef = useRef<Map<string, number>>(new Map());
  const fullFeedSubsRef = useRef<Map<string, number>>(new Map());

  // Stable sorted key string for query key (prevents unnecessary refetches)
  const ltpcKeyString = useMemo(() => [...activeLtpcKeys].sort().join(','), [activeLtpcKeys]);
  const fullFeedKeyString = useMemo(() => [...activeFullFeedKeys].sort().join(','), [activeFullFeedKeys]);

  // ── LTPC polling via React Query v5 ──
  const ltpcQuery = useQuery({
    queryKey: ['ltpc', ltpcKeyString],
    queryFn: () => tickerApi.getLtpc(activeLtpcKeys),
    enabled: activeLtpcKeys.length > 0,
    refetchInterval: LTPC_POLL_MS,
    staleTime: 1000,
    placeholderData: (prev: Record<string, LtpcData> | undefined) => prev,
  });

  // Sync LTPC query data into accumulated state
  useEffect(() => {
    if (ltpcQuery.data) {
      setLtpcData(prev => ({ ...prev, ...ltpcQuery.data }));
      setLastError(null);
      setConsecutiveFailures(0);
    }
  }, [ltpcQuery.data]);

  useEffect(() => {
    if (ltpcQuery.error) {
      setLastError(parseApiError(ltpcQuery.error));
      setConsecutiveFailures(prev => prev + 1);
    }
  }, [ltpcQuery.error]);

  // ── FullFeed polling via React Query v5 ──
  const fullFeedQuery = useQuery({
    queryKey: ['fullFeed', fullFeedKeyString],
    queryFn: () => tickerApi.getFullFeed(activeFullFeedKeys),
    enabled: activeFullFeedKeys.length > 0,
    refetchInterval: FULLFEED_POLL_MS,
    staleTime: 1000,
    placeholderData: (prev: Record<string, FullFeedData> | undefined) => prev,
  });

  // Sync FullFeed query data into accumulated state
  useEffect(() => {
    if (fullFeedQuery.data) {
      setFullFeedData(prev => ({ ...prev, ...fullFeedQuery.data }));
      setLastError(null);
      setConsecutiveFailures(0);
    }
  }, [fullFeedQuery.data]);

  useEffect(() => {
    if (fullFeedQuery.error) {
      setLastError(parseApiError(fullFeedQuery.error));
      setConsecutiveFailures(prev => prev + 1);
    }
  }, [fullFeedQuery.error]);

  // Page Visibility API — refetch when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (activeLtpcKeys.length > 0) ltpcQuery.refetch();
        if (activeFullFeedKeys.length > 0) fullFeedQuery.refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLtpcKeys.length, activeFullFeedKeys.length]);

  // ── Subscription management ──
  const subscribeLtpc = useCallback((keys: string[]) => {
    const subs = ltpcSubsRef.current;
    for (const k of keys) {
      subs.set(k, (subs.get(k) || 0) + 1);
    }
    setActiveLtpcKeys(Array.from(subs.keys()));
    return () => {
      for (const k of keys) {
        const count = subs.get(k) || 0;
        if (count <= 1) subs.delete(k);
        else subs.set(k, count - 1);
      }
      setActiveLtpcKeys(Array.from(subs.keys()));
    };
  }, []);

  const subscribeFullFeed = useCallback((key: string) => {
    const subs = fullFeedSubsRef.current;
    subs.set(key, (subs.get(key) || 0) + 1);
    setActiveFullFeedKeys(Array.from(subs.keys()));
    return () => {
      const count = subs.get(key) || 0;
      if (count <= 1) subs.delete(key);
      else subs.set(key, count - 1);
      setActiveFullFeedKeys(Array.from(subs.keys()));
    };
  }, []);

  const contextValue = useMemo<TickerContextType>(() => ({
    ltpcData,
    fullFeedData,
    subscribeLtpc,
    subscribeFullFeed,
    lastError,
    consecutiveFailures,
  }), [
    ltpcData,
    fullFeedData,
    lastError,
    consecutiveFailures,
    subscribeLtpc,
    subscribeFullFeed,
  ]);

  return (
    <TickerContext.Provider value={contextValue}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  const ctx = useContext(TickerContext);
  if (!ctx) throw new Error('useTicker must be used within TickerProvider');
  return ctx;
}

// Hook for ltpc data with React Query v5
export function useLtpcQuery(instrumentKeys: string[]) {
  return useQuery({
    queryKey: ['ltpc-direct', instrumentKeys.sort().join(',')],
    queryFn: () => tickerApi.getLtpc(instrumentKeys),
    enabled: instrumentKeys.length > 0,
    refetchInterval: 2000,
    staleTime: 1000,
    placeholderData: (prev: Record<string, LtpcData> | undefined) => prev,
  });
}

// Hook for fullFeed data with React Query v5
export function useFullFeedQuery(instrumentKey: string | null) {
  return useQuery({
    queryKey: ['fullFeed-direct', instrumentKey],
    queryFn: () => {
      if (!instrumentKey) throw new Error('No instrument key');
      return tickerApi.getFullFeed([instrumentKey]);
    },
    enabled: !!instrumentKey,
    refetchInterval: 3000,
    staleTime: 1000,
    placeholderData: (prev: Record<string, FullFeedData> | undefined) => prev,
  });
}
