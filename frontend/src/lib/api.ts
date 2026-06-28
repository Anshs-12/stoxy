import axios from 'axios';
import type {
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

// ── Base URL ──
// In dev, Vite proxies /api/v2 → stoxy-finance.onrender.com
// In prod, the deployed frontend should be served from the same origin or point to the live URL
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v2';

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,          // sends the HttpOnly JWT cookie automatically
    headers: {'Content-Type': 'application/json'},
    timeout: 30000,                 // 30s — Render free tier can be slow on cold start
});

// ── Error Utilities ──
export function parseApiError(err: unknown): string {
    if (!err) return 'An unknown error occurred';
    const e = err as any;
    if (e?.response?.data?.message) return String(e.response.data.message);
    if (e?.response?.data && typeof e.response.data === 'string') return e.response.data;
    if (e?.message) return String(e.message);
    return 'Request failed';
}

// ── No global 401 redirect ──
// Route protection is handled by <AuthGate> at the router level.
// A global redirect here would incorrectly send users to /login when public
// pages (StockDetails, Dashboard) make background calls to auth-required
// endpoints (e.g. /watchlist/ to fetch the "Add to watchlist" dropdown).
// Individual hooks already catch errors silently via try/catch.
api.interceptors.response.use(
    (res) => res,
    (err: any) => Promise.reject(err)
);

// ── Index Endpoints ──
// GET /index/search?query=SENSEX  → { indexSearchDTOList: [...] }
// GET /index/search/{instrumentKey} → IndexDetailResponseDTO
export const indexApi = {
    search: (query: string) =>
        api.get<IndexSearchResponse>('/index/search', {params: {query}}),
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
            params: {query, pageNumber: page, pageSize: size},
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
    }) => api.get<ScreenerResponse>('/stocks/search/screen', {params}),
};

// ── Watchlist Endpoints ──
// POST /watchlist/create body: { watchlistName }
// GET  /watchlist/ → WatchlistSummaryDTO[]
// GET  /watchlist/{id} → WatchlistResponseDTO
// DELETE /watchlist/{id}
// POST /watchlist/{id}/stocks body: { stockSymbol, instrumentKey, isin, priceAddedAt }
// DELETE /watchlist/{id}/stocks?stockInstrumentKey=...
export const watchlistApi = {
    getAll: () => api.get<WatchlistSummary[]>('/watchlist/'),
    getById: (id: number) => api.get<WatchlistDetail>(`/watchlist/${id}`),
    create: (watchlistName: string) =>
        api.post<WatchlistDetail>('/watchlist/create', {watchlistName}),
    delete: (id: number) => api.delete(`/watchlist/${id}`),

    // WatchlistStockRequestDTO: { stockSymbol, instrumentKey, isin, priceAddedAt }
    addStock: (
        watchlistId: number,
        stockSymbol: string,
        instrumentKey: string,
        priceAddedAt: number,
        isin?: string
    ) =>
        api.post(`/watchlist/${watchlistId}/stocks`, {
            stockSymbol,
            instrumentKey,
            isin: isin ?? '',
            priceAddedAt,
        }),

    removeStock: (watchlistId: number, stockInstrumentKey: string) =>
        api.delete(`/watchlist/${watchlistId}/stocks`, {
            params: {stockInstrumentKey},
        }),
};

