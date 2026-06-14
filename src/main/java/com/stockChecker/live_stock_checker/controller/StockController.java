package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockScreenerDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stocks")
@Slf4j
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    // search stock
    @GetMapping("/search")
    // this is when a user tries to search something, eg: "Ta" so it gives a paginated result of all the stocks having "Ta".
    public ResponseEntity<StockSearchResponseDTO> searchStockByName(@RequestParam String query) {
        log.info("Stock search request - query: {}", query);
        StockSearchResponseDTO stockListDTO = stockService.searchStockByName(query);
        return new ResponseEntity<>(stockListDTO, HttpStatus.OK);
    }

    // get the entire stock object
    @PostMapping("/details")
    public ResponseEntity<StockDetailResponseDTO> searchStockBySymbol(@RequestBody StockSearchDTO stockRequest) {
        log.info("Stock detail request - symbol: {}", stockRequest.getStockSymbol());
        StockDetailResponseDTO stockDetailDTO = stockService.getStockDetails(stockRequest);
        return new ResponseEntity<>(stockDetailDTO, HttpStatus.OK);
    }

    // screen
    @GetMapping("/search/screen")
    public ResponseEntity<StockScreenerDTO> searchScreenStocks(
            @RequestParam(required = false) Double minPe,
            @RequestParam(required = false) Double maxPe,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String industry,

            @RequestParam(name = "pageNumber", defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = "15", required = false) Integer pageSize,
            @RequestParam(name = "sortBy", defaultValue = "stockName", required = false) String sortBy,
            @RequestParam(name = "sortOrder", defaultValue = "asc", required = false) String sortOrder
    ) {
        log.info("Stock screen request - minPe: {}, maxPe: {}, sector: {}, industry: {}", minPe, maxPe, sector, industry);
        StockScreenerDTO StockScreenerResponseDTO = stockService
                .searchScreenStocks(minPe, maxPe, sector, industry, pageNumber, pageSize, sortBy, sortOrder);
        return new ResponseEntity<>(StockScreenerResponseDTO, HttpStatus.OK);
    }
}
