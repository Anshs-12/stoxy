import axios from 'axios';
import {
  IndexDetail,
  StockSearchResponse,
  StockDetail,
  ScreenerResponse,
  WatchlistSummary,
  WatchlistDetail,
  PortfolioResponse,
  TransactionResponse,
  UserInfo
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v2';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Global 401 interceptor ──
api.interceptors.response.use(
  (res) => res,
  (err: any) => {
    if (err.response?.status === 401) {
      const apiUrl: string = err.config?.url ?? '';
      const isAuthCheck = apiUrl.includes('/auth/');
      if (!isAuthCheck) {
        // We still use window.location.href here because axios is outside React context.
        // A more advanced approach would involve a custom event or a navigation singleton.
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Index Endpoints ──
export const indexApi = {
  getBySymbol: (symbol: string) =>
    api.get<IndexDetail>(`/index/search/${symbol}`),
};

// ── Stock Endpoints ──
export const stocksApi = {
  search: (query: string, page = 0, size = 10) =>
    api.get<StockSearchResponse>('/stocks/search', { params: { query, pageNumber: page, pageSize: size } }),

  getDetails: (symbol: string) =>
    api.get<StockDetail>(`/stocks/search/details/${symbol}`),

  screen: (params: {
    minPe?: number; maxPe?: number; sector?: string; industry?: string;
    pageNumber?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  }) => api.get<ScreenerResponse>('/stocks/search/screen', { params }),
};

// ── Watchlist Endpoints ──
export const watchlistApi = {
  getAll: () => api.get<WatchlistSummary[]>('/watchlist/'),
  getById: (id: number) => api.get<WatchlistDetail>(`/watchlist/${id}`),
  create: (watchlistName: string) => api.post<WatchlistDetail>('/watchlist/create', { watchlistName }),
  delete: (id: number) => api.delete(`/watchlist/${id}`),
  addStock: (watchlistId: number, stockSymbol: string) =>
    api.post(`/watchlist/${watchlistId}/stocks`, { stockSymbol }),
  removeStock: (watchlistId: number, stockSymbol: string) =>
    api.delete(`/watchlist/${watchlistId}/stocks`, { data: { stockSymbol } }),
};

// ── Portfolio Endpoints ──
export const portfolioApi = {
  getPortfolio: () =>
    api.get<PortfolioResponse>('/portfolio/'),

  buyStock: (stockSymbol: string, quantity: number) =>
    api.post('/portfolio/buyStock', { stockSymbol, quantity }),

  sellStock: (stockSymbol: string, quantity: number) =>
    api.post('/portfolio/sellStock', { stockSymbol, quantity }),

  getTransactionsByStock: (stockSymbol: string) =>
    api.get<TransactionResponse[]>(`/portfolio/transaction/${stockSymbol}`),

  getTransactionHistory: () =>
    api.get<TransactionResponse[]>('/portfolio/transactions'),

  exportTransactionsPDF: () =>
    api.get('/portfolio/transactions/export', { responseType: 'blob' }),
};

// ── Auth Endpoints ──
export const authApi = {
  getUserInfo: () => api.get<UserInfo>('/auth/userInfo'),
  logout: () => api.get('/auth/logout'),
};

export default api;
