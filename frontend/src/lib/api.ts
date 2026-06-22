import axios from 'axios';
import {
  IndexDetail,
  IndexSearchResponse,
  StockSearchResponse,
  StockDetail,
  ScreenerResponse,
  WatchlistSummary,
  WatchlistDetail,
  PortfolioResponse,
  TransactionResponse,
  UserInfo,
  LtpcData,
  FullFeedData,
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
      const isPublic = apiUrl.includes('/stocks/') || apiUrl.includes('/index/');
      const isAuthCheck = apiUrl.includes('/auth/');
      if (!isAuthCheck && !isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Index Endpoints ──
// GET /index/search?query=SENSEX → { indexSearchDTOList: [...] }
// GET /index/search/{instrumentKey} → IndexDetailResponseDTO
export const indexApi = {
  search: (query: string) =>
    api.get<IndexSearchResponse>('/index/search', { params: { query } }),
  getByInstrumentKey: (instrumentKey: string) =>
    api.get<IndexDetail>(`/index/search/${encodeURIComponent(instrumentKey)}`),
};

// ── Stock Endpoints ──
// GET  /stocks/search?query=TCS → StockSearchResponseDTO { content: StockSearchDTO[] }
// POST /stocks/details body: StockSearchDTO → StockDetailResponseDTO
// GET  /stocks/search/screen?minPe=...&maxPe=...&sector=...&industry=...&pageNumber=...&pageSize=...&sortBy=...&sortOrder=...
export const stocksApi = {
  search: (query: string, page = 0, size = 10) =>
    api.get<StockSearchResponse>('/stocks/search', {
      params: { query, pageNumber: page, pageSize: size },
    }),

  // Full StockSearchDTO: { stockName, stockSymbol, companyName, exchange, instrumentKey, isin }
  getDetails: (searchDTO: {
    stockName?: string;
    stockSymbol: string;
    companyName?: string;
    exchange?: string;
    instrumentKey?: string;
    isin?: string;
  }) => api.post<StockDetail>('/stocks/details', searchDTO),

  screen: (params: {
    minPe?: number;
    maxPe?: number;
    sector?: string;
    industry?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get<ScreenerResponse>('/stocks/search/screen', { params }),
};

// ── Watchlist Endpoints ──
// POST /watchlist/create body: { watchlistName }
// GET  /watchlist/ → WatchlistSummaryDTO[]
// GET  /watchlist/{id} → WatchlistResponseDTO
// DELETE /watchlist/{id}
// POST /watchlist/{id}/stocks body: { stockSymbol, instrumentKey, priceAddedAt }
// DELETE /watchlist/{id}/stocks?stockInstrumentKey=...
export const watchlistApi = {
  getAll: () => api.get<WatchlistSummary[]>('/watchlist/'),
  getById: (id: number) => api.get<WatchlistDetail>(`/watchlist/${id}`),
  create: (watchlistName: string) =>
    api.post<WatchlistDetail>('/watchlist/create', { watchlistName }),
  delete: (id: number) => api.delete(`/watchlist/${id}`),
  addStock: (watchlistId: number, stockSymbol: string, instrumentKey: string, priceAddedAt: number) =>
    api.post(`/watchlist/${watchlistId}/stocks`, { stockSymbol, instrumentKey, priceAddedAt }),
  removeStock: (watchlistId: number, stockInstrumentKey: string) =>
    api.delete(`/watchlist/${watchlistId}/stocks`, { params: { stockInstrumentKey } }),
};

// ── Ticker Endpoints ──
// GET /ticker/live/ltpc?instrumentKeyList=KEY1,KEY2,...
// GET /ticker/live/fullFeed?instrumentKeyList=KEY1,KEY2,...
// NOTE: Spring receives @RequestParam List<String> — comma-separated works
export const tickerApi = {
  getLtpc: (instrumentKeys: string[]) =>
    api.get<Record<string, LtpcData>>('/ticker/live/ltpc', {
      params: { instrumentKeyList: instrumentKeys.join(',') },
    }),
  getFullFeed: (instrumentKeys: string[]) =>
    api.get<Record<string, FullFeedData>>('/ticker/live/fullFeed', {
      params: { instrumentKeyList: instrumentKeys.join(',') },
    }),
};

// ── Portfolio Endpoints ──
// GET  /portfolio/ → PortfolioResponseDTO
// POST /portfolio/buyStock body: { stockSymbol, quantity, buyPrice, instrumentKey }
// POST /portfolio/sellStock body: { stockSymbol, quantity, instrumentKey, sellingPrice }
// GET  /portfolio/transaction/{stockSymbol} → TransactionResponseDTO[]
// GET  /portfolio/transactions → TransactionResponseDTO[]
// GET  /portfolio/transactions/export → PDF blob
export const portfolioApi = {
  getPortfolio: () => api.get<PortfolioResponse>('/portfolio/'),

  buyStock: (stockSymbol: string, quantity: number, buyPrice: number, instrumentKey: string) =>
    api.post('/portfolio/buyStock', { stockSymbol, quantity, buyPrice, instrumentKey }),

  sellStock: (stockSymbol: string, quantity: number, sellingPrice: number, instrumentKey: string) =>
    api.post('/portfolio/sellStock', { stockSymbol, quantity, sellingPrice, instrumentKey }),

  getTransactionsByStock: (stockSymbol: string) =>
    api.get<TransactionResponse[]>(`/portfolio/transaction/${stockSymbol}`),

  getTransactionHistory: () =>
    api.get<TransactionResponse[]>('/portfolio/transactions'),

  exportTransactionsPDF: () =>
    api.get('/portfolio/transactions/export', { responseType: 'blob' }),
};

// ── Auth Endpoints ──
// GET /auth/userInfo → UserInfoResponseDTO { userName, userEmailId, jwtToken, providerType }
// GET /auth/logout → clears JWT cookie
export const authApi = {
  getUserInfo: () => api.get<UserInfo>('/auth/userInfo'),
  logout: () => api.get('/auth/logout'),
};

export default api;
