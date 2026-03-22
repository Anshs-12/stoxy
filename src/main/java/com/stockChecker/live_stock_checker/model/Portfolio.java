package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private User user;

    private LocalDateTime createdAt;
}
/*
    Normally, we would have a list of stocks in the portfolio.
    But for now, we are not using it as we are going to call the PortfolioStock directly in the
    service layer when the endpoint is called.

    This prevents unwanted database calls when a portfolio object or endpoint is called and gives us
    full control of when the database is being called explicitly!;

    Basically, if we look into Watchlist, we have a List<WatchlistStock> which gets loaded whenever
    the watchlist is fetched, so that is harmful as sometimes we don't even need the list of the watchlistStock
    but inturn gets fetched automatically by JPA internally.

    So here the flow is we would not have the List<PortfolioStock> defined here, and rather call
    the portfolioStockRepository.findByPortfolio(Portfolio portfolio) to get the list of stocks of the current
    portfolio fetch and attach it in the response when sending back!
*/