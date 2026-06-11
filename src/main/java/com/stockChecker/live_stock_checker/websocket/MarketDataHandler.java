package com.stockChecker.live_stock_checker.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.InvalidProtocolBufferException;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.QuoteDTO;
import com.stockChecker.live_stock_checker.service.IndexService;
import com.upstox.marketdatafeederv3udapi.rpc.proto.MarketDataFeedV3;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@RequiredArgsConstructor
@Component
@Slf4j
public class MarketDataHandler implements WebSocket.Listener {

    private final IndexService indexService;
    private final ObjectMapper objectMapper;
    private final WebSocketManager webSocketManager;

    private final RedisTemplate<String, Object> redisTemplate;

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    @Override
    public void onOpen(WebSocket webSocket) {
        webSocket.request(1);
    }

    @Override
    public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
        if (statusCode == 1000) {
            log.info("WebSocket closed gracefully. Reason: {}", reason);
        } else {
            webSocketManager.handleDisconnect(statusCode);
            log.warn("Websocket connection killed violently! Code: {}", statusCode);
        }
        return null;
    }

    @Override
    public void onError(WebSocket webSocket, Throwable error) {
        log.error("FATAL: WebSocket network layer failure. Reason: {}", error.getMessage(), error);
    }

    @Override
    public CompletionStage<?> onBinary(WebSocket webSocket,
                                       ByteBuffer data,
                                       boolean last) {
        int remainingBytes = data.remaining();
        byte[] payloadBytes = new byte[remainingBytes];
        data.get(payloadBytes); // scooping out entire data

        try {
            MarketDataFeedV3.FeedResponse response = MarketDataFeedV3.FeedResponse.parseFrom(payloadBytes);
            if (response.getType() == MarketDataFeedV3.Type.live_feed) {
                Map<String, MarketDataFeedV3.Feed> responseFeedsMap = response.getFeedsMap();
                for (String instrumentKey : responseFeedsMap.keySet()) {
                    MarketDataFeedV3.Feed stockData = responseFeedsMap.get(instrumentKey);
                    if (stockData.hasLtpc()) {
                        LtpcDataDTO ltpcPayload = generateLtpcDTO(instrumentKey, stockData.getLtpc());
                        redisTemplate.opsForValue().set("LTPC:" + instrumentKey, ltpcPayload, Duration.ofMinutes(3));
                    } else if (stockData.hasFullFeed()) {
                        LtpcDataDTO ltpcPayload = generateLtpcDTO(instrumentKey, stockData.getFullFeed().getMarketFF().getLtpc());
                        redisTemplate.opsForValue().set("LTPC:" + instrumentKey, ltpcPayload, Duration.ofMinutes(3));

                        FullFeedDataDTO fullFeedPayload = generateFullFeedDTO(instrumentKey, stockData);
                        redisTemplate.opsForValue().set("FULL:" + instrumentKey, fullFeedPayload, Duration.ofMinutes(3));
                    }
                }
            }
            webSocket.request(1);
        } catch (InvalidProtocolBufferException e) {
            // Throwing error is avoided, Request the next frame to keep the stream alive.
            webSocket.request(1);
        }
        return null;
    }

    private LtpcDataDTO generateLtpcDTO(String instrumentKey, MarketDataFeedV3.LTPC rawLtpcData) {
        return LtpcDataDTO.builder().instrumentKey(instrumentKey)
                .lastTradedPrice(BigDecimal.valueOf(rawLtpcData.getLtp()))
                .lastTradedTime((rawLtpcData.getLtt()))
                .closePrice(BigDecimal.valueOf(rawLtpcData.getCp()))
                .build();
    }

    private FullFeedDataDTO generateFullFeedDTO(String instrumentKey, MarketDataFeedV3.Feed stockData) {
        return FullFeedDataDTO.builder()
                .instrumentKey(instrumentKey)
                .lastTradedPrice(BigDecimal.valueOf(stockData.getFullFeed().getMarketFF().getLtpc().getLtp()))
                .lastTradedTime(stockData.getFullFeed().getMarketFF().getLtpc().getLtt())
                .closePrice(BigDecimal.valueOf(stockData.getFullFeed().getMarketFF().getLtpc().getCp()))
                .marketLevel(getMarketLevelQuoteList(stockData.getFullFeed().getMarketFF().getMarketLevel()))
                .averageTradedPrice(BigDecimal.valueOf(stockData.getFullFeed().getMarketFF().getAtp()))
                .volumeTradedToday(stockData.getFullFeed().getMarketFF().getVtt())
                .openInterest(BigDecimal.valueOf(stockData.getFullFeed().getMarketFF().getOi()))
                .impliedVolatility(BigDecimal.valueOf(stockData.getFullFeed().getMarketFF().getIv()))
                .totalBuyQuantity((long) stockData.getFullFeed().getMarketFF().getTbq())
                .totalSellQuantity((long) stockData.getFullFeed().getMarketFF().getTsq())
                .build();
    }

    private List<QuoteDTO> getMarketLevelQuoteList(MarketDataFeedV3.MarketLevel marketLevel) {
        List<QuoteDTO> responseList = new ArrayList<>();
        for (var eachItem : marketLevel.getBidAskQuoteList()) {
            QuoteDTO eachQuoteDTO = QuoteDTO.builder()
                    .bidQuantity(eachItem.getBidQ())
                    .bidPrice(BigDecimal.valueOf(eachItem.getBidP()))
                    .askQuantity(eachItem.getAskQ())
                    .askPrice(BigDecimal.valueOf(eachItem.getAskP()))
                    .build();
            responseList.add(eachQuoteDTO);
        }
        return responseList;
    }
}
