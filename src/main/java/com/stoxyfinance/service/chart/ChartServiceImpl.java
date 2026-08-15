package com.stoxyfinance.service.chart;

import com.stoxyfinance.payload.ChartsPayload.CandleDataDTO;
import com.stoxyfinance.payload.MarketStatusResponse;
import com.stoxyfinance.service.MarketStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartServiceImpl implements ChartService {

    private final MarketStatusService marketStatusService;
    private final ChartCacheService chartCacheService;

    @Override
    public List<CandleDataDTO> getHistoricalData(String instrumentKey, String unit, String interval, String range) {
        MarketStatusResponse status = marketStatusService.isMarketOpen();
        log.info("Fetching history chart data - instrumentKey: {}, marketOpen: {}", instrumentKey, status.getIsOpen());
        if (status.getIsOpen()) {
            return chartCacheService.getHistoryLive(instrumentKey, unit, interval, range);
        }
        if (status.getNextOpeningDay().equals("MONDAY")) {
            return chartCacheService.getHistoryWeekendClosed(instrumentKey, unit, interval, range);
        }
        return chartCacheService.getHistoryWeekDayClosed(instrumentKey, unit, interval, range);
    }

    @Override
    public List<CandleDataDTO> getIntradayData(String instrumentKey, String unit, String interval) {
        MarketStatusResponse status = marketStatusService.isMarketOpen();
        log.info("Fetching intraday chart data - instrumentKey: {}, marketOpen: {}", instrumentKey, status.getIsOpen());
        if (status.getIsOpen()) {
            return chartCacheService.getIntradayLive(instrumentKey, unit, interval);
        }
        if (status.getNextOpeningDay().equals("MONDAY")) {
            return chartCacheService.getIntradayWeekendClosed(instrumentKey, unit, interval);
        }
        return chartCacheService.getIntradayWeekDayClosed(instrumentKey, unit, interval);
    }
}