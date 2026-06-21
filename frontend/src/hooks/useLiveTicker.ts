import { useQuery } from '@tanstack/react-query';
import { tickerApi } from '@/lib/api';
import type { LtpcData } from '@/types';

export function useLiveTicker(instrumentKeys: string[]) {
  return useQuery({
    queryKey: ['ltpc', instrumentKeys.sort().join(',')],
    queryFn: () => tickerApi.getLtpc(instrumentKeys),
    enabled: instrumentKeys.length > 0,
    refetchInterval: 2000,
    staleTime: 1000,
    placeholderData: (prev: Record<string, LtpcData> | undefined) => prev,
  });
}