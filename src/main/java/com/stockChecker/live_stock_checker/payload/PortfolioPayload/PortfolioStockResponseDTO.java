package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioStockResponseDTO {

    private String stockName;
    private String stockSymbol;
    private BigDecimal avgBuyingPrice;
    private Integer totalQuantity;
    private BigDecimal currentValue;
    private BigDecimal investedAmount;
    private BigDecimal LTP; // lastTradedPrice
    private BigDecimal unrealizedPnL;
    private BigDecimal unrealizedPnLPercent;
}
