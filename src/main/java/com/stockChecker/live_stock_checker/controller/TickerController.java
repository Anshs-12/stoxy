package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.service.TickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ticker/live")
@RequiredArgsConstructor

public class TickerController {

    private final TickerService tickerService;

    @GetMapping("/ltpc")
    public ResponseEntity<Map<String, LtpcDataDTO>> getLtpcData(@RequestParam List<String> instrumentKeyList) {
        Map<String, LtpcDataDTO> ltpcDataDTO = tickerService.getLiveLtpcData(instrumentKeyList);
        return new ResponseEntity<>(ltpcDataDTO, HttpStatus.OK);
    }

    @GetMapping("/fullFeed")
    public ResponseEntity<Map<String, FullFeedDataDTO>> getFullFeedData(@RequestParam List<String> instrumentKeyList) {
        Map<String, FullFeedDataDTO> fullFeedDataDTOS = tickerService.getLiveFullFeedData(instrumentKeyList);
        return new ResponseEntity<>(fullFeedDataDTOS, HttpStatus.OK);
    }
}
