package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.service.StockServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/stocks")
public class StockController {

    @Autowired
    private StockService stockService;

    // search stock
    @GetMapping("/search")
    public ResponseEntity<List<StockSearchResponseDTO>> searchStockByName(@RequestParam String query) {
        List<StockSearchResponseDTO> stockListDTO = stockService.searchStockByName(query);
        return new ResponseEntity<>(stockListDTO, HttpStatus.OK);
    }

    // get entire stock object
    @GetMapping("/search/{stockSymbol}")
    public ResponseEntity<StockDetailResponseDTO> searchStockBySymbol(@PathVariable String stockSymbol) {
        StockDetailResponseDTO stockDetailDTO = stockService.getStockBySymbol(stockSymbol);
        return new ResponseEntity<>(stockDetailDTO, HttpStatus.OK);
    }
}
