package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class PortfolioResponseDTO {

    private Long portfolioId;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdatedAt;
    private BigDecimal totalInvestedValue;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalUnrealizedPnL;
    private BigDecimal totalUnrealizedPnLPercent;
    private BigDecimal totalDayPnL;
    private BigDecimal totalDayPnLPercent;
    private List<PortfolioStockResponseDTO> stocks;
    private Map<String, BigDecimal> sectorBreakdown;
}
