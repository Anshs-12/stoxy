package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.ChartsPayload.CandleDataDTO;

import java.util.List;

public interface ChartService {
    List<CandleDataDTO> getHistoricalData(String instrumentKey,
                                          String unit,
                                          String interval,
                                          String range);

    List<CandleDataDTO> getIntradayData(String instrumentKey,
                                        String unit,
                                        String interval);
}
