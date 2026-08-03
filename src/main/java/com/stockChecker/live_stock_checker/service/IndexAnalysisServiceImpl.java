package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchDTO;
import com.stockChecker.live_stock_checker.tool.IndexAnalysisTool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexAnalysisServiceImpl implements IndexAnalysisService {

    private final ChatClient chatClient;
    private final IndexAnalysisTool indexAnalysisTool;

    @Override
    public String getIndexAnalysis(IndexSearchDTO indexSearchDTO) {
        log.info("Analysis | Fetching index analysis for instrumentKey: {} and indexName: {}", indexSearchDTO.getInstrumentKey(), indexSearchDTO.getIndexName());
        return chatClient.prompt()
                .user(u -> u.text("""
                                Analyze the market index with instrumentKey: {instrumentKey} and index name: {indexName}.
                                Use the available tools to fetch the index's current market data
                                (price, movement, volume, market depth) and recent news/sentiment before answering.
                                Base your analysis on overall index trend, volatility, and market sentiment
                                rather than company-specific fundamentals.
                                """)
                        .param("instrumentKey", indexSearchDTO.getInstrumentKey())
                        .param("indexName", indexSearchDTO.getIndexName()))
                .tools(indexAnalysisTool)
                .call()
                .content();
    }
}
