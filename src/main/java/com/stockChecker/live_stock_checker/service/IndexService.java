package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchResponseDTO;


public interface IndexService {

    IndexDetailResponseDTO getIndexBySymbol(String indexSymbol);

    IndexSearchResponseDTO searchIndices(String query);
}
