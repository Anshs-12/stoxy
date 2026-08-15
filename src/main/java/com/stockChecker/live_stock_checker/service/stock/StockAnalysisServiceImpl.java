package com.stockChecker.live_stock_checker.service.stock;

import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.tool.StockAnalysisTools;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class StockAnalysisServiceImpl implements StockAnalysisService {

    private final ChatClient chatClient;
    private final StockAnalysisTools stockAnalysisTools;

    @Override
    public String getStockAnalysis(StockSearchDTO stockSearchDTO) {
        log.info("Analysis | Fetching stock analysis for instrumentKey: {} and stockName: {}", stockSearchDTO.getInstrumentKey(), stockSearchDTO.getStockName());
        return chatClient.prompt()
                .user(u -> u.text("""
                                Analyze the stock with instrumentKey: {instrumentKey} and stock name: {stockName}.
                                Use the available tools to fetch fundamentals/company data, live ticker data
                                (price, volume, market depth), and recent news before answering.
                                """)
                        .param("instrumentKey", stockSearchDTO.getInstrumentKey())
                        .param("stockName", stockSearchDTO.getStockName()))
                .tools(stockAnalysisTools)
                .call()
                .content();
    }
}
