package com.stockChecker.live_stock_checker.service.ai;

import org.springframework.ai.document.Document;

import java.util.List;

public interface TavilyService {

    List<Document> getTavilySearchResults(String stockName, String query);
}
