package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import com.stockChecker.live_stock_checker.service.MarketStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/market")
@RequiredArgsConstructor
public class MarketStatusController {

    private final MarketStatusService marketStatusService;

    @GetMapping("/status")
    public ResponseEntity<MarketStatusResponse> getMarketStatus() {
        return new ResponseEntity<>(marketStatusService.isMarketOpen(), HttpStatus.OK);
    }
}
