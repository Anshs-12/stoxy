package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.WatchlistStock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistStockRepository extends JpaRepository<WatchlistStock, Long> {
}
