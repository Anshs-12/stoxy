package com.stockChecker.live_stock_checker.tool;

import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.service.NewsAnalysisService;
import com.stockChecker.live_stock_checker.service.StockService;
import com.stockChecker.live_stock_checker.service.TickerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockAnalysisTools {

    private final StockService stockService;
    private final TickerService tickerService;
    private final NewsAnalysisService newsAnalysisService;

    @Tool(description = "Fetches stock information including price, fundamentals and company data.")
    public StockDetailResponseDTO getStockDetails(
            @ToolParam(description = "Upstox instrument key") String instrumentKey) {
        StockDetailResponseDTO response = stockService.getStockDetails(StockSearchDTO.builder()
                .instrumentKey(instrumentKey)
                .build());
        log.info("Fetched stock details for instrumentKey: {}", instrumentKey);
        log.info("StockDetailResponseDTO payload: {}", response);
        return response;
    }

    @Tool(description = "Fetches the latest ticker information for a given instrument key.")
    public FullFeedDataDTO getTickerInfo(
            @ToolParam(description = "Upstox instrument key") String instrumentKey) {
        Map<String, FullFeedDataDTO> tickerInfo = tickerService.getLiveFullFeedData(List.of(instrumentKey));
        log.info("Fetched ticker info for instrumentKey: {}", instrumentKey);
        log.info("StockDetailResponseDTO tickerInfo: {}", tickerInfo);
        return tickerInfo.get(instrumentKey);
    }

    @Tool(description = "Fetches the latest news and market sentiment for a given stock.")
    public String getStockNews(
            @ToolParam(description = "Stock name or symbol, e.g. HDFC Bank") String stockName) {
        String response = newsAnalysisService.getStockNews(stockName);
        log.info("Fetched stock news for: {}", stockName);
        log.info("StockDetailResponseDTO news: {}", response);
        return response;
    }

}

