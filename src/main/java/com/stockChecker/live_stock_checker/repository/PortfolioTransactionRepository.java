package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.PortfolioTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {
}
