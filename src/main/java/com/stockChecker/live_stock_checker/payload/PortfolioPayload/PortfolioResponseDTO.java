package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioResponseDTO {

    private Long portfolioId;
    private LocalDateTime createdAt;
    private BigDecimal investedValue;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalUnrealizedPnL;
    private List<PortfolioStockResponseDTO> stocks;
}
