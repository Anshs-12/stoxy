package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StockFinancialsDTO {

    private Double pe;
    private Double sectorPe;
    private Double pb;
    private Double sectorPb;

    private Double roa;
    private Double sectorRoa;

    private Double roe;
    private Double sectorRoe;
}

