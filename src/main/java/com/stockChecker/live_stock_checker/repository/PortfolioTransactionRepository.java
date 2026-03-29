package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Portfolio;
import com.stockChecker.live_stock_checker.model.PortfolioTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {
    List<PortfolioTransaction> findByPortfolioAndStockSymbol(Portfolio portfolio, String stockSymbol);

    List<PortfolioTransaction> findByPortfolioOrderByTransactionAtDesc(Portfolio portfolio);
}
