package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.service.StockAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/analyze")
public class AnalysisController {

    private final StockAnalysisService stockAnalysisService;

    @PostMapping("/stock")
    public ResponseEntity<String> getStockAnalysis(@RequestBody StockSearchDTO stockSearchDTO) {
        String stockAnalysis = stockAnalysisService.getStockAnalysis(stockSearchDTO);
        return new ResponseEntity<>(stockAnalysis, HttpStatus.OK);
    }
}