package com.stockChecker.live_stock_checker.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;
import org.springframework.data.domain.Page;

import java.util.List;

public interface StockService {
    StockDetailResponseDTO getStockBySymbol(String symbol) throws JsonProcessingException;

    StockResponse searchStockByName(String query, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);
}
