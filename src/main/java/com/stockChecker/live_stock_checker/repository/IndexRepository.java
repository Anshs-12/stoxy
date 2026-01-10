package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.MarketIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IndexRepository extends JpaRepository<MarketIndex,Long> {
    Optional<MarketIndex> findByIndexSymbol(String upperCase);
}
