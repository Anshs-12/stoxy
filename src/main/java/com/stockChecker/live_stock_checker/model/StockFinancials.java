package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class StockFinancials {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serialNumber;

    private Double pe;
    private Double sectorPe;
//    private BigDecimal marketCap; // this changes as priceChanges = lastPrice × issuedSize

    private Double pb;
    private Double sectorPb;

    private Double roa;
    private Double sectorRoa;

    private Double roe;
    private Double sectorRoe;
}
