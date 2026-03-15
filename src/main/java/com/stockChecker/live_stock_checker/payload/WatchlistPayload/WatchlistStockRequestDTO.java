package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class WatchlistStockRequestDTO {
    // this is for request stockSymbol in addStockToWatchlist or deleteStockFromWatchlist
    private String stockSymbol;
}
