package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PriceInfoDTO {

    private BigDecimal lastPrice;
    private BigDecimal change;
    private BigDecimal pChange; // percentage change


    private BigDecimal previousClose;
    private BigDecimal open;
    private BigDecimal close;

    // the high-low of the day
    private BigDecimal dayHigh;
    private BigDecimal dayLow;

    // the high-low of the week
    private BigDecimal weekHigh;
    private BigDecimal weekLow;
    private String weekLowDate;
    private String weekHighDate;

    private BigDecimal lowerCP;
    private BigDecimal upperCP;
    private BigDecimal basePrice;
}
