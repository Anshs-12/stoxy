import { useEffect, useRef } from 'react';
import { useTicker } from '@/context/TickerContext';
import type { FullFeedData } from '@/types';

export function useFullFeed(instrumentKey: string | null): FullFeedData | null {
  const { fullFeedData, subscribeFullFeed } = useTicker();
  const subscribeRef = useRef(subscribeFullFeed);
  subscribeRef.current = subscribeFullFeed;

  const prevKeyRef = useRef<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (prevKeyRef.current === instrumentKey) return;
    prevKeyRef.current = instrumentKey;

    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (instrumentKey) {
      unsubRef.current = subscribeRef.current(instrumentKey);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      prevKeyRef.current = null;
    };
  }, [instrumentKey]);

  if (!instrumentKey) return null;
  return fullFeedData[instrumentKey] ?? null;
}
