export interface CompanyInfo {
  companyName: string;
  aboutCompany: string;
  isIN: string;
  subIndustry: string;
  industry: string;
  sector: string;
  listingDate: string;
}

export interface StockPriceInfo {
  lastPrice: number;
  change: number;
  pChange: number;
  previousClose: number;
  open: number;
  close: number;
  dayHigh: number;
  dayLow: number;
  weekHigh: number;
  weekLow: number;
  weekHighDate: string;
  weekLowDate: string;
  lowerCP: number;
  upperCP: number;
  basePrice: number;
}

export interface StockFinancials {
  pe: number;
  sectorPe: number;
  faceValue: number;
  issuedSize: number;
  marketCap: number;
}

export interface StockDetail {
  stockName: string;
  stockSymbol: string;
  listedExchangeName: string;
  stockWebsite: string;
  stockPriceInfoDTO: StockPriceInfo;
  stockFinancialsDTO: StockFinancials;
  companyResponseDTO: CompanyInfo;
}

export interface StockSearchResult {
  stockName: string;
  stockSymbol: string;
}

export interface StockSearchResponse {
  content: StockSearchResult[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface ScreenerStockResult {
  stockName: string;
  stockSymbol: string;
  companyResponseDTO: CompanyInfo;
  stockFinancialsDTO: StockFinancials;
}

export interface ScreenerResponse {
  content: ScreenerStockResult[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
