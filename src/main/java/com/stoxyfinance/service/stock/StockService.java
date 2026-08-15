package com.stoxyfinance.service.stock;


import com.stoxyfinance.payload.StockPayload.StockDetailResponseDTO;
import com.stoxyfinance.payload.StockPayload.StockScreenerDTO;
import com.stoxyfinance.payload.StockPayload.StockSearchResponseDTO;
import com.stoxyfinance.payload.StockPayload.StockSearchDTO;

public interface StockService {
    StockDetailResponseDTO getStockDetails(StockSearchDTO stockRequest);

    StockSearchResponseDTO searchStockByName(String query);

    StockScreenerDTO searchScreenStocks(Double minPe, Double maxPe, String sector, String industry, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder);
}
