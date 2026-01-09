package com.stockChecker.live_stock_checker.payload;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class IndexDetailResponseDTO {


    private IndexAdvance indexAdvance;

    private String name;

    private String time;

    private BigDecimal ffmc;// free float market cap

    private String indexIdentifier;
    private String indexSymbol;

    private BigDecimal open;
    private BigDecimal lastPrice;
    private BigDecimal previousClose;

    private BigDecimal totalTradedVolume;
    private BigDecimal totalTradedValue;

    private BigDecimal dayHigh;
    private BigDecimal dayLow;

    private BigDecimal change;
    private BigDecimal pChange;

    private BigDecimal yearHigh;
    private BigDecimal yearLow;

    private BigDecimal nearWKH;
    private BigDecimal nearWKL;
}
