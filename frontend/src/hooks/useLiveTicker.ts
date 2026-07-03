/**
 * useLiveTicker.ts
 *
 * Thin wrapper around the shared TickerContext LTPC subscription.
 * Previously polled REST every 2 s; now receives WebSocket push ticks.
 */

import { useLtpc } from '@/hooks/useLtpc';
import type { LtpcData } from '@/types';

export function useLiveTicker(instrumentKeys: string[]): Record<string, LtpcData | null> {
  return useLtpc(instrumentKeys);
}