package com.stoxyfinance.service.index;

import com.stoxyfinance.payload.IndexPayload.IndexSearchDTO;

public interface IndexAnalysisService {
    String getIndexAnalysis(IndexSearchDTO indexSearchDTO);
}
