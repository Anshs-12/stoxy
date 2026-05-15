import { useState, useEffect, useCallback } from 'react';
import { indexApi } from '../lib/api';
import { IndexDetail } from '../types';

const INDEX_SYMBOLS = ['NIFTY 50', 'NIFTY BANK', 'NIFTY NEXT 50'];

export const useDashboard = () => {
  const [indices, setIndices] = useState<IndexDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(INDEX_SYMBOLS.map(s => indexApi.getBySymbol(s)));
      setIndices(results.map(r => r.data));
    } catch (err: any) {
      const status = err.response?.status;
      if (!status) {
        setError('Could not connect to backend. Make sure the Spring Boot server is running on port 8080.');
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
