package com.stoxyfinance.service.ticker;

import com.stoxyfinance.payload.WebsocketPayload.FullFeedDataDTO;
import com.stoxyfinance.payload.WebsocketPayload.LtpcDataDTO;

import java.util.List;
import java.util.Map;

public interface TickerService {
    Map<String, LtpcDataDTO> getLiveLtpcData(List<String> instrumentKeyList);

    Map<String, FullFeedDataDTO> getLiveFullFeedData(List<String> instrumentKeyList);
}
