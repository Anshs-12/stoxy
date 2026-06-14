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
    private LocalDateTime lastUpdatedAt;
    private BigDecimal totalInvestedValue;
    private List<PortfolioStockResponseDTO> stocks;
    private Map<String, BigDecimal> sectorBreakdown;
}
