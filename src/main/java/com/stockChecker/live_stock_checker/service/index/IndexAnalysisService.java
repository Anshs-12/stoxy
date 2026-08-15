package com.stockChecker.live_stock_checker.service.index;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchDTO;

public interface IndexAnalysisService {
    String getIndexAnalysis(IndexSearchDTO indexSearchDTO);
}
