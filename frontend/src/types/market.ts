// Backend: IndexPriceInfoDTO
export interface IndexPriceInfo {
  ffmc: number;
  indexSymbol: string;
  open: number;
  lastPrice: number;
  previousClose: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  dayHigh: number;
  dayLow: number;
  change: number;
  pChange: number;
  yearHigh: number;
  yearLow: number;
  nearWKH: number;
  nearWKL: number;
}

// Backend: IndexAdvanceDTO
export interface IndexAdvance {
  advances: number;
  declines: number;
  unChanged: number;
}

// Backend: IndexMetadataDTO
export interface IndexMetadata {
  indexPriority: number;
  numberOfConstituents: number;
  launchDate: string;
  baseDate: string;
  methodology: string;
  description: string;
  isActive: boolean;
}

// Backend: IndexDetailResponseDTO
export interface IndexDetail {
  indexName: string;
  indexSymbol: string;
  instrumentKey: string;
  indexMetadataDTO: IndexMetadata;
  indexAdvanceDTO: IndexAdvance | null;
  indexPriceInfoDTO: IndexPriceInfo | null;
}

// Backend: IndexSearchDTO (inside IndexSearchResponseDTO.indexSearchDTOList)
export interface IndexSearchResult {
  indexName: string;
  indexSymbol: string;
  exchange: string;
  segment: string;
  instrumentKey: string;
}

// Backend: IndexSearchResponseDTO
export interface IndexSearchResponse {
  indexSearchDTOList: IndexSearchResult[];
}

// Backend: IndexSearchDTO — request body for /analyze/index
export interface IndexSearchDTO {
  indexName: string;
  indexSymbol: string;
  exchange: string;
  segment: string;
  instrumentKey: string;
}

// Backend: MarketStatusResponse (GET /market/status)
export interface MarketStatus {
  isOpen: boolean;
  nextOpeningTime: string; // "09:15:00"
  nextOpeningDay: string;
  nextOpeningDate: string;
  lastClosingTime: string; // "15:30:00"
  lastClosingDay: string;
  lastClosingDate: string;
}

// Backend: MarketHolidayResponse (GET /market/holidays)
export interface MarketHoliday {
  date: string; // "2026-08-15"
  holidayName: string;
}
