package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.StockNotFoundException;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.StockFinancials;
import com.stockChecker.live_stock_checker.payload.StockPayload.CompanyResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockFinancialsDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockPriceInfoDTO;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockCacheService {

    private final StockRepository stockRepository;

    private final ModelMapper modelMapper;

    private final RestClient restClient;

    private final ObjectMapper objectMapper;

    private final StockDBService stockDBService;

    // ----------------------------- Stock Live Caching -----------------------------
    @Cacheable(
            cacheNames = "stockLive",
            key = "#stockSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#stockSymbol !=null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockLive(String stockSymbol) throws JsonProcessingException {
        log.info("Fetching LIVE stock data for: {}", stockSymbol);
        return fetchCompleteStockData(stockSymbol);
    }

    // ----------------------------- Stock Weekday Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekDayClosed",
            key = "#stockSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#stockSymbol !=null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekdayClosed(String stockSymbol) throws JsonProcessingException {
        log.info("Fetching WEEKDAY CLOSED stock data for: {}", stockSymbol);
        return fetchCompleteStockData(stockSymbol);
    }

    // ----------------------------- Stock Weekend Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekendClosed",
            key = "#stockSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#stockSymbol !=null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekendClosed(String stockSymbol) throws JsonProcessingException {
        log.info("Fetching WEEKEND CLOSED stock data for: {}", stockSymbol);
        return fetchCompleteStockData(stockSymbol);
    }

    @Transactional
    private StockDetailResponseDTO fetchCompleteStockData(String stockSymbol) throws JsonProcessingException {
        log.info("Fetching from API and DB for stock: {}", stockSymbol);
        String jsonResponseString = fetchStockDataFromAPI(stockSymbol);
        JsonNode rootNode = objectMapper.readTree(jsonResponseString);

        if (rootNode.has("error") || rootNode.has("message")) {
            throw new StockNotFoundException("Stock not found: " + stockSymbol);
        }

        JsonNode infoNode = rootNode.get("info");
        JsonNode priceInfoNode = rootNode.get("priceInfo");

        // finding the stock through database otherwise saving it then.
        Stock stockFound = stockRepository.findByStockSymbol(stockSymbol.toUpperCase())
                .orElseGet(() -> stockDBService.saveStockInDB(stockSymbol, rootNode, infoNode));
        // Lazy Initialization - object creation delayed until first access

        // creating a DTO of the stockFound.
        StockDetailResponseDTO stockFoundDTO = modelMapper.map(stockFound, StockDetailResponseDTO.class);

        // attaching the priceInfo to the stock.
        stockFoundDTO.setStockPriceInfoDTO(mapStockPriceInfo(priceInfoNode));
        // attaching the companyInfo to the stock.
        stockFoundDTO.setCompanyResponseDTO(mapCompanyDTO(stockFound));
        // attaching stockFinancials Info to the stock.
        stockFoundDTO.setStockFinancialsDTO(mapStockFinancialsDTO(stockFound, priceInfoNode));
        // Combined stored metadata with real-time price data and returning complete StockFoundDTO
        return stockFoundDTO;
    }

    private String fetchStockDataFromAPI(String stockSymbol) {
        return restClient.get()
                .uri("/quote-equity?symbol=" + stockSymbol.toUpperCase())
                .retrieve()
                .body(String.class);
    }


    // private method which is being used in implementation and not allowed outside
    private StockPriceInfoDTO mapStockPriceInfo(JsonNode priceInfoNode) {
        StockPriceInfoDTO stockPriceInfoDTO = new StockPriceInfoDTO();
        stockPriceInfoDTO.setLastPrice(new BigDecimal(priceInfoNode.get("lastPrice").asText()));
        stockPriceInfoDTO.setChange(new BigDecimal(priceInfoNode.get("change").asText()));
        stockPriceInfoDTO.setPChange(new BigDecimal(priceInfoNode.get("pChange").asText()));
        stockPriceInfoDTO.setPreviousClose(new BigDecimal(priceInfoNode.get("previousClose").asText()));
        stockPriceInfoDTO.setOpen(new BigDecimal(priceInfoNode.get("open").asText()));
        stockPriceInfoDTO.setClose(new BigDecimal(priceInfoNode.get("close").asText()));
        // setting the high-low of the day
        stockPriceInfoDTO.setDayHigh(new BigDecimal(priceInfoNode.get("intraDayHighLow").get("max").asText()));
        stockPriceInfoDTO.setDayLow(new BigDecimal(priceInfoNode.get("intraDayHighLow").get("min").asText()));
        // setting the high-low of the week
        stockPriceInfoDTO.setWeekLow(new BigDecimal(priceInfoNode.get("weekHighLow").get("min").asText()));
        stockPriceInfoDTO.setWeekLowDate(priceInfoNode.get("weekHighLow").get("minDate").asText());
        stockPriceInfoDTO.setWeekHigh(new BigDecimal(priceInfoNode.get("weekHighLow").get("max").asText()));
        stockPriceInfoDTO.setWeekHighDate(priceInfoNode.get("weekHighLow").get("maxDate").asText());
        // setting the lowerCircuitPrice and upperCircuitPrice
        stockPriceInfoDTO.setLowerCP(new BigDecimal(priceInfoNode.get("lowerCP").asText()));
        stockPriceInfoDTO.setUpperCP(new BigDecimal(priceInfoNode.get("upperCP").asText()));
        // setting the basePrice
        stockPriceInfoDTO.setBasePrice(new BigDecimal(priceInfoNode.get("basePrice").asText()));
        return stockPriceInfoDTO;
    }

    private CompanyResponseDTO mapCompanyDTO(Stock stock) {
        if (stock.getCompany() == null) return null;
        return modelMapper.map(stock.getCompany(), CompanyResponseDTO.class);
    }

    private StockFinancialsDTO mapStockFinancialsDTO(Stock stock, JsonNode priceInfoNode) {
        log.info("StockFinancials from stock: {}", stock.getStockFinancials());
        if (stock.getStockFinancials() == null) return null;
        StockFinancials financials = stock.getStockFinancials();
        BigDecimal marketCap = new BigDecimal(priceInfoNode.get("lastPrice").asText())
                .multiply(new BigDecimal(financials.getIssuedSize()));
        return StockFinancialsDTO.builder()
                .pe(financials.getPe())
                .sectorPe(financials.getSectorPe())
                .faceValue(financials.getFaceValue())
                .issuedSize(financials.getIssuedSize())
                .marketCap(marketCap)
                .build();
    }

}

//====================================================================================
// ---------------------NOTES-------------------------
//====================================================================================

/*
    checking if the stock is valid or not as both invalid and valid response's have 200 status code.
    Now,to fix this we would manually check if error field exists->throw Exception

    Otherwise,if the "error" field doesn't exist then it's a valid stockSymbol, and we got a valid
    realTime stock response.
 */


/*
    Understanding Mono<T> in SpringBoot

    So whenever you use a webClient, the output of it is always Mono,which can have different values like
    Mono<String> or Mono<ResponseEntity<String>> so on.

    understand mono to be a container, since webclient is reactive in nature, allowing non-blocking asynchronous
    calling/execution of requests so the value is empty first which is mono but later on when the response is
    received, it has to be assigned somewhere again so it gets filled in that mono container which was assigned
    to our variable.

    Initially, Mono is assigned until the response is received back and as we get so it gets filled by the response
    basically a container holding/reserving a place for the response to be kept in later when its received.
*/