// ── Ticker Endpoints ──
// GET /ticker/live/ltpc?instrumentKeyList=KEY1&instrumentKeyList=KEY2...
// GET /ticker/live/fullFeed?instrumentKeyList=KEY1&instrumentKeyList=KEY2...
//
// Spring @RequestParam List<String> works with repeated query params:
//   ?instrumentKeyList=NSE_EQ|INE002A01018&instrumentKeyList=NSE_EQ|INE009A01021
// Axios serializes arrays as repeated params by default.
export const tickerApi = {
    getLtpc: (instrumentKeys: string[]) =>
        api.get<Record<string, LtpcData>>('/ticker/live/ltpc', {
            params: {instrumentKeyList: instrumentKeys},
            // Serialize as repeated params: instrumentKeyList=K1&instrumentKeyList=K2
            paramsSerializer: (params) => {
                const parts: string[] = [];
                for (const key of params.instrumentKeyList as string[]) {
                    parts.push(`instrumentKeyList=${encodeURIComponent(key)}`);
                }
                return parts.join('&');
            },
        }),

    getFullFeed: (instrumentKeys: string[]) =>
        api.get<Record<string, FullFeedData>>('/ticker/live/fullFeed', {
            params: {instrumentKeyList: instrumentKeys},
            paramsSerializer: (params) => {
                const parts: string[] = [];
                for (const key of params.instrumentKeyList as string[]) {
                    parts.push(`instrumentKeyList=${encodeURIComponent(key)}`);
                }
                return parts.join('&');
            },
        }),
};

// ── Portfolio Endpoints ──
// GET  /portfolio/ → PortfolioResponseDTO
// POST /portfolio/buyStock body: { stockSymbol, quantity, buyPrice, instrumentKey, isin }
// POST /portfolio/sellStock body: { stockSymbol, quantity, instrumentKey, sellingPrice }
// GET  /portfolio/transaction/{stockSymbol} → TransactionResponseDTO[]
// GET  /portfolio/transactions → TransactionResponseDTO[]
// GET  /portfolio/transactions/export → PDF blob
export const portfolioApi = {
    getPortfolio: () => api.get<PortfolioResponse>('/portfolio/'),

    // BuyStockRequestDTO: { stockSymbol, quantity, buyPrice, instrumentKey, isin }
    buyStock: (
        stockSymbol: string,
        quantity: number,
        buyPrice: number,
        instrumentKey: string,
        isin?: string
    ) =>
        api.post('/portfolio/buyStock', {
            stockSymbol,
            quantity,
            buyPrice,
            instrumentKey,
            isin: isin ?? '',
        }),

    // SellStockRequestDTO: { stockSymbol, quantity, instrumentKey, sellingPrice }
    sellStock: (
        stockSymbol: string,
        quantity: number,
        sellingPrice: number,
        instrumentKey: string
    ) =>
        api.post('/portfolio/sellStock', {
            stockSymbol,
            quantity,
            sellingPrice,
            instrumentKey,
        }),

    getTransactionsByStock: (stockSymbol: string) =>
        api.get<TransactionResponse[]>(`/portfolio/transaction/${encodeURIComponent(stockSymbol)}`),

    getTransactionHistory: () =>
        api.get<TransactionResponse[]>('/portfolio/transactions'),

    exportTransactionsPDF: () =>
        api.get('/portfolio/transactions/export', {responseType: 'blob'}),
};

// ── Auth Endpoints ──
// GET /auth/userInfo → UserInfoResponseDTO { userName, userEmailId, jwtToken, providerType }
// GET /auth/logout → clears JWT cookie, returns string
export const authApi = {
    getUserInfo: () => api.get<UserInfo>('/auth/userInfo'),
    logout: () => api.get('/auth/logout', { withCredentials: true }),
};

// ?? Chart Types ??
export interface CandleData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// ?? Charts Endpoints ??
// GET /charts/{instrumentKey}/intraday?unit=minutes&interval=15
// GET /charts/{instrumentKey}/history?range=1M&unit=day&interval=1
export const chartsApi = {
    intraday: (instrumentKey: string, unit = 'minutes', interval = '15') =>
        api.get(`/charts/${encodeURIComponent(instrumentKey)}/intraday`, { params: { unit, interval } }),

    history: (instrumentKey: string, range = '1M', unit = 'days', interval = '1') =>
        api.get(`/charts/${encodeURIComponent(instrumentKey)}/history`, { params: { range, unit, interval } }),
};


export default api;
