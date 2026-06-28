package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.payload.ChartsPayload.CandleDataDTO;
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartServiceImpl implements ChartService {

    private final MarketStatusService marketStatusService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Override
    public List<CandleDataDTO> getHistoricalData(String instrumentKey, String unit, String interval, String range) {
        String toDate = LocalDate.now().toString();
        String fromDate = calculateFromDate(range);
        JsonNode candles = getHistoricalDataFromUpstox(instrumentKey, unit, interval, fromDate, toDate);
        return parseCandles(candles);
    }

    private String calculateFromDate(String range) {
        LocalDate today = LocalDate.now();
        return switch (range) {
            case "1W" -> today.minusWeeks(1).toString();
            case "1M" -> today.minusMonths(1).toString();
            case "3M" -> today.minusMonths(3).toString();
            case "6M" -> today.minusMonths(6).toString();
            case "1Y" -> today.minusYears(1).toString();
            case "3Y" -> today.minusYears(3).toString();
            case "5Y" -> today.minusYears(5).toString();
            case "10Y" -> today.minusYears(10).toString();
            default -> today.minusMonths(1).toString();
        };
    }

    @Override
    public List<CandleDataDTO> getIntradayData(String instrumentKey, String unit, String interval) {
        JsonNode candles;
        MarketStatusResponse status = marketStatusService.isMarketOpen();
        if (status.getIsOpen()) {
            candles = getIntradayDataFromUpstox(instrumentKey, unit, interval);
        } else {
            String fromDate = status.getLastClosingDate();
            String toDate = LocalDate.now().toString();
            candles = getHistoricalDataFromUpstox(instrumentKey, unit, interval, fromDate, toDate);
        }
        return parseCandles(candles);
    }

    private List<CandleDataDTO> parseCandles(JsonNode candles) {
        List<CandleDataDTO> candleList = new ArrayList<>();
        for (int i = candles.size() - 1; i >= 0; i--) {
            JsonNode candle = candles.get(i);
            candleList.add(CandleDataDTO.builder()
                    .date(candle.get(0).asText())
                    .open(candle.get(1).decimalValue())
                    .high(candle.get(2).decimalValue())
                    .low(candle.get(3).decimalValue())
                    .close(candle.get(4).decimalValue())
                    .volume(candle.get(5).asLong())
                    .build());
        }
        return candleList;
    }

    public JsonNode getHistoricalDataFromUpstox(String instrumentKey, String unit, String interval, String fromDate, String toDate) {
        String response = restClient.get()
                .uri("v3/historical-candle/{instrumentKey}/{unit}/{interval}/{toDate}/{fromDate}",
                        instrumentKey, unit, interval, toDate, fromDate)
                .retrieve()
                .body(String.class);
        JsonNode root = null;
        try {
            root = objectMapper.readTree(response);
        } catch (JsonProcessingException ex) {
            throw new UpstoxFeedException("Failed to parse historical candle data for: " + instrumentKey);
        }
        return root.path("data").path("candles");
    }

    public JsonNode getIntradayDataFromUpstox(String instrumentKey, String unit, String interval) {
        String response = restClient.get()
                .uri("v3/historical-candle/intraday/{instrumentKey}/{unit}/{interval}",
                        instrumentKey, unit, interval)
                .retrieve()
                .body(String.class);
        JsonNode root = null;
        try {
            root = objectMapper.readTree(response);
        } catch (JsonProcessingException ex) {
            throw new UpstoxFeedException("Failed to parse intraday candle data for: " + instrumentKey);
        }
        return root.path("data").path("candles");
    }
}
