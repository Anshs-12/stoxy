package com.stockChecker.live_stock_checker.startup;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import com.stockChecker.live_stock_checker.service.StockCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockDataSeeder {

    private final StockRepository stockRepository;

    private final StockCacheService stockCacheService;

    private final RestClient restClient;

    private final ObjectMapper objectMapper;

    @Async
    public void stockDataSeederMethod() {
        long stockCount = stockRepository.count();
        if (stockCount >= 450) {
            // stocks are already present, database if full!
            log.info("Seeding skipped, DB already has {} stocks", stockCount);
            return;
        }
        // fill the database again by truncating it
        JsonNode rootNode = null;
        try {
            rootNode = objectMapper.readTree(fetchDataFromAPI());
        } catch (JsonProcessingException ex) {
            log.error("Error while Json Parsing in StockDataSeeder", ex);
            return; // add this
        }
        JsonNode dataNode = rootNode.get("data");
        boolean skipPriorityFlag = false;
        // this skiPriorityFlag might not make a huge difference
        // as each time only a single boolean variable would be checked
        // rather than getting the content from the JsonNode.
        log.info("Starting stock data seeding...");
        for (JsonNode eachStockNode : dataNode) {
            if (!skipPriorityFlag && eachStockNode.get("priority").asInt() == 1) {
                skipPriorityFlag = true;
                continue;
            }
            String eachStockSymbol = eachStockNode.get("symbol").asText();
            try {
                stockCacheService.fetchCompleteStockData(eachStockSymbol);
                Thread.sleep(300);
            } catch (Exception ex) {
                log.error("Stock with stockSymbol: {}, failed to add in the database", eachStockSymbol, ex);
            }
        }
        log.info("Seeding complete. Total stocks in DB: {}", stockRepository.count());
    }

    private String fetchDataFromAPI() {
        return restClient.get()
                .uri("equity-stockIndices?index=NIFTY 500")
                .retrieve()
                .body(String.class);
    }

}
