package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;

import java.util.List;
import java.util.Map;

public interface TickerService {
    Map<String, LtpcDataDTO> getLiveLtpcData(List<String> instrumentKeyList);

    Map<String, FullFeedDataDTO> getLiveFullFeedData(List<String> instrumentKeyList);
}
