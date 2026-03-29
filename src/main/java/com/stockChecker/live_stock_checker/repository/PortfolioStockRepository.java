package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Portfolio;
import com.stockChecker.live_stock_checker.model.PortfolioStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioStockRepository extends JpaRepository<PortfolioStock, Long> {

    Optional<PortfolioStock> findByPortfolioAndStock_stockSymbol(Portfolio portfolio, String stockSymbol);

    boolean existsByPortfolioAndStock_stockSymbol(Portfolio portfolio, String requestedStockSymbol);

    List<PortfolioStock> findByPortfolio(Portfolio portfolio);
}
