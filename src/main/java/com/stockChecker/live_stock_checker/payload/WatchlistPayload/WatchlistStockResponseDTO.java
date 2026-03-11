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
    String stockName;
    String stockSymbol;
    BigDecimal priceAddedAt;
    LocalDateTime addedAt;
}
