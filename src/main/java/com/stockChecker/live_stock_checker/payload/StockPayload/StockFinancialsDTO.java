package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StockFinancialsDTO {

    private Double pe;
    private Double sectorPe;
    private Integer faceValue;
    private Long issuedSize;
    private BigDecimal marketCap;

}

