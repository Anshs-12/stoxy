package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.model.Company;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.StockFinancials;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.repository.CompanyRepository;
import com.stockChecker.live_stock_checker.repository.StockFinancialsRepository;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockDBService {

    // this class is made entirely for handling all the Stock Database related operations
    // as database related operations cannot be done in StockCacheService right and if these methods are
    // implemented in StockServiceImpl then we should be injected each of these classes in each other
    // which eventually  leads to circularDependency which should be avoided.

    private final StockRepository stockRepository;
    private final CompanyRepository companyRepository;
    private final StockFinancialsRepository stockFinancialsRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public Stock saveAllStockExchanges(StockSearchDTO stockRequest) {

        List<StockSearchDTO> stockSearchList = searchUpstoxEquity(stockRequest.getIsin());

        Company sharedCompanyProfile = fetchCompanyProfile(stockRequest);
        StockFinancials sharedStockFinancials = fetchFinancialMetrics(stockRequest);

        Stock requestedStock = null;
        for (var eachStock : stockSearchList) {

            Stock stock = Stock.builder()
                    .stockName(eachStock.getStockName())
                    .stockSymbol(eachStock.getStockSymbol())
                    .exchange(eachStock.getExchange())
                    .segment("EQ")
                    .isin(eachStock.getIsin())
                    .upstoxInstrumentKey(eachStock.getInstrumentKey())
                    .company(sharedCompanyProfile)
                    .stockFinancials(sharedStockFinancials)
                    .build();

            log.info("Saving new stock to DB - symbol: {}, isin: {}", eachStock.getStockSymbol(), eachStock.getIsin());
            stockRepository.save(stock);
            log.info("Stock saved successfully - symbol: {}", eachStock.getStockSymbol());
            if (eachStock.getInstrumentKey().equals(stockRequest.getInstrumentKey())) {
                requestedStock = stock;
            }
        }
        if (requestedStock == null) {
            throw new UpstoxFeedException("Requested stock not found in search results - symbol: " + stockRequest.getStockSymbol());
        }
        return requestedStock;
    }

    private Company fetchCompanyProfile(StockSearchDTO stockRequest) {
        log.debug("Fetching company profile from Upstox - isin: {}", stockRequest.getIsin());
        String jsonResponse = restClient.get()
                .uri("v2/fundamentals/{ISIN}/profile", stockRequest.getIsin())
                .retrieve()
                .body(String.class);
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (!root.path("status").asText().equals("success"))
                throw new UpstoxFeedException("Excpetion occured.");
            JsonNode dataNode = root.path("data");
            Company company = Company.builder()
                    .companyName(stockRequest.getCompanyName())
                    .description(dataNode.path("company_profile").asText())
                    .sector(dataNode.path("sector").asText())
                    .sectorMarketCap(dataNode.path("sector_market_cap_inr").path("formatted").asText())
                    .build();
            return companyRepository.save(company);
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to parse company data for: " + stockRequest.getIsin());
        }
    }

    private StockFinancials fetchFinancialMetrics(StockSearchDTO stockRequest) {
        log.debug("Fetching financial metrics from Upstox - isin: {}", stockRequest.getIsin());
        String jsonResponse = restClient.get()
                .uri("v2/fundamentals/{isin}/key-ratios", stockRequest.getIsin())
                .retrieve()
                .body(String.class);
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            StockFinancials stockFinancials = StockFinancials.builder().build();
            for (var node : root.path("data")) {
                String name = node.path("name").asText();
                double companyValue = Double.parseDouble(node.path("company_value").asText().replace("%", ""));
                double sectorValue = Double.parseDouble(node.path("sector_value").asText().replace("%", ""));
                switch (name) {
                    case "P/E" -> {
                        stockFinancials.setPe(companyValue);
                        stockFinancials.setSectorPe(sectorValue);
                    }
                    case "P/B" -> {
                        stockFinancials.setPb(companyValue);
                        stockFinancials.setSectorPb(sectorValue);
                    }
                    case "ROA" -> {
                        stockFinancials.setRoa(companyValue);
                        stockFinancials.setSectorRoa(sectorValue);
                    }
                    case "ROE" -> {
                        stockFinancials.setRoe(companyValue);
                        stockFinancials.setSectorRoe(sectorValue);
                    }
                }
            }
            return stockFinancialsRepository.save(stockFinancials);
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to parse key ratios for: " + stockRequest.getIsin());
        }
    }

    private List<StockSearchDTO> searchUpstoxEquity(String isIn) {
        String upstoxJsonResponse = restClient.get()
                .uri("/v2/instruments/search?query={isIn}", isIn)
                .retrieve()
                .body(String.class);
        return parseUpstoxSearchResults(upstoxJsonResponse);
    }

    private List<StockSearchDTO> parseUpstoxSearchResults(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (!root.path("status").asText().equals("success")) {
                throw new UpstoxFeedException("Error in searching via endpoint");
            }
            List<StockSearchDTO> upstoxResponseList = new ArrayList<>();
            for (var eachStockNode : root.path("data")) {
                if (!eachStockNode.path("isin").asText().startsWith("INE")) continue;
                StockSearchDTO stockResponse = StockSearchDTO.builder()
                        .stockSymbol(eachStockNode.path("trading_symbol").asText())
                        .stockName(eachStockNode.path("short_name").asText())
                        .companyName(eachStockNode.path("name").asText())
                        .exchange(eachStockNode.path("exchange").asText())
                        .instrumentKey(eachStockNode.path("instrument_key").asText())
                        .isin(eachStockNode.path("isin").asText())
                        .build();
                upstoxResponseList.add(stockResponse);
            }
            return upstoxResponseList;
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to parse Upstox search response");
        }
    }
}
