package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder


public class WatchlistDetailDTO {
    //  for a single watchlist with a full stock list
    String name;
}
