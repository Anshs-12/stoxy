package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Integer> {

//    @Query(" SELECT * FROM stock WHERE stock_name=?1 LIKE '%ta%' ORDER BY CASE WHEN stock_name=?2 I LIKE 'ta%'THEN 1 ELSE 2 END, stock_name LIMIT 15 OFFSET 0;")
    Page<Stock> findByStockNameContainingIgnoreCaseOrStockSymbolContainingIgnoreCase(String query1, String query2, Pageable pageable);

    Optional<Stock> findByStockSymbol(String symbol);
}
