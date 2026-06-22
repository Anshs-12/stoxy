// ── Stock Search ──
// Backend: StockSearchDTO (used both as request and in search response)
export interface StockSearchResult {
  stockName: string;
  stockSymbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
  isin: string;
}

// Backend: StockSearchResponseDTO
export interface StockSearchResponse {
  content: StockSearchResult[];
}

// ── Stock Detail ──
// Backend: CompanyResponseDTO
export interface CompanyInfo {
  companyName: string;
  description: string;
  sector: string;
  sectorMarketCap: string;
}

// Backend: StockFinancialsDTO
export interface StockFinancials {
  pe: number;
  sectorPe: number;
  pb: number;
  sectorPb: number;
  roa: number;
  sectorRoa: number;
  roe: number;
  sectorRoe: number;
}

// Backend: StockDetailResponseDTO
export interface StockDetail {
  stockName: string;
  stockSymbol: string;
  exchange: string;
  isin: string;
  instrumentKey: string;
  stockFinancialsDTO: StockFinancials;
  companyResponseDTO: CompanyInfo;
}

// ── Screener ──
// Backend: StockScreenerResponseDTO
export interface ScreenerStockResult {
  stockName: string;
  stockSymbol: string;
  companyResponseDTO: CompanyInfo;
  stockFinancialsDTO: StockFinancials;
}

// Backend: StockScreenerDTO
export interface ScreenerResponse {
  content: ScreenerStockResult[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

// ── Ticker ──
// Backend: LtpcDataDTO
export interface LtpcData {
  instrumentKey: string;
  ltp: number;
  ltt: number;
  cp: number;
}

// Backend: FullFeedDataDTO (QuoteDTO market levels)
export interface QuoteLevel {
  bidQ: number;
  bidP: number;
  askQ: number;
  askP: number;
}

export interface FullFeedData {
  instrumentKey: string;
  ltp: number;
  ltt: number;
  cp: number;
  marketLevel: QuoteLevel[];
  atp: number;
  vtt: number;
  oi: number | null;
  iv: number | null;
  tbq: number;
  tsq: number;
  upper_circuit: number;
  lower_circuit: number;
}
