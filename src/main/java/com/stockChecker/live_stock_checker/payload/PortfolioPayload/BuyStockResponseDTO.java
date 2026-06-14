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

public class BuyStockResponseDTO {

    private String stockSymbol;
    private String instrumentKey;
    private BigDecimal buyPrice;
    private Integer quantityBought;
    private LocalDateTime boughtAt;
}
