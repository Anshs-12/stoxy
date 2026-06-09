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

    public Stock saveStockInDB(StockSearchDTO stockRequest) {

        Company company = fetchCompanyProfile(stockRequest);
        StockFinancials stockFinancials = fetchFinancialMetrics(stockRequest);

        Stock stock = Stock.builder()
                .stockName(stockRequest.getStockName())
                .stockSymbol(stockRequest.getStockSymbol())
                .exchange(stockRequest.getExchange())
                .segment("EQ")
                .isin(stockRequest.getIsin())
                .upstoxInstrumentKey(stockRequest.getInstrumentKey())
                .company(company)
                .build();
        stockRepository.save(stock);
        stockFinancials.setStock(stock);
        stockFinancialsRepository.save(stockFinancials);
        stock.setStockFinancials(stockFinancials);
        return stock;
    }

    private Company fetchCompanyProfile(StockSearchDTO stockRequest) {
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
            return stockFinancials;
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to parse key ratios for: " + stockRequest.getIsin());
        }
    }
}
