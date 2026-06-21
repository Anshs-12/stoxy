import { useEffect, useRef } from 'react';
import { useTicker } from '@/context/TickerContext';
import type { LtpcData } from '@/types';

function keysSignature(keys: string[]): string {
  return [...new Set(keys)].sort().join(',');
}

export function useLtpc(instrumentKeys: string[]): Record<string, LtpcData | null> {
  const { ltpcData, subscribeLtpc } = useTicker();
  const subscribeRef = useRef(subscribeLtpc);
  subscribeRef.current = subscribeLtpc;

  const dedupedKeys = [...new Set(instrumentKeys)];
  const sig = keysSignature(dedupedKeys);
  const sigRef = useRef('');
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (dedupedKeys.length === 0) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      sigRef.current = '';
      return;
    }
    
    if (sigRef.current === sig) return;
    sigRef.current = sig;

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeRef.current(dedupedKeys);

    return () => {
      // We don't nullify sigRef here if we want to skip re-sub on same sig if component re-renders
      // but if it unmounts, we should clean up
    };
  }, [sig]);

  // Handle unmount specifically
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  const result: Record<string, LtpcData | null> = {};
  for (const key of dedupedKeys) {
    result[key] = ltpcData[key] ?? null;
  }
  return result;
}

export function useLtpcSingle(instrumentKey: string | null): LtpcData | null {
  const data = useLtpc(instrumentKey ? [instrumentKey] : []);
  return instrumentKey ? data[instrumentKey] ?? null : null;
}
