package com.stockChecker.live_stock_checker.tool;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.service.index.IndexService;
import com.stockChecker.live_stock_checker.service.ai.NewsAnalysisService;
import com.stockChecker.live_stock_checker.service.ticker.TickerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class IndexAnalysisTool {

    private final IndexService indexService;
    private final TickerService tickerService;
    private final NewsAnalysisService newsAnalysisService;

    @Tool(description = "Fetches market index information metadata")
    public IndexDetailResponseDTO getMarketIndexDetails(
            @ToolParam(description = "Upstox instrument key") String instrumentKey) {
        IndexDetailResponseDTO response = indexService.getIndexByInstrumentKey(instrumentKey);
        log.info("Analysis | Fetched market index details for instrumentKey: {}", instrumentKey);
        return response;
    }

    @Tool(description = "Fetches the latest ticker information for a given instrument key.")
    public FullFeedDataDTO getTickerInfo(
            @ToolParam(description = "Upstox instrument key") String instrumentKey) {
        Map<String, FullFeedDataDTO> tickerInfo = tickerService.getLiveFullFeedData(List.of(instrumentKey));
        log.info("Analysis | Fetched ticker info for instrumentKey: {}", instrumentKey);
        return tickerInfo.get(instrumentKey);
    }

    @Tool(description = "Fetches the latest news and market sentiment for a given market index.")
    public String getMarketIndexNews(
            @ToolParam(description = "Market Index name, eg: NIFTY") String indexName) {
        String response = newsAnalysisService.getMarketIndexNews(indexName);
        log.info("Analysis | Fetched market index news for: {}", indexName);
        return response;
    }
}

