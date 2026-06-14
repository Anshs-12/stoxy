package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Portfolio;
import com.stockChecker.live_stock_checker.model.PortfolioStock;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PortfolioStockRepository extends JpaRepository<PortfolioStock, Long> {



    List<PortfolioStock> findByPortfolio(Portfolio portfolio);

    Optional<PortfolioStock> findByPortfolioAndStock_upstoxInstrumentKey(Portfolio portfolio, @NotNull String instrumentKey);
}
