package com.stoxyfinance.repository;

import com.stoxyfinance.model.StockFinancials;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockFinancialsRepository extends JpaRepository<StockFinancials, Integer> {
}
