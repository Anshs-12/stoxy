package com.stockChecker.live_stock_checker.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeData;
import com.stockChecker.live_stock_checker.payload.UpstoxPayload.UpstoxSubscribeRequest;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.FullFeedDataDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.service.IndexService;
import com.stockChecker.live_stock_checker.service.MarketStatusService;
import com.stockChecker.live_stock_checker.service.TickerService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
//@RequiredArgsConstructor
public class BroadcastHandler extends TextWebSocketHandler {


//    private final ObjectMapper objectMapper;
//    private final TickerService tickerService;
//    private final MarketStatusService marketStatusService;

    private final ObjectMapper objectMapper;
    private final TickerService tickerService;
    private final MarketStatusService marketStatusService;
    private final IndexService indexService;

    public BroadcastHandler(ObjectMapper objectMapper,
                            @Lazy TickerService tickerService, //  TODO: refactor architecture to remove Lazy injection
                            MarketStatusService marketStatusService,
                            IndexService indexService) {
        this.objectMapper = objectMapper;
        this.tickerService = tickerService;
        this.marketStatusService = marketStatusService;
        this.indexService = indexService;
    }

    // List of all the browsers which subscribed through websockets
    private final CopyOnWriteArrayList<WebSocketSession> browserSessionList = new CopyOnWriteArrayList<>();

    // instrumentKey -> sessions subscribed to it
    private final Map<String, Set<WebSocketSession>> instrumentSubscribers = new ConcurrentHashMap<>();

    // sessionId -> instrumentKeys it subscribed to (for cleanup on disconnect)
    private final Map<String, Set<String>> sessionSubscriptions = new ConcurrentHashMap<>();

    // marquee indices that should always be sent to clients, even if they unsubscribe
    private Set<String> marqueeKeys = new HashSet<>();

    @PostConstruct
    public void init() {
        marqueeKeys = new HashSet<>(indexService.getMarqueeIndices());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        if (!marketStatusService.isMarketOpen().getIsOpen()) {
            log.warn("Attempt to connect to closed market from session: {}", session.getId());
            session.close(new CloseStatus(4000, "Market closed"));
            return;
        }
        log.info("WebSocket connection established: {}", session.getId());
        browserSessionList.add(session);
        // init empty subscription set for this session
        sessionSubscriptions.put(session.getId(), ConcurrentHashMap.newKeySet());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received message from session {}: {}", session.getId(), payload);
        UpstoxSubscribeData subscribeData;
        UpstoxSubscribeRequest subscribeRequest;
        try {
            subscribeRequest = objectMapper.readValue(payload, UpstoxSubscribeRequest.class);
            subscribeData = subscribeRequest.getData();
        } catch (JsonProcessingException e) { // NEW: guard against malformed JSON from client
            log.warn("Malformed subscribe message from session {}: {}", session.getId(), e.getMessage());
            return;
        }

        List<String> keys = subscribeData.getInstrumentKeys();

        // if it's an unsubscribe message, remove session from maps and stop
        if ("unsub".equalsIgnoreCase(subscribeRequest.getMethod())) {
            for (String key : keys) {
                if (marqueeKeys.contains(key)) continue; // never unsub marquee indices
                Set<WebSocketSession> subs = instrumentSubscribers.get(key);
                if (subs != null) {
                    log.info("Session {} unsubscribed from {}", session.getId(), key);
                    subs.remove(session);
                    if (subs.isEmpty()) {
                        log.info("No more subscribers for {}, removing from instrumentSubscribers map", key);
                        instrumentSubscribers.remove(key);
                    }
                }
                log.info("Removing {} from sessionSubscriptions for session {}", key, session.getId());
                sessionSubscriptions.get(session.getId()).remove(key);
            }
            return;
        }

        // register this session against each instrument key in both maps
        for (String key : keys) {
            instrumentSubscribers.computeIfAbsent(key, k -> ConcurrentHashMap.newKeySet()).add(session);
            sessionSubscriptions.get(session.getId()).add(key);
            log.info("Session {} subscribed to {}", session.getId(), key);
        }

        try {
            if (subscribeData.getMode().equalsIgnoreCase("ltpc")) {
                log.info("Session {} requested LTPC data for keys: {}", session.getId(), keys);
                tickerService.getLiveLtpcData(keys);
            } else if (subscribeData.getMode().equalsIgnoreCase("fullFeed")) {
                log.info("Session {} requested Full Feed data for keys: {}", session.getId(), keys);
                tickerService.getLiveFullFeedData(keys);
            }
        } catch (Exception e) {
            // if the TickerService call fails, log the error but don't crash the WebSocket session
            log.warn("TickerService call failed for keys {}: {}", keys, e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        browserSessionList.remove(session);

        // cleanup — remove this session from every instrument it was subscribed to
        Set<String> subscribedInstrumentKeys = sessionSubscriptions.remove(session.getId());
        if (subscribedInstrumentKeys != null) {
            for (String key : subscribedInstrumentKeys) {
                Set<WebSocketSession> subs = instrumentSubscribers.get(key);
                if (subs != null) {
                    log.info("Removing session {} from subscribers of {}", session.getId(), key);
                    subs.remove(session);
                    if (subs.isEmpty()) {
                        log.info("No more subscribers for {}, removing from instrumentSubscribers map", key);
                        instrumentSubscribers.remove(key); // no one left subscribed to this key, drop the entry
                    }
                }
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.warn("Transport error on session {}: {}", session.getId(), exception.getMessage());
    }

    public void broadcastTick(String instrumentKey, LtpcDataDTO ltpcDataDTO, FullFeedDataDTO fullFeedDataDTO) {
        Set<WebSocketSession> subscribers = instrumentSubscribers.get(instrumentKey);
        if (subscribers == null || subscribers.isEmpty()) {
            log.debug("Broadcast skipped for {}: no subscribers.", instrumentKey);
            return; // nobody subscribed to this instrument, skip entirely
        }
        boolean hasFullFeed = fullFeedDataDTO != null;
        try {
            TextMessage ltpcPayload = new TextMessage(objectMapper.writeValueAsString(ltpcDataDTO));
            TextMessage fullFeedPayload = hasFullFeed
                    ? new TextMessage(objectMapper.writeValueAsString(fullFeedDataDTO))
                    : null;
            for (var browserSession : subscribers) { // CHANGED: was browserSessionList, now only interested sessions
                if (!browserSession.isOpen()) {
                    log.info("Skipping closed session {} for instrument {}.", browserSession.getId(), instrumentKey);
                    continue;
                }
                try {
                    if (hasFullFeed) {
//                        log.info("Broadcasting Full Feed data for {} to session {}.", instrumentKey, browserSession.getId());
                        browserSession.sendMessage(fullFeedPayload);
                    }
//                    log.info("Broadcasting LTPC data for {} to session {}.", instrumentKey, browserSession.getId());
                    browserSession.sendMessage(ltpcPayload);
                } catch (IOException e) {
                    log.warn("Failed to send WebSocket message to session {}: {}", browserSession.getId(), e.getMessage(), e);
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize WebSocket payload.", e);
        }
    }
}
