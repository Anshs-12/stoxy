package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.QuoteDTO;
import com.stockChecker.live_stock_checker.websocket.UpstoxWebSocketClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TickerServiceImpl implements TickerService {

    private final RestClient restClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UpstoxWebSocketClient upstoxWebSocketClient;
    private final MarketStatusService marketStatusService;
    private final ObjectMapper objectMapper;

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
        if (!missingKeys.isEmpty()) {
            // 1. ALWAYS trigger the REST fallback to instantly populate missing data
            log.info("Cache miss for {} keys. Fetching REST snapshot.", missingKeys.size());
            Map<String, FullFeedDataDTO> dummyFullMap = new HashMap<>();
            fetchMarketQuoteData(responseMap, dummyFullMap, missingKeys);

            // 2. Upgrade to live stream if the market is open
            if (marketStatusService.isMarketOpen().getIsOpen()) {
                log.info("Market is open. Upgrading missing keys to WebSocket stream.");
                upstoxWebSocketClient.onSubscribe(missingKeys, "sub", "ltpc");
            } else {
                log.info("Market is closed. Serving REST snapshot only.");
            }
        }
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
        if (!missingKeys.isEmpty()) {
            // 1. ALWAYS trigger the REST fallback to instantly populate missing data
            log.info("Cache miss for {} keys. Fetching REST snapshot for Full Feed.", missingKeys.size());
            Map<String, LtpcDataDTO> dummyLtpcMap = new HashMap<>();
            fetchMarketQuoteData(dummyLtpcMap, responseMap, missingKeys);

            // 2. Upgrade to live stream if the market is open
            if (marketStatusService.isMarketOpen().getIsOpen()) {
                log.info("Market is open. Upgrading missing keys to Full Feed WebSocket stream.");
                upstoxWebSocketClient.onSubscribe(missingKeys, "sub", "full");
            } else {
                log.info("Market is closed. Serving REST snapshot only.");
            }
        }
        return responseMap;
    }


    public void fetchMarketQuoteData(Map<String, LtpcDataDTO> ltpcResponseMap,
                                     Map<String, FullFeedDataDTO> fullFeedResponseMap,
                                     List<String> missingKeys) {
        String result = String.join(",", missingKeys);
        String response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/market-quote/quotes")
                        .queryParam("instrument_key", result)
                        .build())
                .retrieve()
                .body(String.class);
        JsonNode rootNode = null;
        try {
            rootNode = objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
            throw new UpstoxFeedException("Error parsing JSON response: " + e.getMessage());
        }
        for (var data : rootNode.get("data")) {
            FullFeedDataDTO fullfeedDTO = FullFeedDataDTO.builder()
                    .instrumentKey(data.path("instrument_token").asText())
                    .lastTradedPrice(BigDecimal.valueOf(data.path("last_price").asDouble()))
                    .lastTradedTime(data.path("last_trade_time").asLong())
                    .closePrice(BigDecimal.valueOf(data.path("ohlc").path("close").asDouble()))
                    .averageTradedPrice(BigDecimal.valueOf(data.path("average_price").asDouble()))
                    .volumeTradedToday(data.path("volume").asLong())
                    .totalBuyQuantity(data.path("total_buy_quantity").asLong())
                    .totalSellQuantity(data.path("total_sell_quantity").asLong())
                    .upperCircuit(data.path("upper_circuit_limit").asDouble())
                    .lowerCircuit(data.path("lower_circuit_limit").asDouble())
                    .impliedVolatility(null)
                    .marketLevel(getMarketQuoteDepth(data))
                    .build();


            LtpcDataDTO ltpcDataDTO = LtpcDataDTO.builder()
                    .instrumentKey(fullfeedDTO.getInstrumentKey())
                    .lastTradedPrice(fullfeedDTO.getLastTradedPrice())
                    .lastTradedTime(fullfeedDTO.getLastTradedTime())
                    .closePrice(fullfeedDTO.getClosePrice())
                    .build();
            fullFeedResponseMap.put(fullfeedDTO.getInstrumentKey(), fullfeedDTO);
            ltpcResponseMap.put(ltpcDataDTO.getInstrumentKey(), ltpcDataDTO);
            redisTemplate.opsForValue().set("LTPC:" + ltpcDataDTO.getInstrumentKey(), ltpcDataDTO, Duration.ofHours(2));
            redisTemplate.opsForValue().set("FULL:" + fullfeedDTO.getInstrumentKey(), fullfeedDTO, Duration.ofHours(2));
        }
    }

    private List<QuoteDTO> getMarketQuoteDepth(JsonNode data) {
        List<QuoteDTO> marketLevelQuotes = new ArrayList<>();
        JsonNode depthNode = data.path("depth");
        JsonNode buyNode = depthNode.path("buy");
        JsonNode sellNode = depthNode.path("sell");

        for (int i = 0; i < 5; i++) {
            marketLevelQuotes.add(QuoteDTO.builder()
                    .bidQuantity(buyNode.path(i).path("quantity").asInt(0))
                    .bidPrice(BigDecimal.valueOf(buyNode.path(i).path("price").asDouble(0.0)))
                    .askQuantity(sellNode.path(i).path("quantity").asInt(0))
                    .askPrice(BigDecimal.valueOf(sellNode.path(i).path("price").asDouble(0.0)))
                    .build());
        }
        return marketLevelQuotes;
    }

    private List<String> getRedisSyntaxKeys(List<String> instrumentKeyList, String mode) {
        return instrumentKeyList.stream()
                .map((eachKey) -> (mode + eachKey))
                .toList();
    }
}
