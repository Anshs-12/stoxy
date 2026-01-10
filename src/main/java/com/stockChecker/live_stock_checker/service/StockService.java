package com.stockChecker.live_stock_checker.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockResponse;

public interface StockService {
    StockDetailResponseDTO getStockBySymbol(String symbol) throws JsonProcessingException;

    StockResponse searchStockByName(String query, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);
}
