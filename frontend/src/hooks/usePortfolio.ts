import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, stocksApi } from '../lib/api';
import { PortfolioResponse, TransactionResponse } from '../types';
import { useToast } from '../context/ToastContext';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [txHistory, setTxHistory] = useState<TransactionResponse[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [buyResults, setBuyResults] = useState<{ stockName: string; stockSymbol: string }[]>([]);
  const { addToast } = useToast();

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const r = await portfolioApi.getPortfolio();
      setPortfolio(r.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 404
        ? 'No portfolio found. Buy your first stock to create one!'
        : 'Failed to load portfolio. Are you logged in?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const searchStocks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBuyResults([]);
      return;
    }
    try {
      const r = await stocksApi.search(query, 0, 6);
      setBuyResults(r.data.content);
    } catch (err) {
      console.error('Failed to search stocks', err);
    }
  }, []);

  const buyStock = async (symbol: string, quantity: number) => {
    try {
      await portfolioApi.buyStock(symbol, quantity);
      addToast(`Successfully bought ${quantity} shares of ${symbol}`, 'success');
      loadPortfolio();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      addToast(msg, 'error');
      return false;
    }
  };

  const sellStock = async (symbol: string, quantity: number) => {
    try {
      await portfolioApi.sellStock(symbol, quantity);
      addToast(`Successfully sold ${quantity} shares of ${symbol}`, 'success');
      loadPortfolio();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      addToast(msg, 'error');
      return false;
    }
  };

  const fetchTransactionHistory = async (symbol?: string) => {
    setTxLoading(true);
    try {
      const r = symbol 
        ? await portfolioApi.getTransactionsByStock(symbol)
        : await portfolioApi.getTransactionHistory();
      setTxHistory(r.data);
    } catch (err) {
      addToast('Failed to fetch transaction history', 'error');
    } finally {
      setTxLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const r = await portfolioApi.exportTransactionsPDF();
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Stoxy_Transaction_Statement.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      addToast('Statement downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export PDF', 'error');
    }
  };

  return {
    portfolio,
    loading,
    error,
    loadPortfolio,
    buyStock,
    sellStock,
    txHistory,
    txLoading,
    fetchTransactionHistory,
    exportPDF,
    buyResults,
    searchStocks,
  };
};
