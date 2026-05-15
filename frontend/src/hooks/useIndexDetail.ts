import { useState, useEffect, useCallback } from 'react';
import { indexApi } from '../lib/api';
import { IndexDetail } from '../types';

export const useIndexDetail = (symbol: string | undefined) => {
  const [index, setIndex] = useState<IndexDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadIndex = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const r = await indexApi.getBySymbol(decodeURIComponent(symbol));
      setIndex(r.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.status === 404
        ? `Index "${symbol}" not found.`
        : 'Failed to load index data.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  return {
    index,
    loading,
    error,
    refreshIndex: loadIndex,
  };
};
