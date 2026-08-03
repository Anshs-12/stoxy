package com.stockChecker.live_stock_checker.service;

public interface NewsAnalysisService {

    String getStockNews(String stockName);

    String getMarketIndexNews(String marketIndexName);
}
