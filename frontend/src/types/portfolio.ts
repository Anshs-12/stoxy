// Backend: PortfolioStockResponseDTO
export interface PortfolioStock {
  stockName: string;
  stockSymbol: string;
  avgBuyingPrice: number;
  totalQuantity: number;
  investedAmount: number;
  instrumentKey: string;
  currentValue: number;
  ltp: number;            // backend returns 'ltp' (lowercase)
  cp: number | null;      // previous close — frontend-enriched (may be null pre-fill)
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
}

// Backend: PortfolioResponseDTO
export interface PortfolioResponse {
  portfolioId: number;
  lastUpdatedAt: string;
  totalInvestedValue: number;
  totalCurrentValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  totalDayPnL: number;
  totalDayPnLPercent: number;
  stocks: PortfolioStock[];
  sectorBreakdown: Record<string, number>;
}

// Backend: TransactionResponseDTO
export interface TransactionResponse {
  portfolioId: number;
  stockSymbol: string;
  quantity: number;
  price: number;
  type: string;           // backend field is 'type', not 'transactionType'
  transactionAt: string;  // backend field is 'transactionAt', not 'transactionDate'
}
