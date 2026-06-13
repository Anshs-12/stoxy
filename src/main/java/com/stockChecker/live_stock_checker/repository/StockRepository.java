package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Stock;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Integer>, JpaSpecificationExecutor<Stock> {

    @Query("SELECT s FROM Stock s WHERE LOWER(s.stockName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.stockSymbol) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Stock> searchStocks(@Param("query") String query);

    Optional<Stock> findByIsin(String isin);

    Optional<Stock> findByUpstoxInstrumentKey(@NotNull String instrumentKey);
}
