package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Portfolio;
import com.stockChecker.live_stock_checker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    Optional<Portfolio> findByUser(User user);
}
