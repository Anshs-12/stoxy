export interface PortfolioStock {
  stockName: string;
  stockSymbol: string;
  avgBuyingPrice: number;
  totalQuantity: number;
  currentValue: number;
  investedAmount: number;
  LTP: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
}

export interface PortfolioResponse {
  portfolioId: number;
  createdAt: string;
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

export interface TransactionResponse {
  stockSymbol: string;
  quantity: number;
  price: number;
  transactionType: string;
  transactionDate: string;
}
