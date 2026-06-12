package com.stockChecker.live_stock_checker.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketManager {
    //  TODO: refactor architecture to remove Lazy injection
    @Lazy
    @Autowired
    private UpstoxWebSocketClient upstoxWebSocketClient;
    private final TaskScheduler taskScheduler;

    public void handleDisconnect(int statusCode) {
        log.warn("Disconnect received. Code: {}. Reconnect in 5s...", statusCode);
        taskScheduler.schedule(new Runnable() {
            @Override
            public void run() {
                reconnect();
            }
        }, Instant.now().plusSeconds(5));
    }

    private void reconnect() {
        try {
            upstoxWebSocketClient.connectWebsocketToUpstox();
            log.info("Reconnect successful.");
        } catch (Exception e) {
            log.error("Reconnect failed: {}. Retrying in 5s...", e.getMessage());
            handleDisconnect(1006);
        }
    }
}