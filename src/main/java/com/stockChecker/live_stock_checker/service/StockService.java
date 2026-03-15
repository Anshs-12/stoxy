package com.stockChecker.live_stock_checker.service;


import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockScreenerDTO;

public interface StockService {
    StockDetailResponseDTO getStockBySymbol(String symbol);

    StockResponse searchStockByName(String query, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);

    StockScreenerDTO searchScreenStocks(Double minPe, Double maxPe, String sector, String industry, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);
}
