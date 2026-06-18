package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class PortfolioStockResponseDTO {

    private String stockName;
    private String stockSymbol;
    private BigDecimal avgBuyingPrice;
    private Integer totalQuantity;
    private BigDecimal investedAmount;
    private String instrumentKey;

    private BigDecimal currentValue;
    private BigDecimal ltp;
    private BigDecimal unrealizedPnL;
    private BigDecimal unrealizedPnLPercent;
    private BigDecimal dayPnL;
    private BigDecimal dayPnLPercent;
}
