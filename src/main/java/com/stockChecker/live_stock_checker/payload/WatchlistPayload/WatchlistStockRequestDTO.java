package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class WatchlistStockRequestDTO {
    // this is for request stockSymbol in addStockToWatchlist
    @NotBlank
    private String stockSymbol;
    @NotBlank
    private String instrumentKey;
    @NotNull
    @Positive
    private BigDecimal priceAddedAt;
}
