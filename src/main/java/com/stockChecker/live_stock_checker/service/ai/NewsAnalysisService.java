package com.stockChecker.live_stock_checker.service.ai;

public interface NewsAnalysisService {

    String getStockNews(String stockName);

    String getMarketIndexNews(String marketIndexName);
}
