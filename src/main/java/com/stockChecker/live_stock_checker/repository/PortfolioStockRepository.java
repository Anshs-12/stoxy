package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Portfolio;
import com.stockChecker.live_stock_checker.model.PortfolioStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface PortfolioStockRepository extends JpaRepository<PortfolioStock, Long> {

    List<PortfolioStock> findByPortfolio(Portfolio portfolio);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PortfolioStock> findByPortfolioAndStock_upstoxInstrumentKey(Portfolio portfolio, String instrumentKey);
}