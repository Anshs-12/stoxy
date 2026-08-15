package com.stoxyfinance.service.ai;

public interface NewsAnalysisService {

    String getStockNews(String stockName);

    String getMarketIndexNews(String marketIndexName);
}
