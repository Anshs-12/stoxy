package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

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

public class SellStockResponseDTO {

    private String stockSymbol;
    private BigDecimal price;
    private Integer quantitySold;
    private BigDecimal realizedPnL;
    private LocalDateTime soldAt;
}
