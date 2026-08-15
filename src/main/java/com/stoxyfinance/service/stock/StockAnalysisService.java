package com.stoxyfinance.service.stock;

import com.stoxyfinance.payload.StockPayload.StockSearchDTO;

public interface StockAnalysisService {
    String getStockAnalysis(StockSearchDTO stockSearchDTO);
}
