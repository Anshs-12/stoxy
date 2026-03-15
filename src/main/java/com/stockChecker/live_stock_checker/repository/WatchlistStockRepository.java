package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.model.WatchlistStock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistStockRepository extends JpaRepository<WatchlistStock, Long> {
    boolean existsByWatchListAndStock(Watchlist watchlist, Stock stock);

    void deleteByWatchListAndStock_StockSymbol(Watchlist watchlist, String stockSymbol);

    boolean existsByWatchListAndStock_StockSymbol(Watchlist watchlist, String stockSymbol);
}
