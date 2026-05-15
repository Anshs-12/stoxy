export interface WatchlistSummary {
  watchlistId: number;
  watchlistName: string;
  createdAt: string;
}

export interface WatchlistStock {
  stockName: string;
  stockSymbol: string;
  priceAddedAt: number;
  addedAt: string;
}

export interface WatchlistDetail {
  watchlistName: string;
  watchlistStocks: WatchlistStock[];
  createdAt: string;
}
