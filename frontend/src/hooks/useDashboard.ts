import { useState, useEffect, useCallback } from 'react';
import { indexApi } from '../lib/api';
import { IndexDetail } from '../types';

export const INDEX_INSTRUMENTS = [
  { symbol: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
  { symbol: 'SENSEX 50', key: 'BSE_INDEX|SENSEX50' },
  { symbol: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' }
];

export const useDashboard = () => {
  const [indices, setIndices] = useState<IndexDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        INDEX_INSTRUMENTS.map(i => indexApi.getByInstrumentKey(i.key))
      );
      const successfulIndices = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value.data);
      setIndices(successfulIndices);
    } catch (err: any) {
      const status = err.response?.status;
      if (!status) {
        setError('Could not connect to backend. Make sure the Spring Boot server is running on port 8080.');
      } else if (status === 500) {
        setError('Market data temporarily unavailable. The NSE data feed may be down. Please try again later.');
      } else {
        setError(`Backend error (${status}): ${err.response?.data?.message || 'Failed to load market data.'}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    indices,
    loading,
    error,
    refreshDashboard: loadData,
  };
};
