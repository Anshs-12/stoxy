package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TickerServiceImpl implements TickerService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Map<String, LtpcDataDTO> getLiveLtpcData(List<String> instrumentKeyList) {
        Map<String, LtpcDataDTO> responseMap = new HashMap<>();
        for (var key : instrumentKeyList) {
            LtpcDataDTO value = (LtpcDataDTO) redisTemplate.opsForValue().get("LTPC:" + key);
            responseMap.put(key, value);
        }
        return responseMap;
    }

    @Override
    public Map<String, FullFeedDataDTO> getLiveFullFeedData(List<String> instrumentKeyList) {
        Map<String, FullFeedDataDTO> responseMap = new HashMap<>();
        for (var key : instrumentKeyList) {
            FullFeedDataDTO value = (FullFeedDataDTO) redisTemplate.opsForValue().get("FULL:" + key);
            responseMap.put(key, value);
        }
        return responseMap;
    }
}
