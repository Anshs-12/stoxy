package com.stoxyfinance.repository;

import com.stoxyfinance.model.Portfolio;
import com.stoxyfinance.model.PortfolioTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {
    List<PortfolioTransaction> findByPortfolioAndStockSymbol(Portfolio portfolio, String stockSymbol);

    List<PortfolioTransaction> findByPortfolioOrderByTransactionAtDesc(Portfolio portfolio);
}
