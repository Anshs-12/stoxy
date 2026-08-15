package com.stoxyfinance.repository;

import com.stoxyfinance.model.Stock;
import com.stoxyfinance.model.Watchlist;
import com.stoxyfinance.model.WatchlistStock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistStockRepository extends JpaRepository<WatchlistStock, Long> {
    boolean existsByWatchListAndStock(Watchlist watchlist, Stock stock);

    void deleteByWatchListAndStock_UpstoxInstrumentKey(Watchlist watchlist, String instrumentKey);

    boolean existsByWatchListAndStock_UpstoxInstrumentKey(Watchlist watchlist, String instrumentKey);
}
