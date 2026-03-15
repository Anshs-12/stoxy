package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class WatchlistResponseDTO {
    // returns a full watchlist of a user with lightWeight stocks list!
    String watchlistName;
    List<WatchlistStockResponseDTO> watchlistStocks;
    LocalDateTime createdAt;

}
