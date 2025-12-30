package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stocks")
public class StockController {

    @Autowired
    private StockService stockService;

    // search stock
    @GetMapping("/search")
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

    // get entire stock object
    @GetMapping("/search/{stockSymbol}")
    public ResponseEntity<StockDetailResponseDTO> searchStockBySymbol(@PathVariable String stockSymbol) {
        StockDetailResponseDTO stockDetailDTO = stockService.getStockBySymbol(stockSymbol);
        return new ResponseEntity<>(stockDetailDTO, HttpStatus.OK);
    }
}
