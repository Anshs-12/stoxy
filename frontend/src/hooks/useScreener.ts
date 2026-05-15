import { useState, useCallback } from 'react';
import { stocksApi } from '../lib/api';
import { ScreenerResponse } from '../types';

export interface ScreenerFilters {
  minPe: string;
  maxPe: string;
  sector: string;
  industry: string;
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

export const defaultFilters: ScreenerFilters = {
  minPe: '',
  maxPe: '',
  sector: '',
  industry: '',
  pageNumber: 0,
  pageSize: 15,
  sortBy: 'stockName',
  sortOrder: 'asc',
};

export const useScreener = () => {
  const [filters, setFilters] = useState<ScreenerFilters>(defaultFilters);
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const screenStocks = useCallback(async (f: ScreenerFilters) => {
    setLoading(true);
    setError('');
    const params = {
      minPe: f.minPe ? Number(f.minPe) : undefined,
      maxPe: f.maxPe ? Number(f.maxPe) : undefined,
      sector: f.sector.trim() || undefined,
      industry: f.industry.trim() || undefined,
      pageNumber: f.pageNumber,
      pageSize: f.pageSize,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder,
    };

    try {
      const r = await stocksApi.screen(params);
      setData(r.data);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to screen stocks. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    const updated = { ...filters, pageNumber: newPage };
    setFilters(updated);
    screenStocks(updated);
  }, [filters, screenStocks]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setData(null);
    setHasSearched(false);
    setError('');
  }, []);

  return {
    filters,
    setFilters,
    data,
    loading,
    error,
    hasSearched,
    screenStocks,
    handlePageChange,
    resetFilters,
  };
};
