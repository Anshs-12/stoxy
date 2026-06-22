package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(
        name = "stock",
        indexes = {
                @Index(name = "idx_stock_symbol", columnList = "stock_symbol"),
                @Index(name = "idx_stock_name", columnList = "stock_name")
        }
)
public class Stock {
    /*
        so these are the values of the stock that never changes,static data of a stock.
        then there are dynamic data like currentPrice, openingPrice, closingPrice, marketCap etc.
    */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serialNumber;

    @Column(nullable = false)
    private String stockSymbol;
    @Column(nullable = false)
    private String stockName; // using short_name from the api
    private String exchange;
    private String segment;
    private String isin;

    @Column(unique = true, nullable = false)
    private String upstoxInstrumentKey;

    @JoinColumn(name = "companyInfo_id")
    @ManyToOne(fetch = FetchType.EAGER)
    private Company company;

    @JoinColumn(name = "stockFinancials_id")
    @ManyToOne(fetch = FetchType.EAGER)
    private StockFinancials stockFinancials;

//    @OneToMany(mappedBy = "stock")
//    private List<WatchlistStock> watchListStock;
//    The above relationship is optional in StockEntity as we would never stock.getWatchlist().
}
