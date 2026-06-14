package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.StockFinancials;
import com.stockChecker.live_stock_checker.payload.StockPayload.CompanyResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockFinancialsDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockCacheService {

    private final StockRepository stockRepository;
    private final ModelMapper modelMapper;
    private final StockDBService stockDBService;

    // ----------------------------- Stock Live Caching -----------------------------
    @Cacheable(
            cacheNames = "stockLive",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockLive(StockSearchDTO stockRequest) {
        log.info("Fetching LIVE stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    // ----------------------------- Stock Weekday Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekDayClosed",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekdayClosed(StockSearchDTO stockRequest) {
        log.info("Fetching WEEKDAY CLOSED stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    // ----------------------------- Stock Weekend Caching -----------------------------
    @Cacheable(
            cacheNames = "stockWeekendClosed",
            key = "#stockRequest.instrumentKey",
            condition = "#stockRequest.instrumentKey != null",
            unless = "#result == null"
    )
    public StockDetailResponseDTO getStockWeekendClosed(StockSearchDTO stockRequest) {
        log.info("Fetching WEEKEND CLOSED stock data for: {}", stockRequest.getStockName());
        return fetchCompleteStockData(stockRequest);
    }

    @Transactional
    public StockDetailResponseDTO fetchCompleteStockData(StockSearchDTO stockRequest) {
        log.info("Assembling complete stock data for: {} ({})", stockRequest.getStockSymbol(), stockRequest.getIsin());

        //checking database first.
        Stock stock = stockRepository.findByIsin(stockRequest.getIsin())
                .orElseGet(() -> stockDBService.saveStockInDB(stockRequest));

        // creating a DTO of the stock.
        StockDetailResponseDTO stockDTO = StockDetailResponseDTO.builder()
                .stockName(stock.getStockName())
                .stockSymbol(stock.getStockSymbol())
                .exchange(stock.getExchange())
                .isin(stock.getIsin())
                .instrumentKey(stock.getUpstoxInstrumentKey())
                .build();

        // attaching the companyInfo to the stock.
        stockDTO.setCompanyResponseDTO(mapCompanyDTO(stock));
        // attaching stockFinancials Info to the stock.
        stockDTO.setStockFinancialsDTO(mapStockFinancialsDTO(stock));
        // Combined stored metadata with real-time price data and returning complete StockFoundDTO
        return stockDTO;
    }

    private CompanyResponseDTO mapCompanyDTO(Stock stock) {
        if (stock.getCompany() == null) return null;
        return modelMapper.map(stock.getCompany(), CompanyResponseDTO.class);
    }

    private StockFinancialsDTO mapStockFinancialsDTO(Stock stock) {
        log.debug("StockFinancials from stock: {}", stock.getStockFinancials());
        if (stock.getStockFinancials() == null) return null;
        StockFinancials financials = stock.getStockFinancials();
//        BigDecimal marketCap = new BigDecimal(priceInfoNode.get("lastPrice").asText())
//                .multiply(new BigDecimal(financials.getIssuedSize()));
        return StockFinancialsDTO.builder()
                .pe(financials.getPe())
                .sectorPe(financials.getSectorPe())
                .pb(financials.getPb())
                .sectorPb(financials.getSectorPb())
                .roa(financials.getRoa())
                .sectorRoa(financials.getSectorRoa())
                .roe(financials.getRoe())
                .sectorRoe(financials.getSectorRoe())
                .build();
    }
}

//====================================================================================
// ---------------------NOTES-------------------------
//====================================================================================

/*
    checking if the stock is valid or not as both invalid and valid response's have 200 status codes.
    Now, to fix this, we would manually check if the error field exists->throw Exception

    Otherwise, if the "error" field doesn't exist, then it's a valid stockSymbol, and we got a valid
    realTime stock response.
 */


/*
    Understanding Mono<T> in SpringBoot

    So whenever you use a webClient, the output of it is always Mono, which can have different values like
    Mono<String> or Mono<ResponseEntity<String>> so on.

    understand mono to be a container, since the webclient is reactive in nature, allowing non-blocking asynchronous
    calling/execution of requests, so the value is empty first which is mono, but later on when the response is
    received, it has to be assigned somewhere again, so it gets filled in that mono container which was assigned
    to our variable.

    Initially, Mono is assigned until the response is received back, and as we get so, it gets filled by the response
    basically a container holding/reserving a place for the response to be kept in later when it's received.
*/