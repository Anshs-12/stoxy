package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, String> {

    List<Stock> findByStockNameContainingIgnoreCaseOrStockSymbolContainingIgnoreCase(String query1,String query2);

    Optional<Stock> findByStockSymbol(String symbol);
}
