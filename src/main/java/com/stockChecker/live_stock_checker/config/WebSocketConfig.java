package com.stockChecker.live_stock_checker.config;

import com.stockChecker.live_stock_checker.websocket.BroadcastHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final BroadcastHandler broadcastHandler;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(broadcastHandler, "/wss/market")
                .setAllowedOrigins(frontendUrl);
    }
}
