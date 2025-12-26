package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Stock {
    /*
        so these are the values of the stock that never changes,static data of a stock.
        then there are dynamic data like currentPrice, openingPrice, closingPrice, marketCap etc.
    */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serialNumber;

    @Column(unique = true,nullable = false)
    private String stockSymbol;

    private String stockName;
    private String aboutStock;
    private String listedExchangeName;
    private String stockWebsite;
}
