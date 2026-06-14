package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.websocket.UpstoxWebSocketClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TickerServiceImpl implements TickerService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UpstoxWebSocketClient upstoxWebSocketClient;

    @Override
    public Map<String, LtpcDataDTO> getLiveLtpcData(List<String> instrumentKeyList) {
        Map<String, LtpcDataDTO> responseMap = new HashMap<>();
        List<String> missingKeys = new ArrayList<>();
        List<Object> responseValues = redisTemplate.opsForValue().multiGet(getRedisSyntaxKeys(instrumentKeyList, "LTPC:"));
        if (instrumentKeyList.size() != responseValues.size()) {
            throw new UpstoxFeedException("Redis multiGet returned unexpected size");
        }
        for (int i = 0; i < instrumentKeyList.size(); i++) {
            if (responseValues.get(i) == null) {
                missingKeys.add(instrumentKeyList.get(i));
            }
            responseMap.put(instrumentKeyList.get(i), (LtpcDataDTO) responseValues.get(i));
        }
        log.info("LTPC fetch - requested: {}, missing: {}", instrumentKeyList.size(), missingKeys.size());
        if (!missingKeys.isEmpty())
            upstoxWebSocketClient.onSubscribe(missingKeys, "sub", "ltpc");
        return responseMap;
    }

    @Override
    public Map<String, FullFeedDataDTO> getLiveFullFeedData(List<String> instrumentKeyList) {
        Map<String, FullFeedDataDTO> responseMap = new HashMap<>();
        List<String> missingKeys = new ArrayList<>();
        List<Object> responseValues = redisTemplate.opsForValue().multiGet(getRedisSyntaxKeys(instrumentKeyList, "FULL:"));
        if (instrumentKeyList.size() != responseValues.size()) {
            throw new UpstoxFeedException("Redis multiGet returned unexpected size");
        }
        for (int i = 0; i < instrumentKeyList.size(); i++) {
            if (responseValues.get(i) == null) {
                missingKeys.add(instrumentKeyList.get(i));
            }
            responseMap.put(instrumentKeyList.get(i), (FullFeedDataDTO) responseValues.get(i));
        }
        log.info("FullFeed fetch - requested: {}, missing: {}", instrumentKeyList.size(), missingKeys.size());
        if (!missingKeys.isEmpty())
            upstoxWebSocketClient.onSubscribe(missingKeys, "sub", "full");
        return responseMap;
    }

    private List<String> getRedisSyntaxKeys(List<String> instrumentKeyList, String mode) {
        return instrumentKeyList.stream()
                .map((eachKey) -> (mode + eachKey))
                .toList();
    }
}
