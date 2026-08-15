package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.service.index.IndexAnalysisService;
import com.stockChecker.live_stock_checker.service.stock.StockAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/analyze")
public class AnalysisController {

    private final StockAnalysisService stockAnalysisService;
    private final IndexAnalysisService indexAnalysisService;

    @PostMapping("/stock")
    public ResponseEntity<String> getStockAnalysis(@RequestBody StockSearchDTO stockSearchDTO) {
        String stockAnalysis = stockAnalysisService.getStockAnalysis(stockSearchDTO);
        return new ResponseEntity<>(stockAnalysis, HttpStatus.OK);
    }

    @PostMapping("/index")
    public ResponseEntity<String> getIndexAnalysis(@RequestBody IndexSearchDTO indexSearchDTO) {
        String indexAnalysis = indexAnalysisService.getIndexAnalysis(indexSearchDTO);
        return new ResponseEntity<>(indexAnalysis, HttpStatus.OK);
    }
}