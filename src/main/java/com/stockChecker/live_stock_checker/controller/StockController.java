package com.stockChecker.live_stock_checker.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockScreenerDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockScreenerResponseDTO;
import com.stockChecker.live_stock_checker.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stocks")
public class StockController {

    @Autowired
    private StockService stockService;

    // search stock
    @GetMapping("/search")
    // this is when a user tries to search something, eg: "Ta" so it gives paginated result of all the stocks having "Ta".
    public ResponseEntity<StockResponse> searchStockByName(
            @RequestParam String query,
            @RequestParam(name = "pageNumber", defaultValue = "0", required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = "15", required = false) Integer pageSize,
            @RequestParam(name = "sortBy", defaultValue = "stockName", required = false) String sortBy,
            @RequestParam(name = "sortOrder", defaultValue = "asc", required = false) String sortOrder
    ) {
        StockResponse stockListDTO = stockService.searchStockByName(query, pageNumber, pageSize, sortBy, sortOrder);
        return new ResponseEntity<>(stockListDTO, HttpStatus.OK);
    }

    // get the entire stock object
    @GetMapping("/search/details/{stockSymbol}")
    public ResponseEntity<StockDetailResponseDTO> searchStockBySymbol(@PathVariable String stockSymbol) throws JsonProcessingException {
        StockDetailResponseDTO stockDetailDTO = stockService.getStockBySymbol(stockSymbol);
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

        StockScreenerDTO StockScreenerResponseDTO = stockService
                .searchScreenStocks(minPe, maxPe, sector, industry, pageNumber, pageSize, sortBy, sortOrder);
        return new ResponseEntity<>(StockScreenerResponseDTO, HttpStatus.OK);
    }
}
