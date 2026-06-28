package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.ChartsPayload.CandleDataDTO;
import com.stockChecker.live_stock_checker.service.ChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/charts")
@RequiredArgsConstructor
public class ChartController {

    private final ChartService chartService;

    @GetMapping("/{instrumentKey}/history")
    public ResponseEntity<List<CandleDataDTO>> getHistoricalData(
            @PathVariable String instrumentKey,
            @RequestParam(required = false, defaultValue = "days") String unit,       // eg:  "minute", "days", "month"
            @RequestParam(required = false, defaultValue = "1") String interval,   // eg:  "1", "5", "15", "30"
            @RequestParam(required = false, defaultValue = "1M") String range) {  // range: "1W 1M 3M 6M 1Y 3Y 5Y ALL"

        List<CandleDataDTO> response = chartService.getHistoricalData(instrumentKey, unit, interval, range);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/{instrumentKey}/intraday")
    public ResponseEntity<List<CandleDataDTO>> getIntradayChartData(@PathVariable String instrumentKey,
                                                                    @RequestParam(defaultValue = "minutes") String unit,
                                                                    @RequestParam(defaultValue = "15") String interval) {
        List<CandleDataDTO> response = chartService.getIntradayData(instrumentKey, unit, interval);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
