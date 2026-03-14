package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class WatchlistSummaryDTO {
    // This class basically is used for returning the list of all the watchlist of a user, so it should be lightweight!
    Long watchlistId;
    String watchlistName;
    LocalDateTime createdAt;
}

