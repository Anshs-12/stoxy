package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LiveStockDetailDTO {

    private String symbol;
    private BigDecimal lastPrice;
    private BigDecimal change;
    private BigDecimal pChange; // percentage change

    private BigDecimal previousClose;
    private BigDecimal open;
    private BigDecimal close;
    private BigDecimal dayHigh;
    private BigDecimal dayLow;

    private BigDecimal weekHigh;
    private BigDecimal weekLow;

    private BigDecimal lowerCP;
    private BigDecimal upperCP;

    private BigDecimal basePrice;
}
