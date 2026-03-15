package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "watchlistStock_table")
public class WatchlistStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Watchlist watchList;

    @ManyToOne
    private Stock stock;

    private BigDecimal priceAddedAt;

    private LocalDateTime addedAt;

}

/*
    WatchlistStock → Stock: ManyToOne (many watchListStock entries can point to the same stock)
    WatchlistStock → Watchlist: ManyToOne (many entries belong to one watchlist)
*/

