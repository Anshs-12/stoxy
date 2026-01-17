package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import org.springframework.stereotype.Service;

import java.time.*;

@Service
public class MarketStatusService {

    /*
        LocalTime - just the time (no date, no timezone)
            Example: 9:15 AM, 3:30 PM
        LocalDate - just the date (no time, no timezone)
            Example: January 17, 2026.
        LocalDateTime - date + time (but no timezone)
            Example: January 17, 2026 at 9:15 AM
        ZonedDateTime - date + time + timezone
            Example: January 17, 2026 at 9:15 AM in India
    */

    // Time constants
    private static final LocalTime marketOpen = LocalTime.of(9, 15);
    private static final LocalTime marketClose = LocalTime.of(15, 30);

    public MarketStatusResponse isMarketOpen() {

        ZonedDateTime currentIndianTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        DayOfWeek currentDay = currentIndianTime.getDayOfWeek();
        LocalTime currentTime = currentIndianTime.toLocalTime();

        // to calculate the next working day if it's a weekday!
        LocalDate todayDate = currentIndianTime.toLocalDate();


        Boolean marketOpenNow = getMarketStatus(currentDay, currentTime);

        String lastClosingDay = String.valueOf(getLastClosingDay(todayDate, currentTime));
        String nextOpeningDay = String.valueOf(getNextOpeningDay(todayDate, currentTime));


        return MarketStatusResponse.builder()
                .isOpen(marketOpenNow)
                .lastClosingDay(lastClosingDay)
                .lastClosingTime(marketClose)
                .nextOpeningDay(nextOpeningDay)
                .nextOpeningTime(marketOpen)
                .build();
    }

    // Creating Helper functions to reduce redundant and repeating code.

    private boolean isWeekend(DayOfWeek day) {
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private Boolean getMarketStatus(DayOfWeek currentDay, LocalTime currentTime) {
        boolean isCurrTimeBeforeOpen = currentTime.isBefore(marketOpen);
        boolean isCurrTimeAfterClose = currentTime.isAfter(marketClose);

        if (isWeekend(currentDay) || isCurrTimeAfterClose || isCurrTimeBeforeOpen) {
            return false;
        }
        return true;
    }

    private DayOfWeek getLastClosingDay(LocalDate todayDate, LocalTime currentTime) {
        LocalDate previousDate = todayDate.minusDays(1);
        if (currentTime.isAfter(marketClose) && !isWeekend(todayDate.getDayOfWeek())) {
            return todayDate.getDayOfWeek();
        }
        if (isWeekend(todayDate.getDayOfWeek()) || previousDate.getDayOfWeek() == DayOfWeek.MONDAY) {
            return DayOfWeek.FRIDAY;
        }
        return previousDate.getDayOfWeek();
    }

    private DayOfWeek getNextOpeningDay(LocalDate todayDate, LocalTime currentTime) {
        LocalDate nextDate = todayDate.plusDays(1);
        if (currentTime.isBefore(marketOpen) && !isWeekend(todayDate.getDayOfWeek())) {
            return todayDate.getDayOfWeek();
        }
        if (isWeekend(todayDate.getDayOfWeek()) || todayDate.getDayOfWeek() == DayOfWeek.FRIDAY) {
            return DayOfWeek.MONDAY;
        }

        return nextDate.getDayOfWeek();
    }
}
