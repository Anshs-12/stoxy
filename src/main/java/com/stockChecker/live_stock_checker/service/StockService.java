package com.stockChecker.live_stock_checker.service;


import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;

import java.util.List;

public interface StockService{
    StockDetailResponseDTO getStockBySymbol(String symbol);

    List<StockSearchResponseDTO> searchStockByName(String query);
}
