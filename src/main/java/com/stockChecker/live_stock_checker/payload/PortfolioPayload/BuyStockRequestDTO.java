package com.stockChecker.live_stock_checker.payload.PortfolioPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyStockRequestDTO {

    private String stockSymbol;
    private Integer quantity;

}
