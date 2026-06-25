package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.*;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketStatusService {

    /*
        1. LocalTime - just the time (no date, no timezone)
            Example: 9:15 AM, 3:30 PM
        2. LocalDate - just the date (no time, no timezone)
            Example: January 17, 2026.
        3. LocalDateTime - date + time (but no timezone)
            Example: January 17, 2026 at 9:15 AM
        4. ZonedDateTime - date + time + timezone
            Example: January 17, 2026 at 9:15 AM in India
    */
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    // Time constants
    private static final LocalTime marketOpen = LocalTime.of(9, 15);
    private static final LocalTime marketClose = LocalTime.of(15, 30);

    private final Set<String> holidaySet = new HashSet<>();

    //     ----- Cache Logic Variables -----
    private Boolean cachedMarketStatus = null;
    private long lastChecked = 0;
    private static final long CACHE_DURATION_MS = 30 * 60 * 1000;


    public MarketStatusResponse isMarketOpen() {

        ZonedDateTime currentIndianTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        DayOfWeek currentDay = currentIndianTime.getDayOfWeek();
        LocalTime currentTime = currentIndianTime.toLocalTime();
        LocalDate todayDate = currentIndianTime.toLocalDate();
        long currentTimeMillis = currentIndianTime.toInstant().toEpochMilli();

        boolean isMarketOpen = !isWeekend(currentDay)
                && !isHoliday(todayDate.toString())
                && getMarketStatus(todayDate.toString(), currentTimeMillis);

        return MarketStatusResponse.builder()
                .isOpen(isMarketOpen)
                .nextOpeningTime(marketOpen)
                .nextOpeningDay(getNextOpeningDate(todayDate, currentTime).getDayOfWeek().toString())
                .nextOpeningDate(getNextOpeningDate(todayDate, currentTime).toString())
                .lastClosingTime(marketClose)
                .lastClosingDay(getLastClosingDate(todayDate, currentTime).getDayOfWeek().toString())
                .lastClosingDate(getLastClosingDate(todayDate, currentTime).toString())
                .build();
    }

    private boolean isWeekend(DayOfWeek day) {
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private boolean getMarketStatus(String todayDate, long currentTimeInMillis) {

        //     ----- Cache Logic to avoid redundant API calls -----
        if (cachedMarketStatus != null && (currentTimeInMillis - lastChecked) < CACHE_DURATION_MS) {
            return cachedMarketStatus;
        }

        String marketTimingsResponse = restClient.get()
                .uri("/v2/market/timings/{date}", todayDate)
                .retrieve()
                .body(String.class);

        JsonNode root = null;
        try {
            root = objectMapper.readTree(marketTimingsResponse);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse market timings response", e);
        }

        boolean currentStatus = false;
        for (var eachData : root.path("data")) {
            // Process each exchange
            if (eachData.path("exchange").asText().equals("NSE")) {
                // Process NSE exchange data
                long start_time = eachData.path("start_time").asLong();
                long end_time = eachData.path("end_time").asLong();
                currentStatus = currentTimeInMillis >= start_time && currentTimeInMillis <= end_time;
            }
        }
        this.cachedMarketStatus = currentStatus;
        this.lastChecked = currentTimeInMillis;
        return currentStatus;
    }

    private boolean isHoliday(String todayDate) {
        return holidaySet.contains(todayDate);
    }

    @PostConstruct
    private void loadHolidays() {
        String response = restClient.get()
                .uri("/v2/market/holidays/")
                .retrieve()
                .body(String.class);
        try {
            JsonNode root = objectMapper.readTree(response);
            for (var each : root.path("data")) {
                if (!each.path("holiday_type").asText().equals("TRADING_HOLIDAY")) continue;
                for (var exchange : each.path("closed_exchanges")) {
                    if (exchange.asText().equals("NSE")) {
                        holidaySet.add(each.path("date").asText());
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch holidays on startup. Error: " + e.getMessage());
            System.err.println("Failed to fetch holidays on startup. Error: " + e.getMessage());
        }
    }

    private LocalDate getLastClosingDate(LocalDate todayDate, LocalTime currentTime) {
        LocalDate targetDate = todayDate;
        if (currentTime.isBefore(marketClose)) {
            targetDate = targetDate.minusDays(1);
        }
        while (isWeekend(targetDate.getDayOfWeek()) || isHoliday(targetDate.toString())) {
            targetDate = targetDate.minusDays(1);
        }
        return targetDate;
    }

    private LocalDate getNextOpeningDate(LocalDate todayDate, LocalTime currentTime) {
        LocalDate targetDate = todayDate;
        if (!currentTime.isBefore(marketOpen)) {
            targetDate = targetDate.plusDays(1);
        }
        while (isWeekend(targetDate.getDayOfWeek()) || isHoliday(targetDate.toString())) {
            targetDate = targetDate.plusDays(1);
        }
        return targetDate;
    }
}
