package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.StockFinancials;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockFinancialsRepository extends JpaRepository<StockFinancials, Integer> {
}
