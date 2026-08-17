export interface StockSearchDTO { stockName: string; stockSymbol: string; companyName: string; exchange: string; instrumentKey: string; isin: string }
export interface IndexSearchDTO { indexName: string; indexSymbol: string; exchange: string; segment: string; instrumentKey: string }
export interface StockFinancialsDTO { pe: number; sectorPe: number; pb: number; sectorPb: number; roa: number; sectorRoa: number; roe: number; sectorRoe: number }
export interface StockDetailResponseDTO { stockName: string; stockSymbol: string; exchange: string; isin: string; instrumentKey: string; stockFinancialsDTO: StockFinancialsDTO; companyResponseDTO?: { companyName: string; description: string; sector: string; sectorMarketCap: string } }
export interface IndexDetailResponseDTO { indexName: string; indexSymbol: string; instrumentKey: string; indexMetadataDTO?: { numberOfConstituents: number; launchDate: string; baseDate: string; methodology: string; description: string; isActive: boolean }; indexAdvanceDTO?: { advances: number; declines: number; unChanged: number }; indexPriceInfoDTO?: { open: number; lastPrice: number; previousClose: number; totalTradedVolume: number; totalTradedValue: number; dayHigh: number; dayLow: number; change: number; pChange: number; yearHigh: number; yearLow: number } }
export interface CandleDataDTO { date: string; open: number; high: number; low: number; close: number; volume: number }
export interface LtpcDataDTO { instrumentKey: string; ltp: number; ltt: number; cp: number }
export interface WatchlistSummaryDTO { watchlistId: number; watchlistName: string; createdAt: string }
export interface WatchlistDetailDTO { watchlistName: string; watchlistStocks: Array<{ stockName: string; stockSymbol: string; instrumentKey: string; priceAddedAt: number; addedAt: string }>; createdAt: string }
export interface PortfolioResponseDTO { portfolioId: number; lastUpdatedAt: string; totalInvestedValue: number; totalCurrentValue: number; totalUnrealizedPnL: number; totalUnrealizedPnLPercent: number; totalDayPnL: number; totalDayPnLPercent: number; stocks: Array<{ stockName: string; stockSymbol: string; avgBuyingPrice: number; totalQuantity: number; investedAmount: number; instrumentKey: string; currentValue: number; ltp: number; unrealizedPnL: number; unrealizedPnLPercent: number; dayPnL: number; dayPnLPercent: number }>; sectorBreakdown: Record<string, number> }
export interface TransactionResponseDTO { portfolioId: number; stockSymbol: string; quantity: number; price: number; type: string; transactionAt: string }
export interface UserInfoResponseDTO { userName: string; userEmailId: string; jwtToken: string; providerType: string }

const apiUrl = import.meta.env.VITE_API_URL ?? '/api/v2'
function url(path: string) { return `${apiUrl.replace(/\/$/, '')}${path}` }
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url(path), { credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers }, ...init })
  if (!response.ok) {
    const body = await response.text()
    if (response.status === 401) throw new Error('Sign in is required to generate AI analysis.')
    throw new Error(body || `Request failed (${response.status})`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  return (contentType.includes('application/json') ? response.json() : response.text()) as Promise<T>
}
export const stockApi = {
  search: (query: string) => apiFetch<{ content: StockSearchDTO[] }>(`/stocks/search?query=${encodeURIComponent(query)}`),
  details: (stock: StockSearchDTO) => apiFetch<StockDetailResponseDTO>('/stocks/details', { method: 'POST', body: JSON.stringify(stock) }),
  analyse: (stock: StockSearchDTO) => apiFetch<string>('/analyze/stock', { method: 'POST', body: JSON.stringify(stock) }),
}
export const indexApi = {
  search: (query: string) => apiFetch<{ indexSearchDTOList: IndexSearchDTO[] }>(`/index/search?query=${encodeURIComponent(query)}`),
  details: (instrumentKey: string) => apiFetch<IndexDetailResponseDTO>(`/index/search/${encodeURIComponent(instrumentKey)}`),
  analyse: (index: IndexSearchDTO) => apiFetch<string>('/analyze/index', { method: 'POST', body: JSON.stringify(index) }),
}
export const chartApi = {
  intraday: (instrumentKey: string, unit = 'minutes', interval = '15') => apiFetch<CandleDataDTO[]>(`/charts/${encodeURIComponent(instrumentKey)}/intraday?unit=${encodeURIComponent(unit)}&interval=${encodeURIComponent(interval)}`),
  history: (instrumentKey: string, range = '1M', unit = 'days', interval = '1') => apiFetch<CandleDataDTO[]>(`/charts/${encodeURIComponent(instrumentKey)}/history?range=${encodeURIComponent(range)}&unit=${encodeURIComponent(unit)}&interval=${encodeURIComponent(interval)}`),
}
export const tickerApi = {
  ltpc: (instrumentKeys: string[]) => apiFetch<Record<string, LtpcDataDTO>>(`/ticker/live/ltpc?${instrumentKeys.map(key => `instrumentKeyList=${encodeURIComponent(key)}`).join('&')}`),
}
export const watchlistApi = {
  all: () => apiFetch<WatchlistSummaryDTO[]>('/watchlist/'),
  detail: (id: number) => apiFetch<WatchlistDetailDTO>(`/watchlist/${id}`),
  create: (watchlistName: string) => apiFetch<WatchlistDetailDTO>('/watchlist/create', { method: 'POST', body: JSON.stringify({ watchlistName }) }),
  remove: (id: number) => apiFetch<void>(`/watchlist/${id}`, { method: 'DELETE' }),
  addStock: (id: number, stockSymbol: string, instrumentKey: string, priceAddedAt: number, isin = '') => apiFetch<void>(`/watchlist/${id}/stocks`, { method: 'POST', body: JSON.stringify({ stockSymbol, instrumentKey, isin, priceAddedAt }) }),
  removeStock: (id: number, stockInstrumentKey: string) => apiFetch<void>(`/watchlist/${id}/stocks?stockInstrumentKey=${encodeURIComponent(stockInstrumentKey)}`, { method: 'DELETE' }),
}
export const portfolioApi = {
  detail: () => apiFetch<PortfolioResponseDTO>('/portfolio/'),
  transactions: () => apiFetch<TransactionResponseDTO[]>('/portfolio/transactions'),
}
export const authApi = { user: () => apiFetch<UserInfoResponseDTO>('/auth/userInfo') }
