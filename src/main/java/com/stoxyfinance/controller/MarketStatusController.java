package com.stoxyfinance.controller;

import com.stoxyfinance.payload.MarketHolidayResponse;
import com.stoxyfinance.payload.MarketStatusResponse;
import com.stoxyfinance.service.MarketStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/market")
@RequiredArgsConstructor
public class MarketStatusController {

    private final MarketStatusService marketStatusService;

    @GetMapping("/status")
    public ResponseEntity<MarketStatusResponse> getMarketStatus() {
        return new ResponseEntity<>(marketStatusService.isMarketOpen(), HttpStatus.OK);
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<MarketHolidayResponse>> getHolidays() {
        return new ResponseEntity<>(marketStatusService.getHolidays(), HttpStatus.OK);
    }
}
