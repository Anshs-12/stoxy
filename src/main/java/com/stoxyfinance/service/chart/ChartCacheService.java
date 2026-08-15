package com.stoxyfinance.service.chart;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoxyfinance.exceptions.UpstoxFeedException;
import com.stoxyfinance.payload.ChartsPayload.CandleDataDTO;
import com.stoxyfinance.payload.MarketStatusResponse;
import com.stoxyfinance.service.MarketStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartCacheService {

    private final MarketStatusService marketStatusService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    // ----------------------------- Intraday Live Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsIntradayLive",
            key = "#instrumentKey + ':' + #unit + ':' + #interval",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getIntradayLive(String instrumentKey, String unit, String interval) {
        log.info("Fetching LIVE intraday chart data for: {}", instrumentKey);
        return fetchIntraday(instrumentKey, unit, interval);
    }

    // ----------------------------- Intraday WeekDay Closed Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsIntradayWeekDayClosed",
            key = "#instrumentKey + ':' + #unit + ':' + #interval",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getIntradayWeekDayClosed(String instrumentKey, String unit, String interval) {
        log.info("Fetching WEEKDAY CLOSED intraday chart data for: {}", instrumentKey);
        return fetchIntraday(instrumentKey, unit, interval);
    }

    // ----------------------------- Intraday Weekend Closed Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsIntradayWeekendClosed",
            key = "#instrumentKey + ':' + #unit + ':' + #interval",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getIntradayWeekendClosed(String instrumentKey, String unit, String interval) {
        log.info("Fetching WEEKEND CLOSED intraday chart data for: {}", instrumentKey);
        return fetchIntraday(instrumentKey, unit, interval);
    }

    // ----------------------------- History Live Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsHistoryLive",
            key = "#instrumentKey + ':' + #unit + ':' + #interval + ':' + #range",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getHistoryLive(String instrumentKey, String unit, String interval, String range) {
        log.info("Fetching LIVE history chart data for: {}", instrumentKey);
        return fetchHistory(instrumentKey, unit, interval, range);
    }

    // ----------------------------- History WeekDay Closed Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsHistoryWeekDayClosed",
            key = "#instrumentKey + ':' + #unit + ':' + #interval + ':' + #range",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getHistoryWeekDayClosed(String instrumentKey, String unit, String interval, String range) {
        log.info("Fetching WEEKDAY CLOSED history chart data for: {}", instrumentKey);
        return fetchHistory(instrumentKey, unit, interval, range);
    }

    // ----------------------------- History Weekend Closed Caching -----------------------------
    @Cacheable(
            cacheNames = "chartsHistoryWeekendClosed",
            key = "#instrumentKey + ':' + #unit + ':' + #interval + ':' + #range",
            condition = "#instrumentKey != null",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CandleDataDTO> getHistoryWeekendClosed(String instrumentKey, String unit, String interval, String range) {
        log.info("Fetching WEEKEND CLOSED history chart data for: {}", instrumentKey);
        return fetchHistory(instrumentKey, unit, interval, range);
    }

    private List<CandleDataDTO> fetchIntraday(String instrumentKey, String unit, String interval) {
        JsonNode candles = getIntradayDataFromUpstox(instrumentKey, unit, interval);

        if (!candles.isEmpty()) {
            return parseCandles(candles);
        }

        // Intraday empty — fall back to historical (overnight dead window or holiday/weekend)
        MarketStatusResponse status = marketStatusService.isMarketOpen();
        String fromDate = status.getLastClosingDate();
        String toDate = LocalDate.now().toString();
        return parseCandles(getHistoricalDataFromUpstox(instrumentKey, unit, interval, fromDate, toDate));
    }

    private List<CandleDataDTO> fetchHistory(String instrumentKey, String unit, String interval, String range) {
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