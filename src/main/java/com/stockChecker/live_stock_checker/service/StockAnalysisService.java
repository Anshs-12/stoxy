package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;

public interface StockAnalysisService {
    String getStockAnalysis(StockSearchDTO stockSearchDTO);
}
