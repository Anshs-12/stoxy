package com.stoxyfinance.controller;

import com.stoxyfinance.payload.IndexPayload.IndexSearchDTO;
import com.stoxyfinance.payload.StockPayload.StockSearchDTO;
import com.stoxyfinance.service.index.IndexAnalysisService;
import com.stoxyfinance.service.stock.StockAnalysisService;
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