package com.stoxyfinance.repository;

import com.stoxyfinance.model.Portfolio;
import com.stoxyfinance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    Optional<Portfolio> findByUser(User user);
}
