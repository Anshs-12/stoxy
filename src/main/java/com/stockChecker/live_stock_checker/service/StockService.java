package com.stockChecker.live_stock_checker.service;


import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockScreenerDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;

public interface StockService {
    StockDetailResponseDTO getStockDetails(StockSearchDTO stockRequest);

    StockSearchResponseDTO searchStockByName(String query);

    StockScreenerDTO searchScreenStocks(Double minPe, Double maxPe, String sector, String industry, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);
}
