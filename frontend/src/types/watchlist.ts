// Backend: WatchlistSummaryDTO
export interface WatchlistSummary {
  watchlistId: number;
  watchlistName: string;
  createdAt: string;
}

// Backend: WatchlistStockResponseDTO
export interface WatchlistStock {
  stockName: string;
  stockSymbol: string;
  instrumentKey: string;
  priceAddedAt: number;
  addedAt: string;
}

// Backend: WatchlistResponseDTO
export interface WatchlistDetail {
  watchlistName: string;
  watchlistStocks: WatchlistStock[];
  createdAt: string;
}
