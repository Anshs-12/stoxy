package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    private Integer faceValue;
    private Long issuedSize;
//    private BigDecimal marketCap; // this changes as priceChanges = lastPrice × issuedSize

    @OneToOne
    @JoinColumn(name = "stock_id")
    private Stock stock;
}
