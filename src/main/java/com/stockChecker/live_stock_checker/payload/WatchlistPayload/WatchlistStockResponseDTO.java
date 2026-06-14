package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class WatchlistStockResponseDTO {
    // lightWeight stock response object which would be sent when a watchlist is requested, instead of the entire stockObject!
    String stockName;
    String stockSymbol;
    String instrumentKey;
    BigDecimal priceAddedAt;
    LocalDateTime addedAt;
}
