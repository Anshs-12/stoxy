package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class CreateWatchRequestDTO {
    String watchlistName;
}
